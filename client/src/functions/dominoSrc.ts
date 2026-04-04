// Returns domino SVG files when given its values {left,right}
// Example: dominoSrc(3, 5) -> "/dominoes/light_3-5.svg"
// Assumes dominoes from 0-6 only
// SVG file names are in lo-hi format (its light_3-5.svg, not light_5-3.svg)

import { Domino } from "../types/gameTypes";

function dominoSrc(domino: Domino): string {
  // check for missing or invalid domino object
  if (!domino || domino.left === undefined || domino.right === undefined) {
    console.warn('Invalid domino passed to dominoSrc:', domino);
    return '/dominoes/light_0-0.svg'; // fallback to blank domino
  }

  // check for out-of-range values
  if (domino.left < 0 || domino.left > 6 || domino.right < 0 || domino.right > 6) {
    throw new Error(
      `Invalid domino values: ${domino.left}, ${domino.right}. Must be between 0 and 6.`,
    );
  }

  const lo = Math.min(domino.left, domino.right);
  const hi = Math.max(domino.left, domino.right);
  return `/dominoes/light_${lo}-${hi}.svg`;
}


export default dominoSrc;