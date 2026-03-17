import React from 'react';
import { Box, Image } from '@mantine/core';
import dominoSrc from "../../../functions/dominoSrc.ts";

interface DominoTileProps {
    left: number;
    right: number;
    size?: number;
    onClick?: () => void;
    valid?: boolean;
    selected?: boolean;
}

export default function DominoTile({ left, right, size = 26, onClick, valid, selected }: DominoTileProps) {
    const [isHovered, setIsHovered] = React.useState(false);

    // size parameters for the domino tile
    const tileWidth = Math.round(size * 1.9);
    const tileHeight = size;

    // Hovering a valid tile uses green highlight; default valid state stays amber.
    const outline = selected
        ? '0 0 0 2px #4caf50, 0 0 10px rgba(76,175,80,0.45)'
        : (valid && isHovered)
            ? '0 0 0 2px rgba(76,175,80,0.7), 0 0 10px rgba(76,175,80,0.35)'
        : valid
            ? '0 0 0 1.5px rgba(244,184,66,0.55), 0 0 7px rgba(244,184,66,0.15)'
            : 'none';

    // return domino tile
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
            cursor: onClick && valid ? 'pointer' : 'default',
        }}>
            <Image
                src={dominoSrc(left, right)}
                alt={`${left}|${right}`}
                width={tileWidth} height={tileHeight}
                style={{
                    transform: 'rotate(90deg)',
                    borderRadius: 3,
                    boxShadow: outline,
                    display: 'block',
                    objectFit: 'contain',
                    transition: 'box-shadow 0.12s ease',
                }}
            />
        </Box>
    );
}