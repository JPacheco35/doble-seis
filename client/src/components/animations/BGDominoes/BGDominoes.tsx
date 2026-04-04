/**
 * BGDominoes.tsx
 *
 * scattered dominoes across the screen, transparent, for visuals on the background of a page.
 *
 * this background effect is used in the following components
 * /src/components/pages/Game.tsx
 * /src/components/pages/Lobby.tsx
 * /src/components/pages/NotFound.tsx
 * /src/components/pages/Welcome.tsx
 */

import React from 'react';
import { Box, Image } from '@mantine/core';
import dominoSrc from '../../../functions/dominoSrc.ts';

/**
 * Pre-determined positions and types of dominoes to scatter across the background.
 * position is relative to the screen size
 * there are 8 dominoes hard coded, so that the look is standardized, and I know they wont clip into each other
 *
 * top - distance from top of screen
 * left - distance from the right of the screen
 * rotate - degrees to rotate the domino
 * leftPip - left value of the domino (0-6)
 * rightPip - right value of the domino (0-6)
 *
 */
const bgDominoes = [
  { top: '8%', left: '5%', rotate: 15, leftPip: 6, rightPip: 6 },
  { top: '15%', right: '8%', rotate: -22, leftPip: 3, rightPip: 3 },
  { top: '55%', left: '3%', rotate: 8, leftPip: 0, rightPip: 6 },
  { top: '70%', right: '5%', rotate: -12, leftPip: 5, rightPip: 5 },
  { top: '30%', left: '12%', rotate: -30, leftPip: 1, rightPip: 6 },
  { top: '80%', left: '20%', rotate: 20, leftPip: 2, rightPip: 4 },
  { top: '5%', left: '40%', rotate: -8, leftPip: 2, rightPip: 6 },
  { top: '85%', right: '18%', rotate: 35, leftPip: 1, rightPip: 3 },
];

/** Position data for a background domino */
interface Position {
  top: string; // distance from the top (0% - 100%)
  left?: string; // distance from the left (optional) (0% - 100%)
  right?: string; // distance from the right (optional) (0% - 100%)
  rotate: number; // rotation (-360 to 360)
  leftPip: number; // left-end value (0-6)
  rightPip: number; // right-end value (0-6)
}

export default function BGDominoes() {
  return (
    <Box className="wood-grain-background">
      {/*place each domino in bgDominoes of onto the wood-grain background*/}
      {(bgDominoes as Position[]).map((d, i) => (
        <Image
          key={i}
          src={dominoSrc({ left: d.leftPip, right: d.rightPip })}
          alt="0-0"
          style={{
            // import from bgDominoes
            top: d.top,
            left: d.left,
            right: d.right,
            transform: `rotate(${d.rotate}deg)`,
            position: 'fixed',        // fixed regardless of screen size
            opacity: 0.06,            // very faint, and behind all UI elements
            width: '10%',             // fixed size for the dominoes themselves, relative to screen size
            pointerEvents: 'none',    // do nothing when intereacted with
            userSelect: 'none',
          }}
        />
      ))}
    </Box>
  );
}