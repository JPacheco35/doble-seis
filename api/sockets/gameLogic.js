function generateDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({ left: i, right: j });
        }
    }
    return deck;
}

function shuffle(deck) {
    const d = [...deck];
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}

function deal(playerOrder) {
    const deck = shuffle(generateDeck());
    const hands = {};
    playerOrder.forEach((playerId, i) => {
        hands[playerId] = deck.slice(i * 7, (i + 1) * 7);
    });
    return hands;
}

function findOpenerIndex(playerOrder, hands, roundNumber, lastOpenerIndex) {
    if (roundNumber === 1) {
        for (let i = 0; i < playerOrder.length; i++) {
            const has66 = hands[playerOrder[i]].some(d => d.left === 6 && d.right === 6);
            if (has66) return i;
        }
    }
    return (lastOpenerIndex + 1) % playerOrder.length;
}

function getValidMoves(hand, leftEnd, rightEnd) {
    if (leftEnd === null && rightEnd === null) return [...hand];
    return hand.filter(d =>
        d.left === leftEnd || d.right === leftEnd ||
        d.left === rightEnd || d.right === rightEnd
    );
}

function isValidMove(domino, leftEnd, rightEnd, side) {
    if (leftEnd === null && rightEnd === null) return true;
    if (side === 'left') return domino.left === leftEnd || domino.right === leftEnd;
    if (side === 'right') return domino.left === rightEnd || domino.right === rightEnd;
    return false;
}

function applyMove(game, dominoIndex, side) {
    const playerId = game.playerOrder[game.currentTurnIndex];
    const hand = game.hands[playerId];
    const domino = hand[dominoIndex];

    if (game.board.length === 0) {
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

function calcTally(game) {
    let tally = 0;
    game.playerOrder.forEach(pid => {
        game.hands[pid].forEach(d => { tally += d.left + d.right; });
    });
    return tally;
}

function tallyToPoints(tally) {
    const remainder = tally % 10;
    return remainder >= 6 ? Math.ceil(tally / 10) : Math.floor(tally / 10);
}

function getTeamOf(game, playerId) {
    if (game.teams[1].includes(playerId)) return 1;
    if (game.teams[2].includes(playerId)) return 2;
    return null;
}

function getOpposingTeam(team) {
    return team === 1 ? 2 : 1;
}

function hardLockTiebreaker(game) {
    const pipCounts = {};
    game.playerOrder.forEach(pid => {
        pipCounts[pid] = game.hands[pid].reduce((sum, d) => sum + d.left + d.right, 0);
    });

    const sorted = [...game.playerOrder].sort((a, b) => pipCounts[a] - pipCounts[b]);
    const lowestPlayer = sorted[0];
    const lowestTeam = getTeamOf(game, lowestPlayer);
    const lowestCount = pipCounts[lowestPlayer];
    const tied = sorted.filter(p => pipCounts[p] === lowestCount);

    if (tied.length === 1) return lowestTeam;

    const secondLowest = sorted[1];
    const secondTeam = getTeamOf(game, secondLowest);
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