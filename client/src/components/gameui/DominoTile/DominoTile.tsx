/**
 * DominoTile.tsx
 *
 * Displays a single vertical domino tile from the player's hand.
 *
 * - renders domino SVG rotated 90 degrees (vertical orientation)
 * - highlights valid moves with amber glow
 * - shows green glow when hovered over valid tiles
 * - lifts up slightly on hover for interactive feedback
 * - supports click handling for play actions
 *
 * Used by: HandCard component (/src/components/gameui/HandCard/HandCard.tsx)
 */

import React from 'react';
import { Box } from '@mantine/core';
import dominoSrc from '../../../functions/dominoSrc.ts';

/**
 * Props for the DominoTile component
 * @property left - Left pip value (0-6)
 * @property right - Right pip value (0-6)
 * @property size - Height of tile in pixels (default: 26)
 * @property onClick - Callback when tile is clicked
 * @property valid - Whether this is a valid move option
 * @property selected - Whether this tile is currently selected
 */
interface DominoTileProps {
  left: number;
  right: number;
  size?: number;
  onClick?: () => void;
  valid?: boolean;
  selected?: boolean;
}

export default function DominoTile({
  left,
  right,
  size = 26,
  onClick,
  valid,
  selected,
}: DominoTileProps) {
  // Track hover state for visual feedback
  const [isHovered, setIsHovered] = React.useState(false);

  // Calculate tile dimensions (domino aspect ratio ~1.9:1)
  const tileWidth = Math.round(size * 1.9);
  const tileHeight = size;

  /**
   * Determine the glow/highlight around the tile based on state:
   * - selected: bright green glow (actively chosen)
   * - valid + hovered: medium green glow (interactive feedback)
   * - valid: subtle amber glow (available move)
   * - invalid: no glow
   */
  const outline = selected
    ? '0 0 0 2px #4caf50, 0 0 10px rgba(76,175,80,0.45)'
    : valid && isHovered
      ? '0 0 0 2px rgba(76,175,80,0.7), 0 0 10px rgba(76,175,80,0.35)'
      : valid
        ? '0 0 0 1.5px rgba(244,184,66,0.55), 0 0 7px rgba(244,184,66,0.15)'
        : 'none';

  // Render the domino tile container and image
  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: tileHeight,
        height: tileWidth,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Only allow pointer cursor if tile is clickable and valid
        cursor: onClick && valid ? 'pointer' : 'default',
        // Lift tile up slightly when hovering over valid options
        transform: valid && isHovered ? 'translateY(-2px)' : 'none',
        transition: 'transform 0.12s ease',
      }}
    >
      <img
        src={dominoSrc({ left, right })}
        alt={`${left}|${right}`}
        width={tileWidth}
        height={tileHeight}
        style={{
          width: tileWidth,
          height: tileHeight,
          // Rotate 90 degrees for vertical hand display
          transform: 'rotate(90deg)',
          borderRadius: 3,
          // Apply the calculated glow effect
          boxShadow: outline,
          display: 'block',
          objectFit: 'contain',
          // Smooth transition for glow changes
          transition: 'box-shadow 0.12s ease',
        }}
      />
    </Box>
  );
}