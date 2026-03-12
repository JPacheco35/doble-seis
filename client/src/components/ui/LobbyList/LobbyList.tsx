import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import CornerCard from "../CornerCard/CornerCard.tsx";
import {Text} from "@mantine/core";
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
        socket.on('lobbyJoined', (lobby) => setJoinedCode(lobby.code));
        return () => {
            socket.off('lobbyList');
            socket.off('lobbyJoined');
        };
    }, [socket]);

    // sync joinedCode with hostedCode
    useEffect(() => {
        if (hostedCode) setJoinedCode(hostedCode);
        else setJoinedCode(null);
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
        </CornerCard>
    );
}