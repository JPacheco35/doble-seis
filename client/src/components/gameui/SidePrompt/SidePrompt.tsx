import React from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../../../types/Game.ts';
import CornerCard from '../../ui/CornerCard/CornerCard.tsx';
import dominoSrc from '../../../functions/dominoSrc.ts';

interface SidePromptProps {
    sidePrompt: number | null;
    setSidePrompt: (sidePrompt: number | null) => void;
    gameState: GameState | null;
    code: string;
    socket: Socket | null;
}

export default function SidePrompt({ sidePrompt, setSidePrompt, gameState, code, socket }: SidePromptProps)
{
    if (sidePrompt === null || !gameState) return null;

    const selectedDomino = gameState.hand?.[sidePrompt];

    return (
        <div
            className="game-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
            }}>

            <CornerCard
                style={{
                    position: 'relative',
                    borderRadius: 6,
                    padding: '24px 32px',
                    textAlign: 'center',
                    background: 'rgba(30, 18, 10, 0.94)',
                    border: '1px solid rgba(180, 140, 60, 0.25)',
                    boxShadow: '0 22px 50px rgba(0, 0, 0, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                }}
                cornerSize={12}
            >

                <button
                    type="button"
                    aria-label="Go back"
                    onClick={() => setSidePrompt(null)}
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        border: 'none',
                        background: 'transparent',
                        color: '#f4e8c1',
                        cursor: 'pointer',
                        fontSize: 20,
                        fontWeight: 700,
                        lineHeight: 1,
                        padding: 0,
                    }}
                >
                    ←
                </button>

                <div
                    style={{
                        fontSize: 9,
                        letterSpacing: '0.22em',
                        color: 'rgba(235,218,165,0.66)',
                        marginBottom: 8
                }}>
                    WHICH END?
                </div>

                <div
                    style={{
                        fontFamily: 'KomikaTitle, sans-serif',
                        color: '#f4e8c1',
                        marginBottom: 18
                }}>
                    {selectedDomino ? (
                        <img
                            src={dominoSrc(selectedDomino.left, selectedDomino.right)}
                            alt={`${selectedDomino.left}-${selectedDomino.right}`}
                            width={68}
                            height={36}
                            style={{
                                display: 'block',
                                margin: '0 auto',
                                objectFit: 'contain',
                                borderRadius: 3,
                                boxShadow: '0 2px 7px rgba(0,0,0,0.42)',
                                background: 'rgba(255,248,232,0.98)',
                                border: '1px solid rgba(180,140,60,0.28)',
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: 18 }}>?-?</span>
                    )}
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 10,
                        justifyContent: 'center'
                    }}
                >
                    {([
                        { side: 'left' as const, color: '#88c0f0', border: 'rgba(74,144,217,0.3)', end: gameState.leftEnd, arrow: '←', prefix: 'LEFT' },
                        { side: 'right' as const, color: '#f0956a', border: 'rgba(217,112,74,0.3)', end: gameState.rightEnd, arrow: '→', prefix: 'RIGHT' },
                    ]).map(({ side, color, border, end, arrow, prefix }) => (
                        <div key={side}
                             className="game-dialog-action"
                             onClick={() => { socket?.emit('placeDomino', { code, dominoIndex: sidePrompt, side }); setSidePrompt(null); }}
                             style={{
                                 padding: '8px 16px',
                                 borderRadius: 3,
                                 border: `1px solid ${border}`,
                                 color,
                                 cursor: 'pointer',
                                 fontSize: 11,
                                 letterSpacing: '0.1em'
                            }}
                        >
                            <span style={{ color, fontSize: 10 }}>{side === 'left' ? `${arrow} ${prefix}` : `${prefix} ${arrow}`}</span>
                            <span style={{ marginLeft: 6, color: '#f4e8c1', fontSize: 14, fontWeight: 700, textShadow: '0 0 6px rgba(244,232,193,0.35)' }}>
                                {end}
                            </span>
                        </div>
                    ))}
                </div>
            </CornerCard>
        </div>
    );
}