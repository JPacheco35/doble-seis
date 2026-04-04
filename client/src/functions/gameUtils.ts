/**
 * gameUtils.ts
 *
 * Utility functions for running game logic for:
 * - finding valid moves for player
 * - calculating seat postions for other players
 * - timer display
 *
 * These utilities are used by the Game component (/src/components/pages/Game/Game.tsx)
 */

import { GameState } from '../types/gameTypes.ts';

/**
 * Returns the indices of the player's current hand that are valid moves
 *
 * validation rules:
 * - round 1, 1st move: Only the 6-6 domino is valid (game server is hardcoded to make sure this player will always go first)
 * - all other rounds, 1st move (empty board): all dominoes are valid
 * - subsequent moves: all dominoes matching the left or right board (or both) end value(s)
 *
 * @param gameState - current game state (null returns empty array)
 * @returns array of valid hand indices that can be played
 * @example
 * getValidIndices(gameState) // [0, 3, 5] - the 1st, 4th, and 6th dominoes in this hand are valid moves
 */
export function getValidIndices(gameState: GameState | null): number[] {

    // Check: no game state, no valid indices (this should never run)
    if (!gameState) return [];

    const { hand, leftEnd, rightEnd, board, roundNumber } = gameState;

    // Case: player makes the first move of the game (round 1, turn 1) --> 6-6 is the ONLY valid option
    if (board.length === 0 && roundNumber === 1) {
        return hand
            .map((_, i) => i)
            .filter((i) => hand[i].left === 6 && hand[i].right === 6);
    }

    // Case: player goes first in the round (round n>1, turn 1) --> ALL moves are valid
    if (board.length === 0) return hand.map((_, i) => i);

    // Case: regular play --> all domnoes matching the leftEnd OR rightEnd
    return hand.reduce((acc: number[], d, i) => {
        if (
            d.left === leftEnd || d.right === leftEnd ||
            d.left === rightEnd || d.right === rightEnd
        )
        { acc.push(i); }
        return acc;
    }, []);
}


/**
 * Returns the player positions around the table in a consistent order relative to the turn order
 *
 * the return positions are defined as:
 * - bottom: the current player (you)
 * - left: the player that goes after you (opponent)
 * - top: your teammate (goes after left and before right)
 * - right: the player that goes before you (opponent)
 *
 * This ensures UI layout is consistent regardless of which seats the player occupies
 *
 * @param gameState - current game state (null reutrns all nulls)
 * @param playerId - The current player's ID (null returns all nulls)
 * @returns Object with players at each position {bottom, left, top, right}
 * @example
 * getSeatedPlayers(gameState, playerId) -->
 * { bottom: currentPlayer, left: nextPlayer, top: teammate, right: prevPlayer }
 */
export function getSeatedPlayers(gameState: GameState | null, playerId: string | null) {

    // Check: no game state --> no seated players (this should never run)
    if (!gameState) return { bottom: null, left: null, top: null, right: null };

    // find the current player in the game state
    const currentPlayer = gameState.players.find((p) => p.playerId === playerId);
    if (!currentPlayer) return { bottom: null, left: null, top: null, right: null }; // this should never happen

    // Create rotation starting my the currentPlayer
    const myIndex = gameState.players.indexOf(currentPlayer);
    const order = [0, 1, 2, 3].map((offset) => gameState.players[(myIndex + offset) % 4]);

    // order[0] is you the player
    // order[1] is the player to the left of you -- nextPlayer
    // order[2] is the player to across from you -- teammate
    // order[3] is the player to the right of you -- prevPlayer
    return { bottom: order[0], left: order[1], top: order[2], right: order[3] };
}


/**
 * Calculates the timer's remaining percentage for progress bar display.
 *
 * defaults to 100% if timeLeft is null
 *
 * @param timeLeft - seconds remaining on the timer (or null if inactive)
 * @param maxSeconds - total seconds in the timer (default: 30s per turn)
 * @returns percentage of time remaniing (0%-100%)
 * @example
 * getTimerPct(15, 30) --> 50 (50% remaining)
 * getTimerPct(5, 30) --> 16.67 (17% remaining)
 */
export function getTimerPct(timeLeft: number | null, maxSeconds = 30): number {
    return timeLeft !== null ? (timeLeft / maxSeconds) * 100 : 100;
}

/**
 * Returns a color code based on the timer's remaining percentage.
 *
 * color scheme indicates urgency:
 * - green (>50%): OKAY
 * - orange (20-50%): WARNING
 * - red (<20%): DANGER
 *
 * @param timerPct - timer percentage (0-100)
 * @returns rbg color code (#RRGGBB)
 * @example
 * getTimerColor(75) --> '#4caf50' (green)
 * getTimerColor(35) --> '#f4a042' (orange)
 * getTimerColor(10) --> '#e05555' (red)
 */
export function getTimerColor(timerPct: number): string {
    if (timerPct < 20) return '#e05555';    // 0%-20%  - DANGER (Red)
    if (timerPct < 50) return '#f4a042';    // 20-50%  - WARNING (Orange)
    return '#4caf50';                       // 50-100% - OKAY (Green)
}