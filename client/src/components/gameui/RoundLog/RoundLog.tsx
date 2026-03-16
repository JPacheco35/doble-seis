import React, {useRef} from 'react';;
import dominoSrc from "../../../functions/dominoSrc.ts";

interface RoundLogProps {
    log: any[];
}

const PLAYER_NAME_COLOR = '#ffc94a';

export default function RoundLog({log}: RoundLogProps) {
    const logRef = useRef<HTMLDivElement>(null);

    return (
        <div>
            <div className="game-log-title" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,184,122,0.28)', padding: '7px 12px 5px' }}>
                round log
            </div>
            <div className="game-log-list" ref={logRef} style={{
                flex: 1, overflowY: 'auto', padding: '5px 10px',
                display: 'flex', flexDirection: 'column', gap: 2, scrollbarWidth: 'none',
            }}>
                {log.map((entry, index) => (
                    <div key={entry.id} className="game-log-entry" style={{
                        fontFamily: 'KomikaTitle, sans-serif', fontSize: 10,
                        lineHeight: 1.5, paddingBottom: 2,
                        borderBottom: '0.5px solid rgba(180,140,60,0.04)',
                        color: entry.isFreeKnock ? 'rgba(225,225,225,0.98)'
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
                            <span className="game-log-play" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <b style={{ color: PLAYER_NAME_COLOR, fontWeight: 500 }}>{entry.player}</b>
                  <span>played</span>
                  <img
                      src={dominoSrc(entry.domino.left, entry.domino.right)}
                      alt={`${entry.domino.left}-${entry.domino.right}`}
                      width={22}
                      height={12}
                      style={{
                          display: 'inline-block',
                          objectFit: 'contain',
                          borderRadius: 2,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.28)',
                          verticalAlign: 'middle',
                      }}
                  />
                                {entry.type === 'auto' && <span>(timeout)</span>}
                </span>
                        ) : entry.player
                            ? <><b style={{ color: PLAYER_NAME_COLOR, fontWeight: 500, textShadow: '0 0 6px rgba(255,201,74,0.35)' }}>{entry.player}</b>{' '}{entry.text.replace(entry.player + ' ', '')}</>
                            : entry.text}
                    </div>
                ))}
                {log.length === 0 && (
                    <div className="game-log-empty" style={{ fontFamily: 'KomikaTitle, sans-serif', fontSize: 9, fontStyle: 'italic' }}>
                        Round log will appear here…
                    </div>
                )}
            </div>
        </div>
    )
}