import { Group, Text } from '@mantine/core';
import Logo from '../Logo/Logo.tsx';
import CornerCard from '../CornerCard/CornerCard.tsx';
import './LobbyHeader.css';
import React from "react";

interface HeaderProps {
    connected?: boolean;
}

export default function LobbyHeader({ connected = false }: HeaderProps) {
    const playerId = localStorage.getItem('playerId');
    const username = localStorage.getItem('username');

    return (
        <CornerCard style={{
            padding: '12px 24px',
            borderRadius: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            width: '100%'
        }}
        cornerSize={5}
        >
            <Group justify="space-between" align="center">

                <Logo fontSize={20} />

                <Group gap="md">
                    <Group gap={6}>
                        <div className={`connectivity-dot ${connected ? 'connected' : 'disconnected'}`} />
                        <Text className="connectivity-label">
                            {connected ? 'Connected' : 'Disconnected'}
                        </Text>
                    </Group>

                    <div className="header-divider" />

                    {username && (
                        <Group gap={6}>
                            <Text className="header-username">{username}</Text>
                            {playerId && (
                                <Text className="header-playerid">
                                    {playerId.split('-')[0].toUpperCase()}
                                </Text>
                            )}
                        </Group>
                    )}
                </Group>

            </Group>
        </CornerCard>
    );
}