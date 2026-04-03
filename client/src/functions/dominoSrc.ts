// Returns domino SVG files when given its values {left,right}
// Example: dominoSrc(3, 5) -> "/dominoes/light_3-5.svg"
// Assumes dominoes from 0-6 only
// SVG file names are in lo-hi format (its light_3-5.svg, not light_5-3.svg)

function dominoSrc(a: number, b: number): string {

  // check for invalid values
  if (a < 0 || a > 6 || b < 0 || b > 6) {
    throw new Error(`Invalid domino values: ${a}, ${b}. Must be between 0 and 6.`);
  }

  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `/dominoes/light_${lo}-${hi}.svg`;
}

export default dominoSrc;