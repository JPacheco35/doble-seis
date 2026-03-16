import React from 'react';
import Logo from "../../ui/Logo/Logo.tsx";

interface GameHeaderProps {
    gameState: any;
    code: string;
    displayUsername: string;
    currentRound: number;
}

export default function GameHeader({gameState, code, displayUsername, currentRound}: GameHeaderProps) {
    return (
        <div
            className="game-header"
            style={{
                gridColumn: '1/-1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                zIndex: 3,
            }}
        >
            <div
                className="game-title"
                style={{
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <Logo fontSize={24} />
            </div>

            <div
                className="game-team-scores"
                style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center'
                }}
            >
                {[1, 2].map(t => (
                    <div key={t} className="game-team-chip" style={{
                        padding: '2px 11px',
                        borderRadius: 3,
                        fontSize: 11,
                        letterSpacing: '0.1em',
                        background: t === 1 ? 'rgba(74,144,217,0.1)' : 'rgba(217,112,74,0.1)',
                        color: t === 1 ? '#88c0f0' : '#f0956a',
                        border: `1px solid ${t === 1 ? 'rgba(74,144,217,0.28)' : 'rgba(217,112,74,0.28)'}`,
                    }}>
                        team {t} — {gameState.scores[t as 1 | 2]} pts
                    </div>
                ))}
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}
            >
              <span className="game-user-chip" style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: 999,
                  color: '#f4e8c1',
                  textTransform: 'uppercase',
              }}>
                {displayUsername}
              </span>

            <div
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4caf50',
                    boxShadow: '0 0 5px #4caf50'
                }}
            />
                <span
                    style={{
                        fontSize: 10,
                        color: 'rgba(200,184,122,0.3)',
                        letterSpacing: '0.12em'
                    }}
                >
                    game #{code} · round {currentRound}
                </span>

            </div>
        </div>
    )
}