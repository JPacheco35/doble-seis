// generate a deck of 28 dominoes
function generateDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({ left: i, right: j });
        }
    }
    return deck;
}


// shuffle the deck
function shuffle(deck) {
    const d = [...deck];
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}


// deal out 7 dominoes to each player
function deal(playerOrder) {
    const deck = shuffle(generateDeck());
    const hands = {};
    playerOrder.forEach((playerId, i) => {
        hands[playerId] = deck.slice(i * 7, (i + 1) * 7);
    });
    return hands;
}


// FIRST ROUND ONLY: player with 6-6 starts, set starting order for the game
function findOpenerIndex(playerOrder, hands, roundNumber, lastOpenerIndex) {
    if (roundNumber === 1) {
        // whoever has the double-six opens
        for (let i = 0; i < playerOrder.length; i++) {
            const has66 = hands[playerOrder[i]].some(d => d.left === 6 && d.right === 6);
            if (has66) return i;
        }
    }
    // subsequent rounds — next player clockwise
    return (lastOpenerIndex + 1) % playerOrder.length;
}


// return all valid moves for a player's hand
function getValidMoves(hand, leftEnd, rightEnd) {
    if (leftEnd === null && rightEnd === null) return hand; // first move
    return hand.filter(d =>
        d.left === leftEnd || d.right === leftEnd ||
        d.left === rightEnd || d.right === rightEnd
    );
}


// return true if the move is valid, false otherwise
function isValidMove(domino, leftEnd, rightEnd, side) {
    if (leftEnd === null) return true; // first move
    if (side === 'left') return domino.left === leftEnd || domino.right === leftEnd;
    if (side === 'right') return domino.left === rightEnd || domino.right === rightEnd;
    return false;
}


// apply move to the board, update game state accordingly
function applyMove(game, dominoIndex, side) {
    const playerId = game.playerOrder[game.currentTurnIndex];
    const hand = game.hands[playerId];
    const domino = hand[dominoIndex];

    if (game.board.length === 0) {
        // first domino placed
        game.board.push({ left: domino.left, right: domino.right, placedBy: playerId });
        game.leftEnd = domino.left;
        game.rightEnd = domino.right;
    } else if (side === 'left') {
        if (domino.right === game.leftEnd) {
            game.board.unshift({ left: domino.left, right: domino.right, placedBy: playerId });
            game.leftEnd = domino.left;
        } else {
            game.board.unshift({ left: domino.right, right: domino.left, placedBy: playerId });
            game.leftEnd = domino.right;
        }
    } else {
        if (domino.left === game.rightEnd) {
            game.board.push({ left: domino.left, right: domino.right, placedBy: playerId });
            game.rightEnd = domino.right;
        } else {
            game.board.push({ left: domino.right, right: domino.left, placedBy: playerId });
            game.rightEnd = domino.left;
        }
    }

    hand.splice(dominoIndex, 1);
    game.consecutiveKnocks = 0;

    return playerId;
}


// calculate the total outstanding tally
function calcTally(game) {
    let tally = 0;
    game.playerOrder.forEach(pid => {
        game.hands[pid].forEach(d => { tally += d.left + d.right; });
    });
    return tally;
}

// covert outstanding tally to points
function tallyToPoints(tally) {
    const remainder = tally % 10;
    return remainder >= 6 ? Math.ceil(tally / 10) : Math.floor(tally / 10);
}


// return team of a player
function getTeamOf(game, playerId) {
    if (game.teams[1].includes(playerId)) return 1;
    if (game.teams[2].includes(playerId)) return 2;
    return null;
}

function getOpposingTeam(team) {
    return team === 1 ? 2 : 1;
}


// how to break tie in the case of a lock
function hardLockTiebreaker(game) {

    // sum pips per player
    const pipCounts = {};
    game.playerOrder.forEach(pid => {
        pipCounts[pid] = game.hands[pid].reduce((sum, d) => sum + d.left + d.right, 0);
    });

    // sort all players by pip count ascending
    const sorted = [...game.playerOrder].sort((a, b) => pipCounts[a] - pipCounts[b]);

    // lowest pip's team wins
    const lowestPlayer = sorted[0];
    const lowestTeam = getTeamOf(game, lowestPlayer);

    // check if the other team also has a player with the same count
    const lowestCount = pipCounts[lowestPlayer];
    const tied = sorted.filter(p => pipCounts[p] === lowestCount);

    // no ties --> lowest pip wins
    if (tied.length === 1) return lowestTeam;

    // tiebreak: 2nd lowest individual pip
    const secondLowest = sorted[1];
    const secondTeam = getTeamOf(game, secondLowest);

    // still tied at this point --> no winner of tally
    if (secondTeam !== lowestTeam) return null;

    return lowestTeam;
}

module.exports = {
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
};