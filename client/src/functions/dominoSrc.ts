/**
 * dominoSrc.ts
 *
 * Utility function to resolve SVG file paths for domino tiles.
 * Normalizes domino values (always lo-hi format) and returns the corresponding light-themed SVG path.
 *
 * Domino tiles are stored as: /public/dominoes/light_l-r.svg where l <= r (0-6 range)
 * This function ensures consistent path resolution regardless of left/right order.
 */

import { Domino } from '../types/gameTypes';

/**
 * Returns the SVG file path for a given domino tile
 *
 * Normalizes the domino values to lo-hi format (smaller value first) since SVG files
 * are named accordingly (e.g., light_3-5.svg, not light_5-3.svg).
 *
 * @param domino - domino object with left and right pip values (0-6)
 * @returns path to the SVG file (e.g., "/dominoes/light_3-5.svg")
 * @throws error if domino value(s) are not between 0-6 (inclusive)
 * @example
 * dominoSrc({ left: 3, right: 5 }) // "/dominoes/light_3-5.svg"
 * dominoSrc({ left: 5, right: 3 }) // "/dominoes/light_3-5.svg" (normalized)
 * dominoSrc({ left: 6, right: 6 }) // "/dominoes/light_6-6.svg"
 */
function dominoSrc(domino: Domino): string {

  // Handle missing or incomplete domino object (fallback to blank 0-0 tile)
  if (!domino || domino.left === undefined || domino.right === undefined) {
    console.warn('Invalid domino passed to dominoSrc:', domino);
    return '/dominoes/light_0-0.svg';
  }

  // Validate domino values are within valid range (0-6 pips per side)
  if (domino.left < 0 || domino.left > 6 ||
    domino.right < 0 || domino.right > 6)
  {
    throw new Error(
      `Invalid domino values: ${domino.left}, ${domino.right}. Must be between 0 and 6.`,
    );
  }

  // Normalize to lo-hi format to match SVG file naming convention
  const lo = Math.min(domino.left, domino.right);
  const hi = Math.max(domino.left, domino.right);
  return `/dominoes/light_${lo}-${hi}.svg`;
}

export default dominoSrc;