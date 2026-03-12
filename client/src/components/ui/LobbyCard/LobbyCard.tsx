import React from 'react';
import { Badge, Button, Group, Text } from '@mantine/core';
import CornerCard from '../CornerCard/CornerCard.tsx';
import './LobbyCard.css';

interface Player {
  team: number;
  username: string;
  playerId: string;
}

interface LobbyCardProps {
  lobby: any;
}

export default function LobbyCard({ lobby }: LobbyCardProps) {
  const full = lobby.players.length === 4;
  const emptySeats = 4 - lobby.players.length;

  return (
    <CornerCard style={{ padding: '16px 20px' }} cornerSize={5}>
      <Group justify="space-between" align="center" wrap="nowrap">
        {/* Left: code + name + host */}
        <div className="lobby-left">
          <Text
            className="lobby-code"
          >
            {lobby.name}
          </Text>

          <Text
            className="lobby-host"
          >
            Host: {lobby.host}
          </Text>
        </div>

        {/* Middle: filled + empty seats */}
        <div className="lobby-middle">
          <Group gap={6}>
            {lobby.players.map((player: Player, idx: number) => (
              <div
                key={idx}
                className="seat"
                style={{ color: player.team === 1 ? '#4a90d9' : '#d9704a' }}
                title={player.username}
              >
                {player.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {Array.from({ length: emptySeats }).map((_, idx) => (
              <div key={`empty-${idx}`} className="seat-empty" />
            ))}
          </Group>
        </div>

        {/* Right: badge + join */}
        <div className="lobby-right">
          {full ? (
            <Badge className="badge-full">Full</Badge>
          ) : (
            <Badge className="badge-waiting">Waiting</Badge>
          )}
          <Button
            className="join-btn"
            disabled={full}
          >
            Join
          </Button>
        </div>
      </Group>
    </CornerCard>
  );
}
