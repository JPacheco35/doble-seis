import React from 'react';

interface FaceDownTilesProps {
    total: number;
    remaining: number;
}

// TESTING: configure the size of the face down tiles
const tileWidth = 12;
const tileHeight = 18;

export default function FaceDownTiles({ total, remaining }: FaceDownTilesProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            flexWrap: 'wrap',
            maxWidth: 96,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        }}>

            {/*create a facedown tile for each domino remaining*/}
            {Array.from({ length: total }).map((_, i) => {
                const played = i >= remaining;
                return (
                    <div key={i} style={{
                        width: tileWidth,
                        height: tileHeight,
                        borderRadius: 1,
                        background: played ? 'rgba(20,12,3,0.4)' : 'linear-gradient(135deg,#2a1e10,#1a1208)',
                        border: `0.5px solid ${played ? 'rgba(40,24,8,0.15)' : 'rgba(180,140,60,0.2)'}`,
                        boxShadow: played ? 'none' : '1px 1px 2px rgba(0,0,0,0.4)',
                        opacity: played ? 0.2 : 1,
                        transition: 'all 0.3s ease',
                    }} />
                );
            })}

        </div>
    );
}