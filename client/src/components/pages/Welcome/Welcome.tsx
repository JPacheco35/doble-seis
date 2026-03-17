import React, { useState } from 'react';
import Logo from '../../ui/Logo/Logo.tsx';
import { Button, Stack, Text, TextInput, Box } from '@mantine/core';
import BGDominoes from '../../animations/BGDominoes/BGDominoes.tsx';
import FloatingDominoHero from '../../animations/FloatingDominoHero/FloatingDominoHero.tsx';
import CornerCard from '../../ui/CornerCard/CornerCard.tsx';
import './Welcome.css';
import axios from 'axios';
import { useNavigate } from 'react-router';

const API_URL = import.meta.env.VITE_API_URL;

export default function Welcome() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  // on username submit, join the lobby and navigate to it
  const handleSubmit = async() => {
    if (!username.trim()) {
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/connect`, { username });

      localStorage.setItem('playerId', res.data.playerId);
      localStorage.setItem('username', res.data.username);

      console.log(`Connected to lobby as ${res.data.username}-${res.data.playerId}`);
      navigate('/lobby');

    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }

  return (
    <Box
      component="div"
      className="wood-grain"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '20px',
        fontFamily: 'KomikaTitle, sans-serif',
        fontWeight: '100',
      }}
    >
      {/*dominoes scattered across background*/}
      <BGDominoes />

      {/*create username card*/}
      <CornerCard>
        <Stack justify={'center'} align={'center'} gap={30}>
          {/*header + subheader + floating domino*/}
          <Logo fontSize={60} />
          <Text
            style={{
              marginTop: '-15px',
              marginBottom: '10px',
              fontSize: '14px',
              color:"rgba(255,255,255,0.4)",
            }}
          >
            A 2v2 Multiplayer Dominoes Game
          </Text>
          <FloatingDominoHero />

          <TextInput
            placeholder="Enter a username..."
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            maxLength={20}
            size="md"
            styles={{
              root: { width: '100%' },
              input: {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(180,140,60,0.25)',
                borderRadius: '10px',
                color: '#f4e8c1',
                fontFamily: 'Ubuntu, sans-serif',
                fontSize: '16px',
                '&::placeholder': {
                  color: 'rgba(200,184,122,0.25)',
                },
                '&:focus': {
                  borderColor: 'rgba(244,185,66,0.5)',
                  background: 'rgba(255,255,255,0.07)',
                },
              },
            }}
          />

          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={!username.trim()}
            classNames={{root:"sit-down-btn"}}
            styles={{
              root: {
                background:
                  'linear-gradient(135deg, #b8821e, #f4b942, #c8932a)',
                border: 'none',
                borderRadius: '10px',
                color: '#1a0e00',
                fontFamily: 'KomikaTitle, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                // letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '2px',
                boxShadow: '0 4px 20px rgba(200,147,42,0.3)',
                width: '50%',

                // cant join with empty username
                '&:disabled': {
                  opacity: 0.4,
                  cursor: 'not-allowed',
                },
              },
            }}
          >
            Sit Down
          </Button>
        </Stack>
      </CornerCard>
    </Box>
  );
}