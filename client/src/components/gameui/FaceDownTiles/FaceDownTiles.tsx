/**
 * FaceDownTiles.tsx
 *
 * Ddisplays the draw pile (boneyard) as a grid of face-down domino tiles.
 * shows total tiles in the pile and visually indicates which ones have been drawn.
 *
 * used to show players how many tiles remain avaliable to draw during gameplay.
 */

import React from 'react';
import { Group, Box } from '@mantine/core';

/**
 * Props for the FaceDownTiles component
 * @property total - Total number of tiles that were in the draw pile at game start
 * @property remaining - Number of tiles still available to draw
 */
interface FaceDownTilesProps {
  total: number;
  remaining: number;
}

// TESTING: configure the size of the face down tiles
const tileWidth = 12;
const tileHeight = 18;

export default function FaceDownTiles({
  total,
  remaining,
}: FaceDownTilesProps) {
  return (
    <Group
      style={{
        gap: 2,
        flexWrap: 'wrap',
        maxWidth: 96,
        width: '100%',
        justifyContent: 'center',
      }}
    >
      {/*
       * Create one tile element for each domino that was in the pile
       * Played tiles (already drawn) show faded/grayed out
       * Remaining tiles show bright/active
       */}
      {Array.from({ length: total }).map((_, i) => {
        // Tiles at index >= remaining have been drawn (played)
        const played = i >= remaining;
        return (
          <Box
            key={i}
            style={{
              width: tileWidth,
              height: tileHeight,
              borderRadius: 1,
              // Active tiles: brown gradient; Played tiles: dark faded
              background: played
                ? 'rgba(24,14,5,0.5)'
                : 'linear-gradient(135deg,#3a2a16,#23170c)',
              // Active tiles: bright border; Played tiles: faded border
              border: `0.5px solid ${played ? 'rgba(70,42,15,0.22)' : 'rgba(205,162,78,0.35)'}`,
              // Active tiles: strong shadow; Played tiles: subtle shadow
              boxShadow: played
                ? '0 0 1px rgba(0,0,0,0.25)'
                : '1px 1px 3px rgba(0,0,0,0.5)',
              // Fade out played tiles to de-emphazize them
              opacity: played ? 0.35 : 1,
              // Smooth transition when tiles are drawn
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          />
        );
      })}
    </Group>
  );
}
