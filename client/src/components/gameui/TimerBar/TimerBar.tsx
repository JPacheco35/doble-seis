import React from 'react';

interface TimerBarProps {
    timerPct: number;
    timerColor: string;
}

export default function TimerBar({timerPct, timerColor}:TimerBarProps) {
    const gradientTail = timerPct <= 20
        ? '#bf1f1f'
        : timerPct <= 50
            ? '#f08e2d'
            : '#2eb34d';

    return (
        <div
            className="game-timer-track"
            style={{
                height: 6,
                borderRadius: 999,
                overflow: 'hidden',
                position: 'relative',
                zIndex: 4
            }}
        >
            <div
                className="game-timer-fill"
                style={{
                    height: '100%',
                    width: `${timerPct}%`,
                    background: `linear-gradient(90deg, ${timerColor} 0%, ${gradientTail} 100%)`,
                    borderRadius: 999,
                    transition: 'width 1s linear, background 0.35s ease',
            }} />
        </div>
    )
}