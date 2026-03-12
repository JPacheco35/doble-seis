import React from 'react';
import { useState, useEffect } from 'react';
import BGDominoes from '../../animations/BGDominoes/BGDominoes.tsx';
import { Grid, Stack } from '@mantine/core';
import { Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import LobbyHeader from '../../ui/LobbyHeader/LobbyHeader.tsx';
import LobbyList from '../../ui/LobbyList/LobbyList.tsx';
import CreateLobby from '../../ui/CreateLobby/CreateLobby.tsx';
import JoinLobby from '../../ui/JoinLobby/JoinLobby.tsx';

const API_URL = import.meta.env.VITE_API_URL;

export function Lobby() {
  const playerId = localStorage.getItem('playerId');
  const username = localStorage.getItem('username');

  const [connected, setConnected] = useState(false);
  const [lobbyName, setLobbyName] = useState(`${username}'s Game`);
  const [joinCode, setJoinCode] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  if (!playerId || !username) {
    return <Navigate to="/welcome" replace />;
  }

  useEffect(() => {
    const s = io(`${API_URL}/lobby`, {
      auth: { playerId, username },
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <div
      className="wood-grain"
      style={{ fontFamily: 'KomikaTitle, sans-serif', minHeight: '100vh' }}
    >
      <BGDominoes />
      <LobbyHeader connected={connected} />

      <div
        style={{
          padding: '80px 32px 32px',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        <Grid gutter="lg">
          <Grid.Col span={8}>
            <LobbyList socket={socket} />
          </Grid.Col>

          <Grid.Col span={4}>
            <Stack gap="lg">
              <CreateLobby
                lobbyName={lobbyName}
                setLobbyName={setLobbyName}
                socket={socket}
                connected={connected}
              />
              <JoinLobby
                joinCode={joinCode}
                setJoinCode={setJoinCode}
                socket={socket}
              />
            </Stack>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
}
