import React from 'react';
import { Box, Image } from '@mantine/core';

// import domino SVGs (ie. l00 == light 0-0 domino)
import l26 from '../../../assets/dominoes/light_2-6.svg';
import l06 from '../../../assets/dominoes/light_0-6.svg';
import l33 from '../../../assets/dominoes/light_3-3.svg';
import l16 from '../../../assets/dominoes/light_1-6.svg';
import l55 from '../../../assets/dominoes/light_5-5.svg';
import l24 from '../../../assets/dominoes/light_2-4.svg';
import l66 from '../../../assets/dominoes/light_6-6.svg';
import l13 from '../../../assets/dominoes/light_1-3.svg';

// relative positions of dominoes
const POSITIONS = [
  { top: '8%', left: '5%', rotate: 15, src: l66 },
  { top: '15%', right: '8%', rotate: -22, src: l33 },
  { top: '55%', left: '3%', rotate: 8, src: l06 },
  { top: '70%', right: '5%', rotate: -12, src: l55 },
  { top: '30%', left: '12%', rotate: -30, src: l16 },
  { top: '80%', left: '20%', rotate: 20, src: l24 },
  { top: '5%', left: '40%', rotate: -8, src: l26 },
  { top: '85%', right: '18%', rotate: 35, src: l13 },
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
