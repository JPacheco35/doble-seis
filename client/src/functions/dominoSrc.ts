// helper function to return the correct SVG image for a given domino

function dominoSrc(a: number, b: number): string {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return `/src/assets/dominoes/light_${lo}-${hi}.svg`;
}
export default dominoSrc;