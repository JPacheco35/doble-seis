import React from 'react';
import SeatCard from "../SeatCard/SeatCard.tsx";

interface SeatsProps {
    seats: any;
    gameState: any;
}

export default function Seats({seats, gameState}:SeatsProps) {
    return (
        <div>

            {seats.top && (
                <div
                    className="game-seat game-seat-top"
                    style={{ zIndex: 3 }}>
                    <SeatCard player={seats.top} isActive={gameState.currentTurn === seats.top.playerId} />
                </div>
            )}

            {seats.left && (
                <div
                    className="game-seat game-seat-left"
                    style={{ zIndex: 3 }}>
                    <SeatCard player={seats.left} isActive={gameState.currentTurn === seats.left.playerId} />
                </div>
            )}

            {seats.right && (
                <div className="game-seat game-seat-right"
                     style={{ zIndex: 3 }}>
                    <SeatCard player={seats.right} isActive={gameState.currentTurn === seats.right.playerId} />
                </div>
            )}

        </div>
    )
}