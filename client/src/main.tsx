import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './main.css';
import App from './components/pages/App/App.tsx';
import React from 'react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="dark">
        <App />
    </MantineProvider>
  </StrictMode>,
);