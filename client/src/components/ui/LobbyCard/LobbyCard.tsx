import React from 'react';
import { Badge, Button, Group, Text, Box, Flex } from '@mantine/core';
import CornerCard from '../CornerCard/CornerCard.tsx';
import './LobbyCard.css';

interface Player {
  team: number;
  username: string;
  playerId: string;
}

interface LobbyCardProps {
  lobby: any;
  onJoin: (code: string) => void;
  onLeave: () => void;
  isJoined: boolean;
  isHosting: boolean;
  isDisabled: boolean;
  hostedCode: string | null;
}

export default function LobbyCard({ lobby, onJoin, onLeave, isJoined, isHosting, isDisabled}: LobbyCardProps) {
  const full = lobby.players.length === 4;
  const emptySeats = 4 - lobby.players.length;

  return (
    <CornerCard style={{ padding: '16px 20px' }} cornerSize={5}>
      <Group justify="space-between" align="center" wrap="nowrap">
        {/* Left: code + name + host */}
        <Flex direction="column" gap={2}>
          <Text
            className="lobby-code"
          >
            {lobby.name}
          </Text>

          <Text
            className="lobby-host"
          >
            Host: {lobby.hostname}
          </Text>
        </Flex>

        {/* Middle: filled + empty seats */}
        <Box component="div" className="lobby-middle">
          <Group gap={6}>
            {lobby.players.map((player: Player, idx: number) => (
              <Box
                component="div"
                key={idx}
                className="seat"
                style={{ color: player.team === 1 ? '#4a90d9' : '#d9704a' }}
                title={player.username}
              >
                {player.username.charAt(0).toUpperCase()}
              </Box>
            ))}
            {Array.from({ length: emptySeats }).map((_, idx) => (
              <Box component="div" key={`empty-${idx}`} className="seat-empty" />
            ))}
          </Group>
        </Box>

        {/* Right: badge + join */}
        <Flex direction="column" align="center" gap={6}>
          {isJoined ? (<Badge className="badge-joined">Joined</Badge>)
              : full ? (<Badge className="badge-full">Full</Badge>)
              : (<Badge className="badge-waiting">Waiting</Badge>) }

          {isJoined ? (
              <Button className="delete-btn" onClick={onLeave}>
                Leave
              </Button>
          ) : (
              <Button
                  className="join-btn"
                  disabled={full || (isHosting && !isJoined) || (isDisabled && !isJoined)}
                  onClick={() => onJoin(lobby.code)}
              >
                Join
              </Button>
          )}
        </Flex>
      </Group>
    </CornerCard>
  );
}
