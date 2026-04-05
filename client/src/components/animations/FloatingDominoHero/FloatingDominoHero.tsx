/**
 * FloatingDominoHero Component
 *
 * Displays an animated floating domino tile (6-6) on the Welcome page.
 * Used in /src/components/pages/Welcome.tsx
 */

import React from 'react';
import { Image } from '@mantine/core';
import dominoSrc from '../../../functions/dominoSrc.ts';
import './FloatingDominoHero.css';

export default function FloatingDominoHero() {
  // Renders the double-six domino SVG with a CSS animation applied
  // dominoSrc() generates the correct SVG file path for the specified domino
  // The 'floating-domino-hero' class applies the animation (defined in FloatingDominoHero.css)
  return (
    <Image
      src={dominoSrc({ left: 6, right: 6 })}
      alt="double-six"
      className="floating-domino-hero"
    />
  );
}