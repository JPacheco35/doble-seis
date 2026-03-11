import { Paper } from '@mantine/core';
import './CornerCard.css';
import React from "react";

export default function CornerCard({
   children,
   style,
    cornerSize=20,
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
    cornerSize?: number;
}) {
    return (
        <Paper
            style={{
                position: 'relative',
                background: 'rgba(10, 7, 3, 0.6)',
                border: '1px solid rgba(180, 140, 60, 0.2)',
                backdropFilter: 'blur(12px)',
                padding: '52px 56px 44px',
                borderRadius: '20px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                ...style,
            }}
        >
            <div className="corner tl" style={{ width: cornerSize, height: cornerSize }} />
            <div className="corner tr" style={{ width: cornerSize, height: cornerSize }} />
            <div className="corner bl" style={{ width: cornerSize, height: cornerSize }} />
            <div className="corner br" style={{ width: cornerSize, height: cornerSize }} />
            {children}
        </Paper>
    );
}