// various useful types for the game

export interface Player {
    playerId: string;
    username: string;
    team: number;
    handSize: number;
    points: number;
}

// domino in the hand
export interface Domino {
    left: number;
    right: number;
}

// domino on the board
export interface BoardDomino extends Domino {
    placedBy: string;
}

// current state of the game
export interface GameState {
    board: BoardDomino[];
    hand: Domino[];
    currentTurn: string;
    scores: { 1: number; 2: number };
    leftEnd: number | null;
    rightEnd: number | null;
    players: Player[];
    roundNumber: number;
}

// team and player scores
export interface ScorePayload {
    scores: { 1: number; 2: number };
    playerScores?: Record<string, number>;
}


// round end data
export interface RoundEndedPayload extends ScorePayload {
    tally: number;
    points: number;
    winningTeam: number | null;
    nextRoundInSec?: number;
}

// domino placement data
export interface DominoPlacedPayload {
    playerId: string;
    placedDomino?: Domino;
    moveNumber?: number;
    side?: 'left' | 'right';
    board: BoardDomino[];
    leftEnd: number | null;
    rightEnd: number | null;
    autoPlayed: boolean;
}

// log entry data
export interface LogEntry {
    id: number;
    text: string;
    type: 'play' | 'knock' | 'score' | 'system' | 'auto';
    player?: string;
    domino?: Domino;
    outcome?: 'win' | 'lose';
    isFreeKnock?: boolean;
}