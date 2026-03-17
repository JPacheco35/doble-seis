import React from 'react';
import { Box, Image } from '@mantine/core';
import dominoSrc from '../../../functions/dominoSrc.ts';

// relative positions of dominoes
const POSITIONS = [
  { top: '8%', left: '5%', rotate: 15, leftPip: 6, rightPip: 6 },
  { top: '15%', right: '8%', rotate: -22, leftPip: 3, rightPip: 3 },
  { top: '55%', left: '3%', rotate: 8, leftPip: 0, rightPip: 6 },
  { top: '70%', right: '5%', rotate: -12, leftPip: 5, rightPip: 5 },
  { top: '30%', left: '12%', rotate: -30, leftPip: 1, rightPip: 6 },
  { top: '80%', left: '20%', rotate: 20, leftPip: 2, rightPip: 4 },
  { top: '5%', left: '40%', rotate: -8, leftPip: 2, rightPip: 6 },
  { top: '85%', right: '18%', rotate: 35, leftPip: 1, rightPip: 3 },
];

interface Position {
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  leftPip: number;
  rightPip: number;
}

export default function BGDominoes() {
  return (
    <Box
      className="wood-grain"
    >
      {(POSITIONS as Position[]).map((d, i) => (
        <Image
          key={i}
          src={dominoSrc(d.leftPip, d.rightPip)}
          alt=""
          style={{
            position: 'fixed',
            top: d.top,
            left: d.left,
            right: d.right,
            transform: `rotate(${d.rotate}deg)`,
            opacity: 0.06,
            pointerEvents: 'none',
            width: '10%',
            userSelect: 'none',
          }}
        />
      ))}
    </Box>
  );
}
