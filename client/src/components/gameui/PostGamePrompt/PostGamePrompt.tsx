import React from 'react';
import { GameState } from '../../../types/Game.ts';

interface PostGamePromptProps {
    gameOver: { winner: number; scores: { 1: number; 2: number } } | null;
    gameState: GameState | null;
    bootTimer: number;
    onLeave: () => void;
    playerNameColor?: string;
}

function formatBoot(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function getTeamLabel(team: number) {
    return team === 1 ? 'Blue Team' : 'Red Team';
}

export default function PostGamePrompt({gameOver, gameState, bootTimer, onLeave, playerNameColor = '#ffc94a',}: PostGamePromptProps) {
    if (!gameOver || !gameState) return null;

    const currentRound = gameState.roundNumber ?? 1;

    return (
        <div
            className="game-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.87)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
        }}>
            <div
                className="game-dialog-card"
                style={{
                    borderRadius: 6,
                    padding: '24px 32px',
                    textAlign: 'center',
                    width: 300,
                }}
            >
                <div style={{
                    fontSize: 28,
                    color: '#f4b942',
                    letterSpacing: '0.1em',
                    marginBottom: 2
                    }}
                >
                    {getTeamLabel(gameOver.winner).toUpperCase()} WINS!
                </div>

                <div style={{
                    fontFamily: 'KomikaTitle, sans-serif',
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    color: 'rgba(235,218,165,0.66)',
                    textTransform: 'uppercase',
                    marginBottom: 18
                    }}
                >
                    Final Score · Round {currentRound}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 14
                    }}
                >
                    {[1, 2].map(t => (
                        <div
                            key={t}
                            style={{
                                borderRadius: 4,
                                padding: '10px',
                                border: `1px solid ${t === 1 ? 'rgba(74,144,217,0.28)' : 'rgba(217,112,74,0.28)'}`,
                                background: t === 1 ? 'rgba(74,144,217,0.05)' : 'rgba(217,112,74,0.05)',
                        }}>
                            <div
                                style={{
                                    fontSize: 10,
                                    letterSpacing: '0.14em',
                                    color: t === 1 ? '#88c0f0' : '#f0956a',
                                    marginBottom: 2
                                }}
                            >
                                {getTeamLabel(t).toUpperCase()}
                            </div>

                            <div style={{
                                fontSize: 24,
                                color: t === 1 ? '#88c0f0' : '#f0956a',
                                marginBottom: 5
                                }}
                            >
                                {gameOver.scores[t as 1 | 2]}
                            </div>

                            {gameState.players.filter(p => p.team === t).map(p => (
                                <div key={p.playerId} style={{
                                    fontFamily: 'KomikaTitle, sans-serif',
                                    fontSize: 9,
                                    color: playerNameColor,
                                    textShadow: '0 0 5px rgba(255,201,74,0.22)',
                                }}>
                                    {p.username}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div style={{
                    fontFamily: 'KomikaTitle, sans-serif',
                    fontSize: 9,
                    color: 'rgba(235,218,165,0.62)',
                    marginBottom: 12
                    }}
                >
                    Returning to lobby in {formatBoot(bootTimer)}
                </div>

                <div
                    className="game-dialog-leave-btn"
                    onClick={onLeave}
                    style={{
                        display: 'inline-block',
                        padding: '7px 20px',
                        borderRadius: 3,
                        fontSize: 13,
                        letterSpacing: '0.12em',
                        cursor: 'pointer',
                    }}
                >
                    LEAVE GAME
                </div>
            </div>
        </div>
    );
}