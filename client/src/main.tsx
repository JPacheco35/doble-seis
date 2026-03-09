import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';

import App from './components/pages/App/App.tsx';
import React from 'react';

// dark mode default
const typeTheme = 'dark';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme={typeTheme} />
    <MantineProvider defaultColorScheme={typeTheme}>
      <App/>
    </MantineProvider>
  </StrictMode>,
);