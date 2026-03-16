import React from 'react';
import SeatCard from "../SeatCard/SeatCard.tsx";

interface SeatsProps {
    seats: any;
    gameState: any;
    knockedPlayerId?: string | null;
    knockShakeToken?: number;
}

export default function Seats({seats, gameState, knockedPlayerId = null, knockShakeToken = 0}:SeatsProps) {
    return (
        <div>

            {seats.top && (
                <div
                    className="game-seat game-seat-top"
                    style={{ zIndex: 3 }}>
                    <SeatCard
                        key={`${seats.top.playerId}-${knockedPlayerId === seats.top.playerId ? knockShakeToken : 'steady'}`}
                        player={seats.top}
                        isActive={gameState.currentTurn === seats.top.playerId}
                        shouldShake={knockedPlayerId === seats.top.playerId}
                    />
                </div>
            )}

            {seats.left && (
                <div
                    className="game-seat game-seat-left"
                    style={{ zIndex: 3 }}>
                    <SeatCard
                        key={`${seats.left.playerId}-${knockedPlayerId === seats.left.playerId ? knockShakeToken : 'steady'}`}
                        player={seats.left}
                        isActive={gameState.currentTurn === seats.left.playerId}
                        shouldShake={knockedPlayerId === seats.left.playerId}
                    />
                </div>
            )}

            {seats.right && (
                <div className="game-seat game-seat-right"
                     style={{ zIndex: 3 }}>
                    <SeatCard
                        key={`${seats.right.playerId}-${knockedPlayerId === seats.right.playerId ? knockShakeToken : 'steady'}`}
                        player={seats.right}
                        isActive={gameState.currentTurn === seats.right.playerId}
                        shouldShake={knockedPlayerId === seats.right.playerId}
                    />
                </div>
            )}

        </div>
    )
}