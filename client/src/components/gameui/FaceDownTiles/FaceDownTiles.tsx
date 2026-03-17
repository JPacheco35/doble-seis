import React from 'react';
import { Group, Box } from '@mantine/core';

interface FaceDownTilesProps {
    total: number;
    remaining: number;
}

// TESTING: configure the size of the face down tiles
const tileWidth = 12;
const tileHeight = 18;

export default function FaceDownTiles({ total, remaining }: FaceDownTilesProps) {
    return (
        <Group style={{
            gap: 2,
            flexWrap: 'wrap',
            maxWidth: 96,
            width: '100%',
            justifyContent: 'center',
        }}>

            {/*create a facedown tile for each domino remaining*/}
            {Array.from({ length: total }).map((_, i) => {
                const played = i >= remaining;
                return (
                    <Box key={i} style={{
                        width: tileWidth,
                        height: tileHeight,
                        borderRadius: 1,
                        background: played ? 'rgba(24,14,5,0.5)' : 'linear-gradient(135deg,#3a2a16,#23170c)',
                        border: `0.5px solid ${played ? 'rgba(70,42,15,0.22)' : 'rgba(205,162,78,0.35)'}`,
                        boxShadow: played ? '0 0 1px rgba(0,0,0,0.25)' : '1px 1px 3px rgba(0,0,0,0.5)',
                        opacity: played ? 0.35 : 1,
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                    }} />
                );
            })}

        </Group>
    );
}