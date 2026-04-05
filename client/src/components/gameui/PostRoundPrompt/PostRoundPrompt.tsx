/**
 * PostRoundPrompt.tsx
 *
 * end-of-round modal that displays:
 * - which team won the round and points scored
 * - updated scores for both teams
 * - round log showing all actions in the round
 * - countdown timer until next round begins
 * - button to dismiss and continue to next round
 *
 * appears between rounds and automatically closes when next round starts.
 */

import React from 'react';
import CornerCard from '../../ui/CornerCard/CornerCard.tsx';
import { Box } from '@mantine/core';
import RoundLog from '../RoundLog/RoundLog.tsx';

/**
 * Data structure for end-of-round state
 * @property winningTeam - Team that won the round (1 or 2), or null if no winner
 * @property points - Points scored in this round
 * @property scores - Current cumulative scores for both teams
 * @property endAtMs - Timestamp when round ended (used for timing next round)
 */
type RoundEndPrompt = {
  winningTeam: number | null;
  points: number;
  scores: { 1: number; 2: number };
  endAtMs: number;
};

/**
 * Get display label for a team
 * @param team - Team number (1 for blue, 2 for red)
 * @returns Human-readable team name
 */
function getTeamLabel(team: number) {
  return team === 1 ? 'Blue Team' : 'Red Team';
}

/**
 * Props for the PostRoundPrompt component
 * @property roundEndSecondsLeft - Countdown seconds until next round starts
 * @property log - Array of all game events from the completed round
 * @property roundEndPrompt - Round end state data, or null if no round has ended
 * @property setRoundEndPrompt - State setter to dismiss the prompt
 */
interface PostRoundPromptProps {
  roundEndSecondsLeft: number;
  log: any[];
  roundEndPrompt: RoundEndPrompt | null;
  setRoundEndPrompt: React.Dispatch<
    React.SetStateAction<RoundEndPrompt | null>
  >;
}

export default function PostRoundPrompt({
  roundEndSecondsLeft,
  log,
  roundEndPrompt,
  setRoundEndPrompt,
}: PostRoundPromptProps) {
  // Don't render if no round has ended yet
  if (!roundEndPrompt) return null;

  return (
    <CornerCard
      style={{
        borderRadius: 6,
        padding: '24px 24px 18px',
        textAlign: 'center',
        width: 360,
      }}
      cornerSize={14}
    >
      {/* Header label */}
      <Box
        component="div"
        style={{
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'rgba(235,218,165,0.72)',
          marginBottom: 6,
        }}
      >
        ROUND ENDED
      </Box>

      {/* Main result message: winner and points, or neutral completion message */}
      <Box
        component="div"
        style={{
          fontSize: 22,
          // Color matches team color if winner exists, otherwise neutral
          color:
            roundEndPrompt.winningTeam === 1
              ? '#88c0f0'
              : roundEndPrompt.winningTeam === 2
                ? '#f0956a'
                : '#f4e8c1',
          marginBottom: 8,
        }}
      >
        {roundEndPrompt.winningTeam
          ? `${getTeamLabel(roundEndPrompt.winningTeam).toUpperCase()} WON ${roundEndPrompt.points} PTS`
          : 'ROUND COMPLETE'}
      </Box>

      {/* Score cards for both teams */}
      <Box
        component="div"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 10,
        }}
      >
        {/* Render team 1 (blue) and team 2 (red) side-by-side with their scores */}
        {[1, 2].map((team) => (
          <Box
            component="div"
            key={team}
            style={{
              borderRadius: 4,
              padding: '10px',
              // Blue styling for team 1, red for team 2
              border: `1px solid ${team === 1 ? 'rgba(74,144,217,0.28)' : 'rgba(217,112,74,0.28)'}`,
              background:
                team === 1 ? 'rgba(74,144,217,0.05)' : 'rgba(217,112,74,0.05)',
            }}
          >
            {/* Team label */}
            <Box
              component="div"
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                color: team === 1 ? '#88c0f0' : '#f0956a',
              }}
            >
              {getTeamLabel(team).toUpperCase()}
            </Box>

            {/* Current team score total */}
            <Box
              component="div"
              style={{
                fontSize: 24,
                color: team === 1 ? '#88c0f0' : '#f0956a',
              }}
            >
              {roundEndPrompt.scores[team as 1 | 2]}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Countdown to next round start */}
      <Box
        component="div"
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          color: 'rgba(235,218,165,0.8)',
          marginBottom: 12,
        }}
      >
        next round begins in {roundEndSecondsLeft}s
      </Box>

      {/* Round log showing all plays and knocks from the completed round */}
      <Box
        component="div"
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

      {/* Button to dismiss prompt and continue (can also auto-dismiss) */}
      <Box
        component="div"
        className="game-dialog-leave-btn"
        onClick={() => setRoundEndPrompt(null)}
        style={{
          display: 'inline-block',
          padding: '7px 20px',
          borderRadius: 3,
          fontSize: 13,
          letterSpacing: '0.12em',
          cursor: 'pointer',
        }}
      >
        continue to next round
      </Box>
    </CornerCard>
  );
}