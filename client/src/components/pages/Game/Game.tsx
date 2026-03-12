import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Text, Stack } from '@mantine/core';

const API_URL = import.meta.env.VITE_API_URL;

export default function Game() {
    const { code } = useParams();
    const navigate = useNavigate();
    const playerId = localStorage.getItem('playerId');
    const username = localStorage.getItem('username');
    const [gameData, setGameData] = useState<any>(null);
    const [, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const s = io(`${API_URL}/game`, {
            auth: { playerId, username },
        });

        s.on('connect', () => {
            s.emit('joinGame', code);
        });

        s.on('gameJoined', (data) => {
            setGameData(data);
        });

        // if not authorized, kick back to lobby
        s.on('gameError', () => {
            navigate('/lobby');
        });

        setSocket(s);
        return () => { s.disconnect(); };
    }, []);

    if (!gameData) return (
        <div className="wood-grain" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#f4e8c1', fontFamily: 'KomikaTitle, serif', fontSize: 24 }}>
                Connecting to game...
            </Text>
        </div>
    );

    return (
        <div className="wood-grain" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack align="center" gap="lg">
                <Text style={{ color: '#f4b942', fontSize: 48, fontFamily: 'KomikaTitle, serif', letterSpacing: '0.1em' }}>
                    ¡Doble Seis!
                </Text>
                <Text style={{ color: '#f4e8c1', fontSize: 16, fontFamily: 'KomikaTitle, serif'}}>
                    Game-ID <span style={{ color: '#f4b942' }}>{code}</span>
                </Text>
                <Text style={{ color: 'rgba(200,184,122,0.5)', fontSize: 13, fontFamily: 'KomikaTitle, serif' }}>
                    {gameData.players?.length} players connected
                </Text>
                {gameData.players?.map((player: any, index: number) => (
                    <Text key={index} style={{ color: 'rgba(200,184,122,0.5)', fontSize: 13, fontFamily: 'KomikaTitle, serif' }}>
                        {player.username}
                    </Text>
                ))}
                <Text style={{ color: 'rgba(200,184,122,0.3)', fontSize: 11, letterSpacing: '0.1em', fontFamily: 'KomikaTitle, serif', textTransform: 'uppercase' }}>
                    Game logic coming soon...
                </Text>
            </Stack>
        </div>
    );
}