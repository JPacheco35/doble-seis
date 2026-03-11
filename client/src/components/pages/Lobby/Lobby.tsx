import React from 'react';
import BGDominoes from '../../animations/BGDominoes/BGDominoes.tsx';
import { Stack } from '@mantine/core';

export default function Lobby() {
  return (
    <div
      className="wood-grain"
      style={{
        fontFamily: 'KomikaTitle, sans-serif',
      }}
    >
      <BGDominoes />
      <Stack justify={'center'} align={'center'} style={{ height: '100vh' }}>
        <h1>Lobby Page</h1>
      </Stack>
    </div>
  );
}