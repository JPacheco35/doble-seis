import React from 'react';
import {GameState} from "../../../types/Game.ts";

interface ScoreboardProps {
    gameState: GameState;
    currentRound: number;
}

const PLAYER_NAME_COLOR = '#ffc94a';

export default function Scoreboard({gameState, currentRound}: ScoreboardProps) {
    return (
        <div>
            <div className="game-right-panel-meta" style={{
                display: 'flex', justifyContent: 'space-between', padding: '5px 12px',
                fontSize: 9, letterSpacing: '0.12em', color: 'rgba(200,184,122,0.28)',
            }}>
                <span>round <span style={{ color: 'rgba(244,184,66,0.48)', fontSize: 10 }}>{currentRound}</span></span>
                <span>first to<span style={{ color: 'rgba(244,184,66,0.48)', fontSize: 10 }}>20</span></span>
            </div>

            <div className="game-right-panel-scores" style={{ padding: '9px 12px' }}>
                {[1, 2].map(t => (
                    <div key={t} style={{ marginBottom: t === 1 ? 8 : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                            <span style={{ fontSize: 10, letterSpacing: '0.1em', color: t === 1 ? '#88c0f0' : '#f0956a' }}>TEAM {t}</span>
                            <span style={{ fontSize: 15, color: t === 1 ? '#88c0f0' : '#f0956a' }}>{gameState.scores[t as 1 | 2]}</span>
                        </div>
                        <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 1, marginBottom: 4, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 1,
                                width: `${Math.min(100, (gameState.scores[t as 1 | 2] / 20) * 100)}%`,
                                background: t === 1 ? '#4a90d9' : '#d9704a', transition: 'width 0.4s ease',
                            }} />
                        </div>
                        {gameState.players.filter(p => p.team === t).map(p => (
                            <div key={p.playerId} style={{
                                display: 'flex', justifyContent: 'space-between',
                                fontFamily: 'KomikaTitle, sans-serif', fontSize: 9,
                                color: PLAYER_NAME_COLOR, letterSpacing: '0.06em', padding: '1px 0',
                                textShadow: '0 0 5px rgba(255,201,74,0.22)',
                            }}>
                                <span>{p.username.toUpperCase()}</span>
                                <span style={{ fontFamily: 'KomikaTitle, sans-serif', fontSize: 10, color: 'rgba(244,184,66,0.4)' }}>{p.points}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}