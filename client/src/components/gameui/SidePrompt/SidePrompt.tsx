import React from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../../../types/Game.ts';

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

            <div
                className="game-dialog-card"
                style={{
                    position: 'relative',
                    borderRadius: 6,
                    padding: '24px 32px',
                    textAlign: 'center',
                }}>

                <button
                    type="button"
                    aria-label="Go back"
                    onClick={() => setSidePrompt(null)}
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '1px solid rgba(180,140,60,0.25)',
                        background: 'rgba(44,26,14,0.84)',
                        color: '#f4e8c1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        lineHeight: 1,
                    }}
                >
                    ←
                </button>

                <div
                    style={{
                        fontSize: 9,
                        letterSpacing: '0.22em',
                        color: 'rgba(200,184,122,0.3)',
                        marginBottom: 8
                }}>
                    WHICH END?
                </div>

                <div
                    style={{
                        fontFamily: 'KomikaTitle, sans-serif',
                        fontSize: 22,
                        color: '#f4e8c1',
                        marginBottom: 18
                }}>
                    {selectedDomino?.left}|{selectedDomino?.right}
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 10,
                        justifyContent: 'center'
                    }}
                >
                    {([
                        { side: 'left' as const, color: '#88c0f0', border: 'rgba(74,144,217,0.3)', label: `← LEFT (${gameState.leftEnd})` },
                        { side: 'right' as const, color: '#f0956a', border: 'rgba(217,112,74,0.3)', label: `RIGHT (${gameState.rightEnd}) →` },
                    ]).map(({ side, color, border, label }) => (
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
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}