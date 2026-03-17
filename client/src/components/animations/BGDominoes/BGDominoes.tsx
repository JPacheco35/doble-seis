import React from 'react';
import { Box, Image } from '@mantine/core';
import dominoSrc from '../../../functions/dominoSrc.ts';

// relative positions of dominoes
const POSITIONS = [
  { top: '8%', left: '5%', rotate: 15, src: dominoSrc(6, 6) },
  { top: '15%', right: '8%', rotate: -22, src: dominoSrc(3, 3) },
  { top: '55%', left: '3%', rotate: 8, src: dominoSrc(0, 6) },
  { top: '70%', right: '5%', rotate: -12, src: dominoSrc(5, 5) },
  { top: '30%', left: '12%', rotate: -30, src: dominoSrc(1, 6) },
  { top: '80%', left: '20%', rotate: 20, src: dominoSrc(2, 4) },
  { top: '5%', left: '40%', rotate: -8, src: dominoSrc(2, 6) },
  { top: '85%', right: '18%', rotate: 35, src: dominoSrc(1, 3) },
];

interface Position {
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  src: string;
}

export default function BGDominoes() {
  return (
    <Box
      className="wood-grain"
    >
      {(POSITIONS as Position[]).map((d, i) => (
        <Image
          key={i}
          src={d.src}
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
