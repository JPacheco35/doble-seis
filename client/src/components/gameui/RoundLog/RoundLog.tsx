import React, { useEffect, useRef, useState } from 'react';
import { Box, Image, Text } from '@mantine/core';
import dominoSrc from "../../../functions/dominoSrc.ts";

interface RoundLogProps {
    log: any[];
}

const PLAYER_NAME_COLOR = '#ffc94a';

export default function RoundLog({log}: RoundLogProps) {
    const logRef = useRef<HTMLDivElement>(null);
    const previousTopIdRef = useRef<number | null>(null);
    const [animatedEntryId, setAnimatedEntryId] = useState<number | null>(null);
    const isCompactScoreSnapshot = (text: string) => /^\d+-\d+ (Blue Team|Red Team)$/.test(text) || /^\d+-\d+ Team [12]$/.test(text);

    useEffect(() => {
        if (log.length === 0) return;

        const currentTopId = log[0].id;
        if (previousTopIdRef.current === null) {
            // Avoid animating hydrated/restored entries on first render.
            previousTopIdRef.current = currentTopId;
            return;
        }

        if (currentTopId !== previousTopIdRef.current) {
            setAnimatedEntryId(currentTopId);
            previousTopIdRef.current = currentTopId;
        }
    }, [log]);

    useEffect(() => {
        if (animatedEntryId === null) return;
        const timeout = setTimeout(() => setAnimatedEntryId(null), 360);
        return () => clearTimeout(timeout);
    }, [animatedEntryId]);

    return (
        <Box>
            <Text className="game-log-title" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(235,218,165,0.68)', padding: '7px 12px 5px' }}>
                round log
            </Text>
            <Box className="game-log-list" ref={logRef} style={{
                flex: 1, overflowY: 'auto', padding: '5px 10px',
                display: 'flex', flexDirection: 'column', gap: 2, scrollbarWidth: 'none',
            }}>
                {log.map((entry, index) => (
                    <Box key={entry.id} className={`game-log-entry${animatedEntryId === entry.id ? ' game-log-entry-enter' : ''}`} style={{
                        fontFamily: 'KomikaTitle, sans-serif', fontSize: 11,
                        lineHeight: 1.6, paddingBottom: 3,
                        borderBottom: '0.5px solid rgba(180,140,60,0.04)',
                        color: isCompactScoreSnapshot(entry.text) ? 'rgba(205,205,205,0.95)'
                            : entry.isFreeKnock ? 'rgba(225,225,225,0.98)'
                            : entry.outcome === 'win' ? 'rgba(156,242,160,0.98)'
                                : entry.outcome === 'lose' ? 'rgba(255,168,128,0.98)'
                                    : entry.type === 'knock' ? 'rgba(255,168,128,0.98)'
                                        : entry.type === 'score' ? 'rgba(156,242,160,0.98)'
                                            : entry.type === 'system' ? 'rgba(245,231,188,0.9)'
                                                : 'rgba(245,228,176,0.96)',
                        opacity: index === 0 ? 1 : Math.max(0.84, 0.97 - index * 0.01),
                        textShadow: index === 0 ? '0 0 9px rgba(255,247,215,0.42)' : '0 0 3px rgba(255,247,215,0.16)',
                        transition: 'opacity 0.2s ease',
                    }}>
                        {entry.player && entry.domino && (entry.type === 'play' || entry.type === 'auto') ? (
                            <Box className="game-log-play" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text span style={{ color: PLAYER_NAME_COLOR, fontWeight: 500 }}>{entry.player}</Text>
                  <Text span>played</Text>
                  <Image
                      src={dominoSrc(entry.domino.left, entry.domino.right)}
                      alt={`${entry.domino.left}-${entry.domino.right}`}
                      w={30}
                      h={16}
                      style={{
                          display: 'inline-block',
                          objectFit: 'contain',
                          background: 'rgba(255,248,232,0.96)',
                          border: '1px solid rgba(180,140,60,0.28)',
                          borderRadius: 3,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.34)',
                          verticalAlign: 'middle',
                      }}
                  />
                                {entry.type === 'auto' && <Text span>(timeout)</Text>}
                </Box>
                        ) : entry.player
                            ? <><Text span style={{ color: PLAYER_NAME_COLOR, fontWeight: 500, textShadow: '0 0 6px rgba(255,201,74,0.35)' }}>{entry.player}</Text>{' '}{entry.text.replace(entry.player + ' ', '')}</>
                            : entry.text}
                    </Box>
                ))}
                {log.length === 0 && (
                    <Text className="game-log-empty" style={{ fontFamily: 'KomikaTitle, sans-serif', fontSize: 9, fontStyle: 'italic' }}>
                        Round log will appear here…
                    </Text>
                )}
            </Box>
        </Box>
    )
}