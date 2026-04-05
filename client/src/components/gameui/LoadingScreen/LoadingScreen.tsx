/**
 * LoadingScreen.tsx
 *
 * full-screen loading indicator displayed while connecting to the game server.
 * shows a centered message with the wood grain background styling.
 */

import React from 'react';
import { Box, Text } from '@mantine/core';

export default function LoadingScreen() {
  return (
    <Box
      // Apply the wood grain background texture across full screen
      className="wood-grain-background"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Centered loading text with game typography */}
      <Text
        style={{
          fontFamily: 'KomikaTitle, sans-serif',
          fontSize: 24,
          letterSpacing: '0.15em',
          color: 'rgba(235,218,165,0.78)',
        }}
      >
        connecting to game...
      </Text>
    </Box>
  );
}