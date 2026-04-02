import React from 'react';
import CornerCard from "../CornerCard/CornerCard.tsx";
import './SinglePlayerCard.css';
import {Button, Text} from "@mantine/core";

interface SinglePlayerCardProps {
    isJoined: boolean;
    isHosting: boolean;
}

export default function SinglePlayerCard({isJoined, isHosting}:SinglePlayerCardProps) {
    return (
        <CornerCard>
            <Text
                style={{
                    fontSize: 18,
                    letterSpacing: '0.15em',
                    color: 'rgba(200,184,122,0.6)',
                    marginBottom: 20,
                }}
            >
                Play Singleplayer
            </Text>

            <Button
                className="play-button"
                style={{ width: '100%' }}
                onClick={() => {console.log('SinglePlayerCard clicked')}}
                disabled={isJoined || isHosting}
            >
                Play
            </Button>
        </CornerCard>
    )
}