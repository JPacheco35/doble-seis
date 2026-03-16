import React from 'react';
import FaceDownTiles from '../FaceDownTiles/FaceDownTiles.tsx';
import { Player } from '../../../types/Game.ts';

interface SeatCardProps {
    player: Player;
    isActive: boolean;
    isMe?: boolean;
}

const PLAYER_NAME_COLOR = '#ffc94a';

export default function SeatCard({ player, isActive, isMe }: SeatCardProps) {
    const teamColor = player.team === 1 ? '#88c0f0' : '#f0956a';
    const teamBorder = player.team === 1 ? 'rgba(74,144,217,0.25)' : 'rgba(217,112,74,0.25)';

    return (
        <div style={{
            background: isActive ? 'rgba(8,4,1,0.95)' : 'rgba(8,4,1,0.8)',
            border: `2px solid ${isActive ? 'rgba(76,175,80,0.4)' : isMe ? 'rgba(244,184,66,0.2)' : teamBorder}`,
            borderRadius: 15, padding: '5px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            minWidth: 80,
            boxShadow: isActive ? '0 0 14px rgba(76,175,80,0.1)' : 'none',
            transition: 'all 0.3s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: teamColor,
                    boxShadow: isActive ? `0 0 6px ${teamColor}` : 'none',
                }} />
                <span style={{
                    fontFamily: 'KomikaTitle, sans-serif', fontSize: 12, letterSpacing: '0.1em',
                    color: isActive ? '#7ecf82' : PLAYER_NAME_COLOR,
                    textShadow: isActive ? 'none' : '0 0 6px rgba(255,201,74,0.35)',
                }}>
          {player.username.toUpperCase()}{isActive ? ' ▶' : ''}
        </span>
                <span style={{
                    fontSize: 7, letterSpacing: '0.1em', padding: '1px 4px', borderRadius: 2,
                    background: player.team === 1 ? 'rgba(74,144,217,0.1)' : 'rgba(217,112,74,0.1)',
                    color: teamColor, border: `0.5px solid ${teamBorder}`,
                    fontFamily: 'KomikaTitle, sans-serif',
                }}>
          T{player.team}
        </span>
            </div>
            {!isMe && <FaceDownTiles total={7} remaining={player.handSize} />}
            <span style={{
                fontFamily: 'KomikaTitle, sans-serif', fontSize: 9,
                color: isActive ? '#7ecf82' : 'rgba(235,218,165,0.64)',
            }}>
        {isActive ? `${player.handSize} tiles · playing…` : `${player.handSize} tiles`}
      </span>
        </div>
    );
}