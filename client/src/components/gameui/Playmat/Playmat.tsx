import React from "react";
import DominoBoard from "../DominoBoard/DominoBoard.tsx";
import Seats from "../Seats/Seats.tsx";

interface PlaymatProps {
    gameState: any;
    seats: any;
}

export default function Playmat({gameState, seats}: PlaymatProps) {
    return (
        <div className="playmat">
            {/* felt */}
            <div className="game-felt" style={{
                flex: 1, position: 'relative', overflow: 'hidden',
            }}>
                {/* grid texture */}
                <div className="game-felt-texture" style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                }} />

                {/* border frame */}
                <div className="game-felt-frame" style={{
                    position: 'absolute', inset: 8,
                    borderRadius: 8, pointerEvents: 'none', zIndex: 2,
                }}>
                    {[
                        { top: -1, left: -1, borderWidth: '2px 0 0 2px' },
                        { top: -1, right: -1, borderWidth: '2px 2px 0 0' },
                        { bottom: -1, left: -1, borderWidth: '0 0 2px 2px' },
                        { bottom: -1, right: -1, borderWidth: '0 2px 2px 0' },
                    ].map((s, i) => (
                        <div key={i} className="game-felt-corner" style={{
                            position: 'absolute', width: 12, height: 12,
                            borderStyle: 'solid', ...s,
                        }} />
                    ))}
                </div>

                {/* board */}
                <div className="game-board-zone" style={{
                    position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%, -50%)',
                    width: 'max-content', zIndex: 3, pointerEvents: 'none', overflow: 'visible',
                }}>
                    <DominoBoard board={gameState.board} />
                </div>

                {/*other players seats*/}
                <Seats seats={seats} gameState={gameState} />
            </div>
        </div>
    );
}