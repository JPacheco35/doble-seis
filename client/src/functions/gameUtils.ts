// gameUtils.ts: helper functions for the Game component moved into another file for readability

import { GameState } from '../types/gameTypes.ts';


// returns the indices of the player's hand that are valid to play based on the current game state
export function getValidIndices(gameState: GameState | null): number[] {

    // no game state, no valid indices (this should never run)
    if (!gameState) return [];

    // get the relevant parts of the game state for determining valid moves
    const { hand, leftEnd, rightEnd, board, roundNumber } = gameState;

    // case: player makes the first move of the game (round 1, turn 1) --> 6-6 is the ONLY valid option
    if (board.length === 0 && roundNumber === 1) {
        return hand
            .map((_, i) => i)
            .filter((i) => hand[i].left === 6 && hand[i].right === 6);
    }

    // case: player goes first in the round (round n>1, turn 1) --> ALL moves are valid
    if (board.length === 0) return hand.map((_, i) => i);

    // otherwise: all domnoes with at least 1 of the 2 ends of the board
    return hand.reduce((acc: number[], d, i) => {
        if (
            d.left === leftEnd ||
            d.right === leftEnd ||
            d.left === rightEnd ||
            d.right === rightEnd
        ) {
            acc.push(i);
        }
        return acc;
    }, []);
}


// return the players seated around the table in clockwise order based on the playerOrder in the Game state
// the result is the seated players look differnt for each player, but is consisntant with the clockwise ordering
export function getSeatedPlayers(gameState: GameState | null, playerId: string | null) {

    // no game state, no seated players (this should never run)
    if (!gameState) return { bottom: null, left: null, top: null, right: null };

    // get current player in the game state
    const me = gameState.players.find((p) => p.playerId === playerId);
    if (!me) return { bottom: null, left: null, top: null, right: null }; // this should never happen

    // get current player order and define the ordering as starting from them
    const myIndex = gameState.players.indexOf(me);
    const order = [0, 1, 2, 3].map((offset) => gameState.players[(myIndex + offset) % 4]);

    // order[0] is you the player
    // order[1] is the player to the left of you -- player who goes after you
    // order[2] is the player to across from you -- your teammate
    // order[3] is the player to the right of you -- player who goes before you
    return { bottom: order[0], left: order[1], top: order[2], right: order[3] };
}

// return the percentage of the timer that is left (n/30) --> x%
export function getTimerPct(timeLeft: number | null, maxSeconds = 30): number {
    return timeLeft !== null ? (timeLeft / maxSeconds) * 100 : 100;
}

// get the color of the timer based on the percentage of the timer that is left
export function getTimerColor(timerPct: number): string {
    if (timerPct < 20) return '#e05555';
    if (timerPct < 50) return '#f4a042';
    return '#4caf50';
}