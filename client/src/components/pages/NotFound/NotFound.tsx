// Not found page when trying to access a non-existent route

import React from 'react';
import BGDominoes from '../../animations/BGDominoes/BGDominoes.tsx';
import { Stack, Box } from '@mantine/core';

export default function NotFound() {
  return (
    <Box
      component="div"
      className="wood-grain-background"
      style={{
        fontFamily: 'KomikaTitle, sans-serif',
      }}
    >
      <BGDominoes/>
      <Stack
        justify={'center'}
        align={'center'}
        style={{ height: '100vh' }}
      >
        <h1>404 - Not Found</h1>
        <p>The page you are looking for does not exist.</p>
      </Stack>
    </Box>
  );
}