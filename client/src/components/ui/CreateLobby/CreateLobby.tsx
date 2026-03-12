import React, { useEffect, useState } from 'react';
import CornerCard from "../CornerCard/CornerCard.tsx";
import { Button, Stack, Text, TextInput } from "@mantine/core";
import { Socket } from "socket.io-client";

interface CreateLobbyProps {
  lobbyName: string;
  setLobbyName: (name: string) => void;
  socket: Socket | null;
  connected: boolean;
}

export default function CreateLobby({ lobbyName, setLobbyName, socket, connected }: CreateLobbyProps) {

  // keep track of whether this user has created a lobby
  const [lobbyCreated ,setLobbyCreated] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');

  // create a lobby hosted by user
  const handleCreate = () => {
    if (!socket) return;
    if (!lobbyName.trim()) return;
    console.log("emitting createLobby:", lobbyName.trim());
    socket.emit('createLobby', { name: lobbyName.trim() });
    setLobbyCreated(true);
  };

  // delete a lobby hosted by user
  const handleDelete = () => {
    if (!socket) return;
    if (!lobbyName.trim()) return;
    console.log("emitting deleteLobby:", lobbyName.trim());
    socket.emit('deleteLobby', lobbyCode );
    setLobbyCreated(false);
  }

  useEffect(() => {
    if (!socket) return;
    socket.on('lobbyCreated', (lobby) => {
      setLobbyCode(lobby.code);
      setLobbyCreated(true);
    });
  }, [socket]);

    return (
      <CornerCard style={{ padding: '24px' }} cornerSize={15}>
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

        <Stack gap="md">
          <TextInput
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
              },
            }}
          />

          <Button
            fullWidth
            className="sit-down-btn"
            disabled={!connected || !lobbyName.trim() || lobbyCreated}
            onClick={handleCreate}
          >
            Create Game
          </Button>

          <div>
            {lobbyCreated && (
              <Button
                fullWidth
                className="sit-down-btn"
                disabled={!connected || !lobbyName.trim()}
                onClick={handleDelete}
              >
                Delete Game
              </Button>
            )}
          </div>
        </Stack>
      </CornerCard>
    );
}