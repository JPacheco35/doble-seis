import React from 'react';
import { useEffect, useState } from 'react';
import CornerCard from "../CornerCard/CornerCard.tsx";
import { Button, Stack, Text, TextInput } from "@mantine/core";
import { Socket } from "socket.io-client";
import './CreateLobby.css';

interface CreateLobbyProps {
    lobbyName: string;
    setLobbyName: (name: string) => void;
    socket: Socket | null;
    connected: boolean;
}

export default function CreateLobby({ lobbyName, setLobbyName, socket, connected }: CreateLobbyProps) {
    const [lobbyCreated, setLobbyCreated] = useState(false);
    const [lobbyCode, setLobbyCode] = useState('');

    const handleCreate = () => {
        if (!socket) return;
        if (!lobbyName.trim()) return;
        socket.emit('createLobby', { name: lobbyName.trim() });
    };

    const handleDelete = () => {
        if (!socket) return;
        socket.emit('deleteLobby', lobbyCode);
        setLobbyCreated(false);
    };

    useEffect(() => {
        if (!socket) return;
        socket.on('lobbyCreated', (lobby) => {
            setLobbyCode(lobby.code);
            setLobbyCreated(true);
        });
    }, [socket]);

    return (
        <CornerCard style={{ padding: '24px' }} cornerSize={15}>
            <Text style={{
                fontSize: 14,
                letterSpacing: '0.15em',
                color: 'rgba(200,184,122,0.6)',
                marginBottom: 20,
            }}>
                Create Lobby
            </Text>

            <Stack gap="md">
                <TextInput
                    label="Lobby Name"
                    value={lobbyName}
                    onChange={(e) => setLobbyName(e.currentTarget.value)}
                    maxLength={24}
                    styles={{
                        input: { fontFamily: 'KomikaTitle, serif', fontSize: 10 },
                        label: { marginBottom: '10px', fontSize: 10 },
                    }}
                />

                <Button
                    fullWidth
                    className="create-btn"
                    disabled={!connected || !lobbyName.trim() || lobbyCreated}
                    onClick={handleCreate}
                    style={{
                        overflow: 'visible'
                    }}
                >
                    Create Game
                </Button>

                {lobbyCreated && (
                    <Button
                        fullWidth
                        className="delete-btn"
                        onClick={handleDelete}
                    >
                        Delete Game
                    </Button>
                )}
            </Stack>
        </CornerCard>
    );
}