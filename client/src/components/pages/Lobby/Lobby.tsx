// lobby page - shows list of lobbies, allows creating and joining lobbies, and handles lobby state

import React from 'react';
import { useState, useEffect } from 'react';
import BGDominoes from '../../animations/BGDominoes/BGDominoes.tsx';
import { Grid, Stack, Box } from '@mantine/core';
import { Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import LobbyHeader from '../../ui/LobbyHeader/LobbyHeader.tsx';
import LobbyList from '../../ui/LobbyList/LobbyList.tsx';
import CreateLobby from '../../ui/CreateLobby/CreateLobby.tsx';
import JoinLobby from '../../ui/JoinLobby/JoinLobby.tsx';
import SinglePlayerCard from "../../ui/SinglePlayerCard/SinglePlayerCard.tsx";

const API_URL = import.meta.env.VITE_API_URL;

export function Lobby() {

  // user identification
  const playerId = localStorage.getItem('playerId');
  const username = localStorage.getItem('username');

  // connection status and socket to lobby matchmaking system
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // lobby creation
  const [lobbyName, setLobbyName] = useState(`${username}'s Game`);
  const [lobbyCreated, setLobbyCreated] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');

  // joining lobby
  const [joinCode, setJoinCode] = useState('');
  const [joinedCode, setJoinedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // no valid identification, redirect back to welcome page
  if (!playerId || !username) {
    return <Navigate to="/welcome" replace />;
  }

  // establish socket connection and routes
  useEffect(() => {

    // authentication
    const s = io(`${API_URL}/lobby`, {
      auth: { playerId, username },
    });

    // connection
    s.on('connect', () => {
      setConnected(true);
      setSocket(s);
    });

    // disconnection
    s.on('disconnect', () => {
      setConnected(false);
      setLobbyCreated(false);
      setLobbyCode('');
      setCountdown(null);
    });

    // start/cancel game countdown
    s.on('gameCountdown', () => setCountdown(10));
    s.on('countdownCancelled', () => setCountdown(null));

    return () => { s.disconnect(); };
  }, []);

  return (
    <Box
      component="div"
      className="wood-grain-background"
      style={{ fontFamily: 'KomikaTitle, sans-serif', minHeight: '100vh' }}
    >
      {/*background dominoes*/}
      <BGDominoes />

      {/*header*/}
      <LobbyHeader connected={connected} />

      <Box
        component="div"
        style={{
          padding: '80px 32px 32px',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        <Grid gutter="lg">
          <Grid.Col span={8}>

            {/*list of current lobbies*/}
            <LobbyList
              socket={socket}
              isHosting={lobbyCreated}
              setIsHosting={setLobbyCreated}
              hostedCode={lobbyCode}
              joinedCode={joinedCode}
              setJoinedCode={setJoinedCode}
            />

          </Grid.Col>

          <Grid.Col span={4}>
            <Stack gap="lg">

              {/*create lobby section*/}
              <CreateLobby
                lobbyName={lobbyName}
                setLobbyName={setLobbyName}
                socket={socket}
                connected={connected}
                lobbyCreated={lobbyCreated}
                setLobbyCreated={setLobbyCreated}
                lobbyCode={lobbyCode}
                setLobbyCode={setLobbyCode}
                joinedCode={joinedCode}
                countdown={countdown}
                setCountdown={setCountdown}
              />

              {/*joined lobby section*/}
              <JoinLobby
                joinCode={joinCode}
                setJoinCode={setJoinCode}
                socket={socket}
                countdown={countdown}
                setCountdown={setCountdown}
                joinedCode={joinedCode}
                lobbyCreated={lobbyCreated}
              />

              {/*play singleplayer section*/}
              <SinglePlayerCard
                isJoined={!!joinedCode}
                isHosting={lobbyCreated}
              />

            </Stack>
          </Grid.Col>
        </Grid>
      </Box>
    </Box>
  );
}