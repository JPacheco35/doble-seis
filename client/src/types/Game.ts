export interface Player {
    playerId: string;
    username: string;
    team: number;
    handSize: number;
    points: number;
}

export interface Domino {
    left: number;
    right: number;
}

export interface BoardDomino extends Domino {
    placedBy: string;
}

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

export interface ScorePayload {
    scores: { 1: number; 2: number };
    playerScores?: Record<string, number>;
}

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

export interface LogEntry {
    id: number;
    text: string;
    type: 'play' | 'knock' | 'score' | 'system' | 'auto';
    player?: string;
    domino?: Domino;
    outcome?: 'win' | 'lose';
    isFreeKnock?: boolean;
}