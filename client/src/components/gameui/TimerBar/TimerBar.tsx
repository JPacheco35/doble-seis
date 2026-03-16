import React from 'react';

interface TimerBarProps {
    timerPct: number;
    timerColor: string;
}

export default function TimerBar({timerPct, timerColor}:TimerBarProps) {
    return (
        <div
            className="game-timer-track"
            style={{
                height: 3,
                position: 'relative',
                zIndex: 4
            }}
        >
            <div
                className="game-timer-fill"
                style={{
                    height: '100%',
                    width: `${timerPct}%`,
                    background: `linear-gradient(90deg,${timerColor},${timerPct < 20 ? '#f47a42' : timerPct < 50 ? '#f4c042' : '#f4b942'})`,
                    transition: 'width 1s linear, background 0.35s ease',
            }} />
        </div>
    )
}