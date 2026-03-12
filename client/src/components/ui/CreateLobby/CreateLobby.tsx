import React from 'react';
import CornerCard from "../CornerCard/CornerCard.tsx";
import { Button, Stack, Text, TextInput } from "@mantine/core";
import { Socket } from "socket.io-client";

interface CreateLobbyProps {
    lobbyName: string;
    setLobbyName: (name: string) => void;
    socket: Socket | null;
}

export default function CreateLobby({ lobbyName, setLobbyName, socket }: CreateLobbyProps) {
    const handleCreate = () => {
        if (!socket) return;
        socket.emit('createLobby', { name: lobbyName });
    };

    return (
        <CornerCard
          style={{ padding: '24px' }}
          cornerSize={15}
        >
            <Text
              style={{
                fontFamily: 'KomikaTitle, serif',
                fontSize: 14,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(200,184,122,0.6)',
                marginBottom: 20,
              }}
            >
                Create Lobby
            </Text>

            <Stack
              gap="md"
            >

                <TextInput
                    placeholder="Bob's Game..."
                    label="Lobby Name"
                    value={lobbyName}
                    onChange={(e) => setLobbyName(e.currentTarget.value)}
                    maxLength={24}
                    styles={{
                      input: {
                        fontFamily: 'KomikaTitle, serif',
                        fontSize: 10,
                      },
                      label: {
                        marginBottom: '10px',
                        fontSize: 10,
                      }
                    }}
                />

                <Button
                    fullWidth
                    className="sit-down-btn"
                    disabled={!socket}
                    onClick={handleCreate}
                >
                    Create Game
                </Button>
            </Stack>
        </CornerCard>
    );
}