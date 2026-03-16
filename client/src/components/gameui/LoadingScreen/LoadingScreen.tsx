import React from 'react';

export default function LoadingScreen() {
    return (
        <div
            className="wood-grain game-loading-root"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
        <span
            style={{
                fontFamily: 'KomikaTitle, sans-serif',
                fontSize: 24,
                letterSpacing: '0.15em',
                color: 'rgba(200,184,122,0.5)'
            }}
        >
          connecting to game...
        </span>
        </div>
    )
}