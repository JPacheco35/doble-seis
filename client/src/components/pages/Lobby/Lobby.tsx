import React, { useState, useEffect} from 'react';
import BGDominoes from '../../animations/BGDominoes/BGDominoes.tsx';
import { Stack } from '@mantine/core';
import { Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;
let socket: Socket

export default function Lobby() {

  const playerId = localStorage.getItem('playerId');
  const username = localStorage.getItem('username');
  const [, setConnected] = useState(false);

    useEffect(() => {
        socket = io(`${API_URL}/lobby`, {
            auth: {
                playerId,
                username,
            },
        });

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        socket.on('lobbyConnected', (data) => {
            console.log(data.message);
        });

        socket.on('playerJoined', (data) => {
            console.log(`${data.username} joined`);
        });

        socket.on('playerLeft', (data) => {
            console.log(`${data.username} left`);
        });

        return () => {
            socket.disconnect();
        };
    }, []);


  if (!playerId || !username) {
      return <Navigate to="/welcome" replace/>;
  }

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
          <p>
              Welcome to the lobby,{' '}
              <span style={{ color: 'red' }}>{username}</span>
              {' '}-{' '}
              <span style={{ color: 'blue' }}>{playerId}</span>!
          </p>
      </Stack>
    </div>
  );
}