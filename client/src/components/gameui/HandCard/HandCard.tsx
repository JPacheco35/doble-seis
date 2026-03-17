import React from 'react';
import { Box, Flex, Text } from '@mantine/core';
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

// Slightly larger hand tiles for better readability.
const handTileSize = 60;

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
            <Flex
                align="center"
                justify="center"
                gap={8}
            >
                {seats.bottom && (
                    <>
                        <Box
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: seats.bottom.team === 1 ? '#88c0f0' : '#f0956a'
                            }}
                        />

                        <Text
                            component="span"
                            style={{
                                fontSize: 9,
                                letterSpacing: '0.14em',
                                color: isMyTurn ? '#7ecf82' : 'rgba(235,218,165,0.66)'
                            }}
                        >

                          {isMyTurn
                              ? gameState.board.length === 0 && gameState.roundNumber === 1
                                  ? 'your turn: play the double-six to open'
                                  : 'your turn — play a tile'
                              : `YOU (${getTeamLabel(seats.bottom.team)}) — waiting...`}
                        </Text>
                    </>
                )}
            </Flex>

            <Text
                style={{
                    fontSize: 8,
                    letterSpacing: '0.2em',
                    color: 'rgba(235,218,165,0.58)',
                    textAlign: 'center'
                }}
            >
                your hand
            </Text>

            <Flex
                gap={2}
                justify="center"
                align="flex-end"
            >
                {gameState.hand?.map((domino, i) => {
                    const isValid = validIndices.includes(i);
                    return (
                        <Box
                            key={i}
                            style={{
                                opacity: isMyTurn && !isValid ? 0.22 : 1,
                                transition: 'opacity 0.2s',
                            }}
                        >
                            <DominoTile
                                left={domino.left} right={domino.right}
                                size={handTileSize} valid={isValid}
                                onClick={isValid ? () => handlePlaceDomino(i) : undefined}
                            />
                        </Box>
                    );
                })}
            </Flex>
        </CornerCard>
    )
}