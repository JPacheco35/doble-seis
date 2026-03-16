import { GameState, Player } from '../../../types/Game.ts';

export function getValidIndices(gameState: GameState | null): number[] {
    if (!gameState) return [];

    const { hand, leftEnd, rightEnd, board, roundNumber } = gameState;

    if (board.length === 0 && roundNumber === 1) {
        return hand
            .map((_, i) => i)
            .filter((i) => hand[i].left === 6 && hand[i].right === 6);
    }

    if (board.length === 0) return hand.map((_, i) => i);

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

export function getSeatedPlayers(gameState: GameState | null, playerId: string | null) {
    if (!gameState) return { bottom: null, left: null, top: null, right: null };

    const me = gameState.players.find((p) => p.playerId === playerId);
    if (!me) return { bottom: null, left: null, top: null, right: null };

    const myIndex = gameState.players.indexOf(me);
    const order = [0, 1, 2, 3].map((offset) => gameState.players[(myIndex + offset) % 4]);

    return { bottom: order[0], left: order[1], top: order[2], right: order[3] };
}

export function getTimerPct(timeLeft: number | null, maxSeconds = 30): number {
    return timeLeft !== null ? (timeLeft / maxSeconds) * 100 : 100;
}

export function getTimerColor(timerPct: number): string {
    if (timerPct < 20) return '#e05555';
    if (timerPct < 50) return '#f4a042';
    return '#4caf50';
}

export function formatBoot(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function getMyTeam(players: Player[], playerId: string | null): number | undefined {
    return players.find((p) => p.playerId === playerId)?.team;
}
