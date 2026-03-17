import React from 'react';
import { Box, Group, Text } from '@mantine/core';
import FaceDownTiles from '../FaceDownTiles/FaceDownTiles.tsx';
import { Player } from '../../../types/Game.ts';

interface SeatCardProps {
    player: Player;
    isActive: boolean;
    isMe?: boolean;
    shouldShake?: boolean;
}

const PLAYER_NAME_COLOR = '#ffc94a';

export default function SeatCard({ player, isActive, isMe, shouldShake = false }: SeatCardProps) {
    const teamColor = player.team === 1 ? '#88c0f0' : '#f0956a';
    const teamBorder = player.team === 1 ? 'rgba(74,144,217,0.42)' : 'rgba(217,112,74,0.42)';

    return (
        <Box className={shouldShake ? 'seat-card-knock-shake' : undefined} style={{
            background: isActive ? 'rgba(8,4,1,0.95)' : 'rgba(8,4,1,0.8)',
            border: `3px solid ${isActive ? 'rgba(76,175,80,0.62)' : isMe ? 'rgba(244,184,66,0.42)' : teamBorder}`,
            borderRadius: 15, padding: '5px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            minWidth: 80,
            boxShadow: isActive ? '0 0 16px rgba(76,175,80,0.18)' : isMe ? '0 0 12px rgba(244,184,66,0.1)' : '0 0 10px rgba(0,0,0,0.12)',
            transition: 'all 0.3s ease',
        }}>
            <Group style={{ gap: 5 }}>
                <Box style={{
                    width: 6, height: 6, borderRadius: '50%', background: teamColor,
                    boxShadow: isActive ? `0 0 6px ${teamColor}` : 'none',
                }} />
                <Text style={{
                    fontFamily: 'KomikaTitle, sans-serif', fontSize: 12, letterSpacing: '0.1em',
                    color: isActive ? '#7ecf82' : PLAYER_NAME_COLOR,
                    textShadow: isActive ? 'none' : '0 0 6px rgba(255,201,74,0.35)',
                }}>
          {player.username.toUpperCase()}{isActive ? ' ▶' : ''}
        </Text>
            </Group>
            {!isMe && <FaceDownTiles total={7} remaining={player.handSize} />}
            <Text style={{
                fontFamily: 'KomikaTitle, sans-serif', fontSize: 9,
                color: isActive ? '#7ecf82' : 'rgba(235,218,165,0.64)',
            }}>
        {isActive ? `${player.handSize} tiles · playing…` : `${player.handSize} tiles`}
      </Text>
        </Box>
    );
}