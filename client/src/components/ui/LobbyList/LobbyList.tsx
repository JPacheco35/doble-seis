import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import CornerCard from "../CornerCard/CornerCard.tsx";
import {Stack, Text} from "@mantine/core";
import LobbyCard from '../LobbyCard/LobbyCard.tsx';

interface LobbyListProps {
    socket: Socket | null;
    isHosting: boolean;
    setIsHosting: (val: boolean) => void;
    hostedCode: string | null;
    joinedCode: string | null;
    setJoinedCode: (code: string | null) => void;
}

export default function LobbyList({ socket, isHosting, setIsHosting, hostedCode, joinedCode, setJoinedCode }: LobbyListProps) {
    const [lobbies, setLobbies] = useState<any[]>([]);
    // const [joinedCode, setJoinedCode] = useState<string | null>(null);

    const handleJoin = (code: string) => {
        socket?.emit('joinLobby', code);
    };

    const handleLeave = () => {
        if (!joinedCode) return;
        socket?.emit('leaveLobby', joinedCode);
        setJoinedCode(null);

        if (joinedCode === hostedCode) setIsHosting(false);
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('lobbyList', (data) => setLobbies(Array.isArray(data) ? data : Object.values(data)));

        socket.on('lobbyJoined', (lobby) => {
            console.log('lobbyJoined', lobby.code);
            setJoinedCode(lobby.code);
        });

        socket.on('lobbyClosed', (data) => {
            console.log('lobbyClosed received', data);
            setJoinedCode(null);
        });

        return () => {
            socket.off('lobbyList');
            socket.off('lobbyJoined');
            socket.off('lobbyClosed');
        };
    }, [socket]);

    // sync hostedCode -> joinedCode
    useEffect(() => {
        if (hostedCode && hostedCode !== '') {
            setJoinedCode(hostedCode);
        } else if (hostedCode === '' || hostedCode === null) {
            setJoinedCode(null);
        }
    }, [hostedCode]);

    console.log({isHosting,hostedCode,joinedCode})
    return (
        <CornerCard style={{ padding: '24px' }}>
            <Text style={{
                fontFamily: 'KomikaTitle, serif',
                fontSize: 14,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(200,184,122,0.6)',
                marginBottom: 20,
            }}>
                Open Lobbies
            </Text>

            <Stack gap={10}>
                {lobbies.length === 0 ? (
                    <Text style={{ color: 'rgba(200,184,122,0.3)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                        No open lobbies
                    </Text>
                ) : (
                    lobbies.map((lobby) => (
                        <LobbyCard
                            key={lobby.code}
                            lobby={lobby}
                            onJoin={handleJoin}
                            onLeave={handleLeave}
                            isJoined={joinedCode === lobby.code}
                            isHosting={isHosting}
                            isDisabled={(joinedCode !== null && joinedCode !== lobby.code) || (isHosting && lobby.code !== hostedCode)}
                            hostedCode={hostedCode}
                        />
                    ))
                )}
            </Stack>
        </CornerCard>
    );
}