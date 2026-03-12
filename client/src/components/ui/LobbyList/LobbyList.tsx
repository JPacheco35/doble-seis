import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import CornerCard from "../CornerCard/CornerCard.tsx";
import {Stack, Text} from "@mantine/core";
import LobbyCard from '../LobbyCard/LobbyCard.tsx';

interface LobbyListProps {
    socket: Socket | null;
}

export default function LobbyList({ socket }: LobbyListProps) {
    const [lobbies, setLobbies] = useState<any[]>([]);

    useEffect(() => {
        if (!socket) return;

        console.log("LISTENING FOR LOBBY LIST");

        const handler = (data: any) => {
            // console.log("LOBBIES RECEIVED", data);
            const lobbyArray = Array.isArray(data) ? data : Object.values(data);
            setLobbies(lobbyArray);
        };

        socket.on("lobbyList", handler);

        // request the lobby immediately (optional but safer)
        socket.emit("getLobbies");

        return () => {
            socket.off("lobbyList", handler);
        };
    }, [socket]);

    return (
        <CornerCard style={{ padding: '24px' }}>
            <Text
                style={{
                    fontSize: 14,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'rgba(200,184,122,0.6)',
                    marginBottom: 20 }}
            >
                Open Lobbies
            </Text>
            <Stack
                style={{
                    gap: '10px',
                }}
            >
                {lobbies.length === 0 ? (
                    <Text
                        style={{
                            color: 'rgba(200,184,122,0.3)',
                            fontSize: 13,
                            textAlign: 'center',
                            padding: '40px 0'
                        }}
                    >
                        No Open Lobbies Available
                    </Text>
                ) : (
                    lobbies.map((lobby) => (
                        <LobbyCard key={lobby.code} lobby={lobby} />
                    ))
                )}
            </Stack>
        </CornerCard>
    );
}