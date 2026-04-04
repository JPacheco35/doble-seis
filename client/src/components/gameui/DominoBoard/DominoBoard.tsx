import React from 'react';
import dominoSrc from "../../../functions/dominoSrc.ts";
import { Image, Box, Flex } from '@mantine/core';
import { Domino } from '../../../types/gameTypes.ts'
import './DominoBoard.css';

// TESTING: change the size/gap of the board tiles
const tileSize = 28;
const tileWidth = Math.round(tileSize * 1.9);
const tileHeight = tileSize;
const tileGap = 2;

function isSameDomino(a: Domino, b: Domino) {
    return a.left === b.left && a.right === b.right;
}

function getEnteringIndex(prevBoard: Domino[], nextBoard: Domino[]): number | null {
    if (nextBoard.length !== prevBoard.length + 1) return null;

    // New domino placed on the left end.
    const isPrepended = prevBoard.every((d, i) => isSameDomino(d, nextBoard[i + 1]));
    if (isPrepended) return 0;

    // New domino placed on the right end.
    const isAppended = prevBoard.every((d, i) => isSameDomino(d, nextBoard[i]));
    if (isAppended) return nextBoard.length - 1;

    return null;
}

export default function DominoBoard({ board }: { board: Domino[] }) {
    const previousBoardRef = React.useRef<Domino[]>([]);
    const enteringIndex = getEnteringIndex(previousBoardRef.current, board);

    React.useEffect(() => {
        previousBoardRef.current = board;
    }, [board]);

    // return empty board if no dominoes have been played yet
    if (board.length === 0) {
        return (
            <Box component="div" style={{
                color: 'rgba(235,218,165,0.58)',
                fontSize: 11,
                fontFamily: 'KomikaTitle, sans-serif',
                letterSpacing: '0.2em',
                textAlign: 'center',
                width: '100%',
            }}>
                board is empty, waiting for first play...
            </Box>
        );
    }

    // return dominoes board
    return (
        <Flex component="div" 
            align="center"
            wrap="nowrap"
            gap={tileGap}
            justify="center"
            style={{
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
                    <Box
                        component="div"
                        key={i}
                        className={i === enteringIndex ? 'domino-board-tile domino-board-tile-enter' : 'domino-board-tile'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        
                        {/*case: double domino, place vertically*/}
                        {isDouble ? (
                            <Box component="div" style={{
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
                            </Box>
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
                    </Box>
                );
            })}
        </Flex>
    );
}