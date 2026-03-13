const { games } = require('./state.js');
const {
    deal,
    findOpenerIndex,
    getValidMoves,
    isValidMove,
    applyMove,
    calcTally,
    tallyToPoints,
    getTeamOf,
    getOpposingTeam,
    hardLockTiebreaker,
} = require('./gameLogic.js');

const TURN_DURATION = 30000;

// ── Helpers ───────────────────────────────────────────

function broadcastGameState(io, game) {
    game.playerOrder.forEach(pid => {
        const sockets = [...io.of('/game').sockets.values()];
        const playerSocket = sockets.find(s => s.handshake.auth.playerId === pid);
        if (playerSocket) {
            playerSocket.emit('gameState', {
                board: game.board,
                hand: game.hands[pid],
                currentTurn: game.playerOrder[game.currentTurnIndex],
                scores: game.scores,
                leftEnd: game.leftEnd,
                rightEnd: game.rightEnd,
                players: game.playerOrder.map(id => ({
                    playerId: id,
                    username: game.playerInfo[id].username,
                    team: getTeamOf(game, id),
                    handSize: game.hands[id].length,
                })),
            });
        }
    });
}

// ── Turn Timer ────────────────────────────────────────

function startTurnTimer(io, game) {
    clearTimeout(game.turnTimer);

    // tell all clients the timer started
    io.of('/game').to(game.code).emit('timerStarted', {
        currentTurn: game.playerOrder[game.currentTurnIndex],
        duration: TURN_DURATION / 1000,
    });

    game.turnTimer = setTimeout(() => {
        const currentPlayerId = game.playerOrder[game.currentTurnIndex];
        const hand = game.hands[currentPlayerId];
        const validMoves = getValidMoves(hand, game.leftEnd, game.rightEnd);

        if (validMoves.length === 0) {
            processKnock(io, game, currentPlayerId);
            return;
        }

        // round 1 first move must be the 6-6
        let dominoIndex;
        let side = 'right';

        if (game.roundNumber === 1 && game.board.length === 0) {
            const doubleSix = hand.find(d => d.left === 6 && d.right === 6);
            dominoIndex = hand.indexOf(doubleSix);
        } else {
            const domino = validMoves[0];
            dominoIndex = hand.indexOf(domino);
            // figure out which side is valid
            if (game.board.length > 0) {
                const d = hand[dominoIndex];
                if (d.left === game.leftEnd || d.right === game.leftEnd) side = 'left';
            }
        }

        const placerId = applyMove(game, dominoIndex, side);

        io.of('/game').to(game.code).emit('dominoPlaced', {
            playerId: placerId,
            board: game.board,
            leftEnd: game.leftEnd,
            rightEnd: game.rightEnd,
            autoPlayed: true,
        });

        io.of('/game').to(game.code).emit('handSizesUpdated', {
            handSizes: game.playerOrder.reduce((acc, pid) => {
                acc[pid] = game.hands[pid].length;
                return acc;
            }, {}),
        });

        const sockets = [...io.of('/game').sockets.values()];
        const playerSocket = sockets.find(s => s.handshake.auth.playerId === placerId);
        if (playerSocket) playerSocket.emit('handUpdated', { hand: game.hands[placerId] });

        if (game.hands[placerId].length === 0) {
            endRound(io, game, placerId);
            return;
        }

        advanceTurn(io, game);
    }, TURN_DURATION);
}

// ── Advance Turn ──────────────────────────────────────

function advanceTurn(io, game) {
    game.currentTurnIndex = (game.currentTurnIndex + 1) % game.playerOrder.length;
    const nextPlayerId = game.playerOrder[game.currentTurnIndex];

    // immediately auto-knock if no valid moves
    const validMoves = getValidMoves(game.hands[nextPlayerId], game.leftEnd, game.rightEnd);
    if (validMoves.length === 0 && game.board.length > 0) {
        processKnock(io, game, nextPlayerId);
        return;
    }

    io.of('/game').to(game.code).emit('turnChanged', {
        currentTurn: nextPlayerId,
        timeLimit: TURN_DURATION / 1000,
    });

    startTurnTimer(io, game);
}

// ── Knock ─────────────────────────────────────────────

function processKnock(io, game, playerId) {
    const team = getTeamOf(game, playerId);
    const opposingTeam = getOpposingTeam(team);

    const points = game.knockCount === 0 ? 2 : 1;
    game.scores[opposingTeam] += points;
    game.knockCount++;
    game.consecutiveKnocks++;

    io.of('/game').to(game.code).emit('playerKnocked', {
        playerId,
        username: game.playerInfo[playerId].username,
        points,
        scores: game.scores,
        consecutiveKnocks: game.consecutiveKnocks,
    });

    // hard lock — all 4 knocked consecutively
    if (game.consecutiveKnocks >= 4) {
        endRound(io, game, null);
        return;
    }

    // soft lock — 3 knocked, next player is NOT blocked
    if (game.consecutiveKnocks === 3) {
        const nextIndex = (game.currentTurnIndex + 1) % game.playerOrder.length;
        const nextPlayerId = game.playerOrder[nextIndex];
        const nextValidMoves = getValidMoves(game.hands[nextPlayerId], game.leftEnd, game.rightEnd);
        if (nextValidMoves.length > 0) {
            game.scores[getTeamOf(game, playerId)] += 2;
            io.of('/game').to(game.code).emit('softLock', {
                playerId,
                scores: game.scores,
            });
        }
    }

    advanceTurn(io, game);
}

// ── End Round ─────────────────────────────────────────

function endRound(io, game, winnerId) {
    clearTimeout(game.turnTimer);

    const tally = calcTally(game);
    const points = tallyToPoints(tally);
    let winningTeam = null;

    if (winnerId) {
        winningTeam = getTeamOf(game, winnerId);
        game.scores[winningTeam] += points;
    } else {
        winningTeam = hardLockTiebreaker(game);
        if (winningTeam) game.scores[winningTeam] += points;
    }

    io.of('/game').to(game.code).emit('roundEnded', {
        winnerId,
        winningTeam,
        tally,
        points,
        scores: game.scores,
        hands: game.hands,
    });

    if (game.scores[1] >= 20 || game.scores[2] >= 20) {
        const winner = game.scores[1] >= 20 ? 1 : 2;
        io.of('/game').to(game.code).emit('gameOver', {
            winner,
            scores: game.scores,
        });
        delete games[game.code];
        return;
    }

    game.roundNumber++;
    game.lastOpenerIndex = game.currentTurnIndex;
    setTimeout(() => startRound(io, game), 3000);
}

// ── Start Round ───────────────────────────────────────

function startRound(io, game) {
    const hands = deal(game.playerOrder);
    game.hands = hands;
    game.board = [];
    game.leftEnd = null;
    game.rightEnd = null;
    game.consecutiveKnocks = 0;
    game.knockCount = game.knockCount || 0;

    const openerIndex = findOpenerIndex(
        game.playerOrder,
        hands,
        game.roundNumber,
        game.lastOpenerIndex ?? 0
    );
    game.currentTurnIndex = openerIndex;
    game.lastOpenerIndex = openerIndex;

    io.of('/game').to(game.code).emit('roundStarted', {
        roundNumber: game.roundNumber,
        currentTurn: game.playerOrder[openerIndex],
        timeLimit: TURN_DURATION / 1000,
    });

    broadcastGameState(io, game);
    startTurnTimer(io, game);
}

// ── Socket Handlers ───────────────────────────────────

module.exports = (io) => {
    const game = io.of('/game');

    game.on('connection', (socket) => {
        const { playerId, username } = socket.handshake.auth;

        socket.on('joinGame', (code) => {
            const foundGame = games[code];
            if (!foundGame) return socket.emit('gameError', { message: 'Game not found' });

            const inGame = foundGame.players.find(p => p.playerId === playerId);
            if (!inGame) return socket.emit('gameError', { message: 'You are not in this game' });

            socket.join(code);
            console.log(`${username} joined game ${code}`);

            if (!foundGame.board) {
                foundGame.board = [];
                foundGame.leftEnd = null;
                foundGame.rightEnd = null;
                foundGame.scores = { 1: 0, 2: 0 };
                foundGame.knockCount = 0;
                foundGame.consecutiveKnocks = 0;
                foundGame.roundNumber = 1;
                foundGame.lastOpenerIndex = 0;
                foundGame.playerOrder = foundGame.players.map(p => p.playerId);
                foundGame.teams = {
                    1: foundGame.players.filter(p => p.team === 1).map(p => p.playerId),
                    2: foundGame.players.filter(p => p.team === 2).map(p => p.playerId),
                };
                foundGame.playerInfo = {};
                foundGame.players.forEach(p => {
                    foundGame.playerInfo[p.playerId] = { username: p.username };
                });
            }

            const connectedSockets = [...game.sockets.values()].filter(s =>
                foundGame.playerOrder.includes(s.handshake.auth.playerId)
            );

            if (connectedSockets.length === foundGame.playerOrder.length && !foundGame.hands) {
                startRound(io, foundGame);
            } else {
                socket.emit('gameState', {
                    board: foundGame.board,
                    hand: foundGame.hands?.[playerId] ?? [],
                    currentTurn: foundGame.playerOrder?.[foundGame.currentTurnIndex],
                    scores: foundGame.scores,
                    leftEnd: foundGame.leftEnd,
                    rightEnd: foundGame.rightEnd,
                    players: foundGame.playerOrder?.map(id => ({
                        playerId: id,
                        username: foundGame.playerInfo[id].username,
                        team: getTeamOf(foundGame, id),
                        handSize: foundGame.hands?.[id]?.length ?? 7,
                    })),
                });
            }
        });

        socket.on('placeDomino', ({ code, dominoIndex, side }) => {
            const foundGame = games[code];
            if (!foundGame) return;

            if (foundGame.playerOrder[foundGame.currentTurnIndex] !== playerId) {
                return socket.emit('gameError', { message: 'Not your turn' });
            }

            const hand = foundGame.hands[playerId];
            const domino = hand[dominoIndex];
            if (!domino) return socket.emit('gameError', { message: 'Invalid domino' });

            // round 1 first move must be the 6-6
            if (foundGame.roundNumber === 1 && foundGame.board.length === 0) {
                if (domino.left !== 6 || domino.right !== 6) {
                    return socket.emit('gameError', { message: 'You must open with the double-six' });
                }
            }

            if (!isValidMove(domino, foundGame.leftEnd, foundGame.rightEnd, side)) {
                return socket.emit('gameError', { message: 'Invalid move' });
            }

            clearTimeout(foundGame.turnTimer);
            const placerId = applyMove(foundGame, dominoIndex, side);

            game.to(code).emit('dominoPlaced', {
                playerId: placerId,
                board: foundGame.board,
                leftEnd: foundGame.leftEnd,
                rightEnd: foundGame.rightEnd,
                autoPlayed: false,
            });

            socket.emit('handUpdated', { hand: foundGame.hands[placerId] });

            game.to(code).emit('handSizesUpdated', {
                handSizes: foundGame.playerOrder.reduce((acc, pid) => {
                    acc[pid] = foundGame.hands[pid].length;
                    return acc;
                }, {}),
            });

            if (foundGame.hands[placerId].length === 0) {
                endRound(io, foundGame, placerId);
                return;
            }

            advanceTurn(io, foundGame);
        });

        socket.on('disconnect', () => {
            console.log(`${username} disconnected from game`);
        });
    });
};