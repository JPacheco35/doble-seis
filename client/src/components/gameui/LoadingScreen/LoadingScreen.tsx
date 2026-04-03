import React from 'react';
import { Box, Text } from '@mantine/core';

export default function LoadingScreen() {
    return (
        <Box
            className="wood-grain-background"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Text style={{
                fontFamily: 'KomikaTitle, sans-serif',
                fontSize: 24,
                letterSpacing: '0.15em',
                color: 'rgba(235,218,165,0.78)'
            }}>
              connecting to game...
            </Text>
        </Box>
    )
}