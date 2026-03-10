import React from 'react';
import { Paper } from '@mantine/core';
import './CornerCard.css';

export default function CornerCard({
  children,
}: {
  children: React.ReactNode;
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
        boxShadow:
          '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Corner decorations */}
      <div className="corner tl" />
      <div className="corner tr" />
      <div className="corner bl" />
      <div className="corner br" />

      {children}
    </Paper>
  );
}
