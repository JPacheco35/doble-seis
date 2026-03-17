import React from 'react';
import { Image } from '@mantine/core';
import l66 from '../../../assets/dominoes/light_6-6.svg';
import './FloatingDominoHero.css';

export default function FloatingDominoHero() {
  return (
    <Image
      src={l66}
      alt="double-six"
      className="floating-domino-hero"
    />
  );
}