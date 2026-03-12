import React from 'react';
import CornerCard from "../CornerCard/CornerCard.tsx";
import {Button, Group, Text, TextInput} from "@mantine/core";
import { Socket } from "socket.io-client";

interface JoinLobbyProps {
    joinCode: string;
    setJoinCode: (code: string) => void;
    socket: Socket | null;
}

export default function JoinLobby({joinCode, setJoinCode, socket}: JoinLobbyProps) {
    return (
        <CornerCard
          style={{ padding: '24px' }}
          cornerSize={10}
        >
            <Text
                style={{
                    fontFamily: 'KomikaTitle, serif',
                    fontSize: 14,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'rgba(200,184,122,0.6)',
                    marginBottom: 20 }}
            >
                Join by Code
            </Text>
            <Group gap="sm">
                <TextInput
                    placeholder="XXXX"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.currentTarget.value.toUpperCase())}
                    maxLength={4}
                    style={{ flex: 1 }}
                    styles=
                        {{ input:
                                {
                                    fontFamily: 'KomikaTitle, serif',
                                    fontSize: 18, letterSpacing: '0.2em',
                                    textAlign: 'center',
                                    textTransform: 'uppercase'
                                }
                        }}
                />
                <Button
                    className="sit-down-btn"
                    onClick={() => socket?.emit('joinLobby', joinCode)}
                    disabled={joinCode.length !== 4}
                >
                    Join
                </Button>
            </Group>
        </CornerCard>
    );
}