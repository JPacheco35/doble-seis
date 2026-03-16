import React from 'react';
import DominoTile from '../DominoTile/DominoTile.tsx';
import { GameState, Player } from '../../../types/Game.ts';
import CornerCard from '../../ui/CornerCard/CornerCard.tsx';

type Seats = {
    bottom: Player | null;
};

interface HandCardProps {
    gameState: Pick<GameState, 'board' | 'roundNumber' | 'hand'>;
    seats: Seats;
    isMyTurn: boolean;
    handlePlaceDomino: (index: number) => void;
    validIndices: number[];
}

const handTileSize = 40;

function getTeamLabel(team: number) {
    return team === 1 ? 'BLUE TEAM' : 'RED TEAM';
}

export default function HandCard({gameState, seats, isMyTurn, handlePlaceDomino, validIndices}: HandCardProps) {
    return (
        <CornerCard
            style={{
                padding: '8px 14px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                zIndex: 3,
                marginTop: 8,
                background: 'rgba(24, 14, 7, 0.76)',
                border: '1px solid rgba(180, 140, 60, 0.18)',
                borderBottom: 'none',
                borderRadius: '14px 14px 0 0',
                backdropFilter: 'blur(4px)',
            }}
            cornerSize={12}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                }}
            >
                {seats.bottom && (
                    <>
                        <div
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: seats.bottom.team === 1 ? '#88c0f0' : '#f0956a'
                            }}
                        />

                        <span
                            style={{
                                fontSize: 9,
                                letterSpacing: '0.14em',
                                color: isMyTurn ? '#7ecf82' : 'rgba(235,218,165,0.66)'
                            }}
                        >

                          {isMyTurn
                              ? gameState.board.length === 0 && gameState.roundNumber === 1
                                  ? 'YOUR TURN — PLAY THE 6|6 TO OPEN'
                                  : 'YOUR TURN — PLAY A TILE'
                              : `YOU (${getTeamLabel(seats.bottom.team)}) — WAITING…`}
                        </span>
                    </>
                )}
            </div>

            <div
                style={{
                    fontSize: 8,
                    letterSpacing: '0.2em',
                    color: 'rgba(235,218,165,0.58)',
                    textAlign: 'center'
                }}
            >
                your hand
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'center',
                    alignItems: 'flex-end'
                }}
            >
                {gameState.hand?.map((domino, i) => {
                    const isValid = validIndices.includes(i);
                    return (
                        <div
                            key={i}
                            style={{
                                opacity: isMyTurn && !isValid ? 0.22 : 1,
                                transition: 'opacity 0.2s'
                            }}
                        >
                            <DominoTile
                                left={domino.left} right={domino.right}
                                size={handTileSize} valid={isValid}
                                onClick={isValid ? () => handlePlaceDomino(i) : undefined}
                            />
                        </div>
                    );
                })}
            </div>
        </CornerCard>
    )
}