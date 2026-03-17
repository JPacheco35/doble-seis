// Floating Domino Hero on the Welcome.tsx page

import React from 'react';
import { Image } from '@mantine/core';
import dominoSrc from '../../../functions/dominoSrc.ts';
import './FloatingDominoHero.css';

export default function FloatingDominoHero() {
  return (
    <Image
      src={dominoSrc(6, 6)}
      alt="double-six"
      className="floating-domino-hero"
    />
  );
}