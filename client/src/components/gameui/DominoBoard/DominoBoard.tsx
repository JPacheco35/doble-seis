import React from 'react';
import dominoSrc from "../../../functions/dominoSrc.ts";
import { Image } from '@mantine/core';
import { Domino } from '../../../types/Game.ts'

// TESTING: change the size/gap of the board tiles
const tileSize = 28;
const tileWidth = Math.round(tileSize * 1.9);
const tileHeight = tileSize;
const tileGap = 2;

export default function DominoBoard({ board }: { board: Domino[] }) {

    // return empty board if no dominoes have been played yet
    if (board.length === 0) {
        return (
            <div style={{
                color: 'rgba(200,184,122,0.18)',
                fontSize: 11,
                fontFamily: 'KomikaTitle, sans-serif',
                letterSpacing: '0.2em',
                textAlign: 'center',
                width: '100%',
            }}>
                board is empty, waiting for first play...
            </div>
        );
    }

    // return dominoes board
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'nowrap',
            gap: tileGap,
            justifyContent: 'center',
            width: 'max-content',
            maxWidth: 'none',
        }}>
            {/*lay out each domino in the array (has been played)*/}
            {board.map((domino, i) => {

                // doubles (ie. 1-1) dominoes are aligned vertically on the board
                const isDouble = domino.left === domino.right;

                // consecutive dominoes should be flipped so that like sides match (ie. 1-2 -> 3-2 NO) (ie. 1-2 -> 2-3 YES)
                const needsFlip = !isDouble && (domino.left > domino.right);

                return (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        
                        {/*case: double domino, place vertically*/}
                        {isDouble ? (
                            <div style={{
                                width: tileHeight,
                                height: tileWidth,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <img
                                    src={dominoSrc(domino.left, domino.right)}
                                    alt={`${domino.left}|${domino.right}`}
                                    width={tileWidth} height={tileHeight}
                                    style={{
                                        transform: 'rotate(90deg)',
                                        borderRadius: 3,
                                        boxShadow: '1px 2px 5px rgba(0,0,0,0.5)',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        ) 
                            : 
                        // case: non double domino, place horizontally
                        (
                            <Image
                                src={dominoSrc(domino.left, domino.right)}
                                alt={`${domino.left}|${domino.right}`}
                                width={tileWidth} height={tileHeight}
                                style={{
                                    transform: needsFlip ? 'scaleX(-1)' : 'none',
                                    transformOrigin: 'center',
                                    borderRadius: 3,
                                    boxShadow: '1px 2px 5px rgba(0,0,0,0.5)',
                                    display: 'block',
                                    flexShrink: 0,
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}