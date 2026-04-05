/**
 * Playmat.tsx
 *
 * main game board container that displays:
 * - the green felt playing surface, domino board is on top of this
 * - border around the felt
 * - seats for all players around the table
 *
 * Props contain all game state needed to render the board and player positions.
 */

import React from 'react';
import { Box } from '@mantine/core';
import DominoBoard from '../DominoBoard/DominoBoard.tsx';
import Seats from '../Seats/Seats.tsx';

/**
 * Props for the Playmat component
 * @property gameState - current game state containing board array and player info
 * @property seats - seating configuration and player positions
 * @property knockedPlayerId - id of player who knocked (for animation/highlighting)
 * @property knockShakeToken - counter to trigger knock animation on updates
 */
interface PlaymatProps {
  gameState: any;
  seats: any;
  knockedPlayerId?: string | null;
  knockShakeToken?: number;
}

export default function Playmat({
  gameState,
  seats,
  knockedPlayerId = null,
  knockShakeToken = 0,
}: PlaymatProps) {
  return (
    <Box component="div" className="playmat" style={{ flex: 1 }}>

      {/* Green felt playing surface with texture and decorative frame */}
      <Box
        component="div"
        className="game-felt"
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >

        {/* Texture overlay for realistic felt appearance */}
        <Box
          component="div"
          className="game-felt-texture"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Decorative border frame with corner accents */}
        <Box
          component="div"
          className="game-felt-frame"
          style={{
            position: 'absolute',
            inset: 8,
            borderRadius: 8,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >

          {/* Four corner brackets (top-left, top-right, bottom-left, bottom-right) */}
          {[
            { top: -1, left: -1, borderWidth: '2px 0 0 2px' }, // top-left
            { top: -1, right: -1, borderWidth: '2px 2px 0 0' }, // top-right
            { bottom: -1, left: -1, borderWidth: '0 0 2px 2px' }, // bottom-left
            { bottom: -1, right: -1, borderWidth: '0 2px 2px 0' }, // bottom-right
          ].map((s, i) => (
            <Box
              component="div"
              key={i}
              className="game-felt-corner"
              style={{
                position: 'absolute',
                width: 12,
                height: 12,
                borderStyle: 'solid',
                ...s,
              }}
            />
          ))}
        </Box>

        {/* Center board zone where dominoes are displayed */}
        <Box
          component="div"
          className="game-board-zone"
          style={{
            position: 'absolute',
            left: '50%',
            top: '52%',
            transform: 'translate(-50%, -50%)',
            width: 'max-content',
            zIndex: 3,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <DominoBoard board={gameState.board} />
        </Box>

        {/* Render other players seated around the table */}
        <Seats
          seats={seats}
          gameState={gameState}
          knockedPlayerId={knockedPlayerId}
          knockShakeToken={knockShakeToken}
        />
      </Box>
    </Box>
  );
}
