import React from 'react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

const socket = io(API_URL);

export default function App() {
  const [color, setColor] = useState('blue');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('colorUpdate', (newColor) => setColor(newColor));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('colorUpdate');
    };
  }, []);

  const handleToggle = () => {
    socket.emit('toggleColor');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '20px',
      }}
      className="wood-grain"
    >
      <p style={{ color: connected ? 'green' : 'red' }}>
        {connected ? 'Connected' : 'Disconnected'}
      </p>
      <button
        onClick={handleToggle}
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '20px 40px',
          fontSize: '24px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
        }}
      >
        {color.toUpperCase()}
      </button>
    </div>
  );
}
