/**
 * PostGamePrompt.tsx
 *
 * game-over modal that displays:
 * - winning team announcement
 * - final scores for both teams
 * - individual player points
 * - round log showing game actions
 * - auto-boot timer counting down to lobby return
 * - manual leave button option
 *
 * this modal appears as a full-screen overlay when the game ends.
 */

import React from 'react';
import { Box, Button, Group, Text } from '@mantine/core';
import { GameState } from '../../../types/gameTypes.ts';
import RoundLog from '../RoundLog/RoundLog.tsx';
import CornerCard from '../../ui/CornerCard/CornerCard.tsx';

/**
 * Props for the PostGamePrompt component
 * @property gameOver - Game end state with winner team and final scores, or null if game ongoing
 * @property gameState - Complete game state needed for player team info
 * @property bootTimer - Seconds remaining before auto-return to lobby
 * @property onLeave - Callback when player clicks leave button
 * @property playerNameColor - Hex color for player names in the display
 * @property log - Array of all game events for the round log display
 */
interface PostGamePromptProps {
  gameOver: { winner: number; scores: { 1: number; 2: number } } | null;
  gameState: GameState | null;
  bootTimer: number;
  onLeave: () => void;
  playerNameColor?: string;
  log: any[];
}

/**
 * Format boot timer from seconds to MM:SS display format
 * @param seconds - Total seconds remaining
 * @returns Formatted string like "2:35"
 */
function formatBoot(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Get display label for a team
 * @param team - Team number (1 for blue, 2 for red)
 * @returns Human-readable team name
 */
function getTeamLabel(team: number) {
  return team === 1 ? 'Blue Team' : 'Red Team';
}

export default function PostGamePrompt({
  gameOver,
  gameState,
  bootTimer,
  onLeave,
  playerNameColor = '#ffc94a',
  log,
}: PostGamePromptProps) {
  // Don't render if game hasn't ended yet
  if (!gameOver || !gameState) return null;

  const currentRound = gameState.roundNumber ?? 1;

  return (
    <Box
      className="game-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        // Dark semi-transparent overlay covers entire screen
        background: 'rgba(0,0,0,0.87)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <CornerCard
        style={{
          borderRadius: 6,
          padding: '24px 24px 18px',
          textAlign: 'center',
          width: 380,
        }}
        cornerSize={14}
      >
        {/* Header: announce winning team */}
        <Text
          style={{
            fontSize: 28,
            color: '#f4b942',
            letterSpacing: '0.1em',
            marginBottom: 2,
          }}
        >
          {getTeamLabel(gameOver.winner).toUpperCase()} WINS!
        </Text>

        {/* Subtitle showing final score context */}
        <Text
          style={{
            fontFamily: 'KomikaTitle, sans-serif',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(235,218,165,0.66)',
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          Final Score · Round {currentRound}
        </Text>

        {/* Score cards for each team */}
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {/* Render team 1 (blue) and team 2 (red) side-by-side */}
          {[1, 2].map((t) => (
            <Box
              key={t}
              style={{
                borderRadius: 4,
                padding: '10px',
                // Blue border/background for team 1, red for team 2
                border: `1px solid ${t === 1 ? 'rgba(74,144,217,0.28)' : 'rgba(217,112,74,0.28)'}`,
                background:
                  t === 1 ? 'rgba(74,144,217,0.05)' : 'rgba(217,112,74,0.05)',
              }}
            >
              {/* Team label */}
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  color: t === 1 ? '#88c0f0' : '#f0956a',
                  marginBottom: 2,
                }}
              >
                {getTeamLabel(t).toUpperCase()}
              </Text>

              {/* Total team score */}
              <Text
                style={{
                  fontSize: 24,
                  color: t === 1 ? '#88c0f0' : '#f0956a',
                  marginBottom: 5,
                }}
              >
                {gameOver.scores[t as 1 | 2]}
              </Text>

              {/* Individual player scores for this team */}
              {gameState.players
                .filter((p) => p.team === t)
                .map((p) => (
                  <Group
                    key={p.playerId}
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: 'KomikaTitle, sans-serif',
                      fontSize: 9,
                      color: playerNameColor,
                      textShadow: '0 0 5px rgba(255,201,74,0.22)',
                    }}
                  >
                    <Text>{p.username}</Text>
                    <Text
                      style={{ color: 'rgba(244,184,66,0.86)', fontSize: 10 }}
                    >
                      {p.points}
                    </Text>
                  </Group>
                ))}
            </Box>
          ))}
        </Box>

        {/* Round log showing all plays and knocks from the game */}
        <Box
          style={{
            marginBottom: 12,
            border: '1px solid rgba(180,140,60,0.2)',
            borderRadius: 4,
            background: 'rgba(12,7,3,0.44)',
            maxHeight: 170,
            overflow: 'hidden',
          }}
        >
          <RoundLog log={log} />
        </Box>

        {/* Countdown timer for auto-return to lobby */}
        <Text
          style={{
            fontFamily: 'KomikaTitle, sans-serif',
            fontSize: 9,
            color: 'rgba(235,218,165,0.62)',
            marginBottom: 12,
          }}
        >
          returning to lobby in {formatBoot(bootTimer)}
        </Text>

        {/* Manual leave button (can also wait for auto-boot) */}
        <Button
          className="game-dialog-leave-btn"
          onClick={onLeave}
          style={{
            padding: '7px 20px',
            borderRadius: 3,
            fontSize: 13,
            letterSpacing: '0.12em',
          }}
        >
          leave game
        </Button>
      </CornerCard>
    </Box>
  );
}