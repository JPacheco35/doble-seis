/**
 * DominoBoard Component
 *
 * displays the dominoes that have been played on the board during gameplay.
 * handles layout of dominoes (vertical for doubles, horizontal otherwise),
 * orientation flipping to match like sides, and animations for newly placed dominoes
 */

import React from 'react';
import dominoSrc from '../../../functions/dominoSrc.ts';
import { Image, Box, Flex } from '@mantine/core';
import { Domino } from '../../../types/gameTypes.ts';
import './DominoBoard.css';

// TESTING: configure the size/gap of the board tiles
// tileWidth is scaled to ~1.9x height to match domino aspect ratio
const tileSize = 28;
const tileWidth = Math.round(tileSize * 1.9);
const tileHeight = tileSize;
const tileGap = 2;


/**
 * Check if two dominoes are identical
 * @param a domino 1
 * @param b domino 2
 * @returns true if both dominoes have matching left and right values (they are the same)
 */
function isSameDomino(a: Domino, b: Domino) {
  return (a.left === b.left) && (a.right === b.right);
}


/**
 * Detects if a new domino was added to the board and returns its position
 * used to trigger entry animations for newly placed dominoes.
 *
 * @param prevBoard The board state BEFORE the update
 * @param nextBoard The board state AFTER the update
 * @returns Index where new domino was placed (0 for left end, last index for right end),
 */
function getEnteringIndex(prevBoard: Domino[], nextBoard: Domino[]): number | null {
  // A new domino was only placed if exactly one domino was added
  if (nextBoard.length !== prevBoard.length + 1) return null;

  // Check: new domino was placed at the left end (prepended)
  const isPrepended = prevBoard.every((d, i) =>
    isSameDomino(d, nextBoard[i + 1]),
  );
  if (isPrepended) return 0;

  // Check: new domino was placed at the right end (appended)
  const isAppended = prevBoard.every((d, i) => isSameDomino(d, nextBoard[i]));
  if (isAppended) return nextBoard.length - 1;

  // Couldn't determine placement position (this should happen only in error)
  return null;
}


export default function DominoBoard({ board }: { board: Domino[] }) {
  // Keep track of previous board state to detect newly placed dominoes
  const previousBoardRef = React.useRef<Domino[]>([]);
  const enteringIndex = getEnteringIndex(previousBoardRef.current, board);

  // Update ref after render to track board changes
  React.useEffect(() => {
    previousBoardRef.current = board;
  }, [board]);

  // Placeholder text if board is empty (before turn 1 on round start)
  if (board.length === 0) {
    return (
      <Box
        component="div"
        style={{
          color: 'rgba(235,218,165,0.58)',
          fontSize: 11,
          fontFamily: 'KomikaTitle, sans-serif',
          letterSpacing: '0.2em',
          textAlign: 'center',
          width: '100%',
        }}
      >
        board is empty, waiting for first play...
      </Box>
    );
  }

  // Render the board with all played dominoes
  return (
    <Flex
      component="div"
      align="center"
      wrap="nowrap"
      gap={tileGap}
      justify="center"
      style={{
        width: 'max-content',
        maxWidth: 'none',
      }}
    >
      {/* Render each domino that has been played */}
      {board.map((domino, i) => {

        // Case: double dominoes (e.g., 1-1, 2-2) are oriented vertically on the board
        const isDouble = domino.left === domino.right;

        // Consecutive non-double dominoes are flipped so like sides connect (ie. 1-2 - 2-4)
        const needsFlip = !isDouble && domino.left > domino.right;

        return (
          <Box
            component="div"
            key={i}
            // apply entry animation class if this is a newly placed domino
            className={
              i === enteringIndex
                ? 'domino-board-tile domino-board-tile-enter'
                : 'domino-board-tile'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {/* DOUBLE-DOMINO: rotate 90 degrees to display vertically */}
            {isDouble ? (
              <Box
                component="div"
                style={{
                  // invert the domino dimensions (now vertical)
                  width: tileHeight,
                  height: tileWidth,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={dominoSrc(domino)}
                  alt={`${domino.left}|${domino.right}`}
                  width={tileWidth}
                  height={tileHeight}
                  style={{
                    transform: 'rotate(90deg)',
                    borderRadius: 3,
                    boxShadow: '1px 2px 5px rgba(0,0,0,0.5)',
                    display: 'block',
                  }}
                />
              </Box>
            ) :

            (
              // NON-DOUBLE DOMINO -- align horizontalally, flip accordingly for side alignment
              <Image
                src={dominoSrc(domino)}
                alt={`${domino.left}|${domino.right}`}
                width={tileWidth}
                height={tileHeight}
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
