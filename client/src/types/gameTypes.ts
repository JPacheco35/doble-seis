// various important type interfaces

/** Single domino pip {left: 0-6, right: 0-6} */
export interface Domino {
  left: number;
  right: number;
}


/** Single Domino placed on the board */
export interface BoardDomino extends Domino {
  placedBy: string;   // playerId of the Player that placed this domino
}


/** Player Data during a game session, this is used by ALL players */
export interface Player {
    playerId: string;     // Unique ID from server
    username: string;     // Player Username
    team: number;         // 1 or 2, what team is Player on
    handSize: number;     // How large is the player's hand (for display purposes, not actual hand data)
    points: number;       // How many points has this player scored in the current game
}


/** Full game snapshot. Sent to clients on state change.
 * Invariant: board is ordered [oldest..newest].
 */
export interface GameState {
    board: BoardDomino[];                 // the domino board, what has been played so far
    hand: Domino[];                       // the player's current hand (has actual hand data)
    currentTurn: string;                  // the playerId of whose turn it is
    scores: { 1: number; 2: number };     // team scores
    leftEnd: number | null;               // value on the left end of the board
    rightEnd: number | null;              // value on the right end of the board
    players: Player[];                    // Player Data of all players in the game
    roundNumber: number;                  // round number, game starts at 1
}


/** Scoreboard Payload, sent to server when the score needs to be updated */
export interface ScorePayload {
    scores: {                                 // team scores
      1: number;                                // team1 score
      2: number                                 // team2 score
    };

    playerScores?: Record<string, number>;    // optional player scores
}


/** End of Round Status, sent to all players when round is over */
export interface RoundEndedPayload extends ScorePayload {
    tally: number;                // total value of outstanding pips
    points: number;               // point value of the tally (10pts of tally --> 1pt) (5&below = round down) (6&above = round up)
    winningTeam: number | null;   // which team won this round (and the points)
    nextRoundInSec?: number;      // countdown until next round starts (default = 15s)
}


/** Domino Placement Data, sent to all players when a move is made */
export interface DominoPlacedPayload {
    playerId: string;           // playerId of the player that made the move
    placedDomino?: Domino;      // which domino was placed
    moveNumber?: number;        // move number of this placement (1st? 4th? 15?)
    side?: 'left' | 'right';    // side this domino placed on
    board: BoardDomino[];       // the current domino board
    leftEnd: number | null;     // left end value of the board
    rightEnd: number | null;    // right end value of the board
    autoPlayed: boolean;        // was this move an autoplay (AFK timeout)
}


/** Log Entry Data, sent to all clients to keep a record of all moves in the current round */
export interface LogEntry {
    id: number;                   // unique entry id for animations and key
    text: string;                 // text to display in the log, varies based on type (see below)
    type:                         // type of event
      'play' |                      // [PLAYER1] played X-X
      'knock' |                     // [PLAYER1] knocked, X points awarded to [OPPOSING-TEAM]
      'score' |                     // idk?
      'system' |                    // Round Started/Ended, Free Knocks
      'auto';                       // [PLAYER1] auto-played X-X
    player?: string;              // playerId of the player performing the action
    domino?: Domino;              // domino that was played (if applicable)
    outcome?: 'win' | 'lose';     // is this outcome a win or loss for the player's team
    isFreeKnock?: boolean;        // is this a free knock? (no points awarded to opposing team)
}