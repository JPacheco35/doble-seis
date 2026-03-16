import React from 'react';

interface TimerBarProps {
    timerPct: number;
    timerColor: string;
    remainingSeconds: number | null;
}

export default function TimerBar({timerPct, timerColor, remainingSeconds}:TimerBarProps) {
    const gradientTail = timerPct <= 20
        ? '#bf1f1f'
        : timerPct <= 50
            ? '#f08e2d'
            : '#2eb34d';

    return (
        <div
            className="game-timer-track"
            style={{
                height: 14,
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

            <span style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'KomikaTitle, sans-serif',
                fontSize: 10,
                lineHeight: 1,
                color: '#fff7dc',
                letterSpacing: '0.08em',
                textShadow: '0 0 4px rgba(0,0,0,0.7)',
                pointerEvents: 'none',
            }}>
                {Math.max(0, Math.floor(remainingSeconds ?? 0))}s
            </span>
        </div>
    )
}