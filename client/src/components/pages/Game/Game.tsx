import React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

interface Player {
  playerId: string;
  username: string;
  team: number;
  handSize: number;
}

interface Domino {
  left: number;
  right: number;
}

interface BoardDomino extends Domino {
  placedBy: string;
}

interface GameState {
  board: BoardDomino[];
  hand: Domino[];
  currentTurn: string;
  scores: { 1: number; 2: number };
  leftEnd: number | null;
  rightEnd: number | null;
  players: Player[];
  roundNumber: number;
}

interface LogEntry {
  id: number;
  text: string;
  type: 'play' | 'knock' | 'score' | 'system' | 'auto';
  player?: string;
}

function dominoSrc(a: number, b: number): string {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `/src/assets/dominoes/light_${lo}-${hi}.svg`;
}

function DominoTile({ left, right, size = 26, onClick, valid, selected }: {
  left: number; right: number; size?: number;
  onClick?: () => void; valid?: boolean; selected?: boolean;
}) {
  const imgW = Math.round(size * 1.9);
  const imgH = size;
  const outline = selected
    ? '0 0 0 2px #4caf50, 0 0 10px rgba(76,175,80,0.45)'
    : valid
      ? '0 0 0 1.5px rgba(244,184,66,0.55), 0 0 7px rgba(244,184,66,0.15)'
      : 'none';

  return (
    <div onClick={onClick} style={{
      width: imgH, height: imgW, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: onClick && valid ? 'pointer' : 'default',
    }}>
      <img
        src={dominoSrc(left, right)}
        alt={`${left}|${right}`}
        width={imgW} height={imgH}
        style={{
          transform: 'rotate(90deg)', borderRadius: 3, boxShadow: outline,
          display: 'block', objectFit: 'contain', transition: 'box-shadow 0.12s ease',
        }}
      />
    </div>
  );
}

function BoardChain({ board }: { board: BoardDomino[] }) {
  if (board.length === 0) {
    return (
      <div style={{
        color: 'rgba(200,184,122,0.18)', fontSize: 11,
        fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.2em',
        textAlign: 'center', width: '100%',
      }}>
        BOARD IS EMPTY — WAITING FOR FIRST PLAY
      </div>
    );
  }

  const TILE_SIZE = 32;
  const imgW = Math.round(TILE_SIZE * 1.9);
  const imgH = TILE_SIZE;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: 3, justifyContent: 'center', maxWidth: '100%',
    }}>
      {board.map((domino, i) => {
        const isDouble = domino.left === domino.right;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {isDouble ? (
              <div style={{
                width: imgH, height: imgW, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={dominoSrc(domino.left, domino.right)}
                  alt={`${domino.left}|${domino.right}`}
                  width={imgW} height={imgH}
                  style={{ transform: 'rotate(90deg)', borderRadius: 3, boxShadow: '1px 2px 5px rgba(0,0,0,0.5)', display: 'block' }}
                />
              </div>
            ) : (
              <img
                src={dominoSrc(domino.left, domino.right)}
                alt={`${domino.left}|${domino.right}`}
                width={imgW} height={imgH}
                style={{ borderRadius: 3, boxShadow: '1px 2px 5px rgba(0,0,0,0.5)', display: 'block', flexShrink: 0 }}
              />
            )}
            {i < board.length - 1 && (
              <div style={{ width: 6, height: 1, background: 'rgba(180,140,60,0.12)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FaceDownTiles({ total, remaining, vertical = false }: {
  total: number; remaining: number; vertical?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: vertical ? 'column' : 'row',
      gap: 2, flexWrap: 'wrap', maxWidth: vertical ? 20 : 120,
    }}>
      {Array.from({ length: total }).map((_, i) => {
        const played = i >= remaining;
        return (
          <div key={i} style={{
            width: vertical ? 18 : 10, height: vertical ? 10 : 16,
            borderRadius: 1,
            background: played ? 'rgba(20,12,3,0.4)' : 'linear-gradient(135deg,#2a1e10,#1a1208)',
            border: `0.5px solid ${played ? 'rgba(40,24,8,0.15)' : 'rgba(180,140,60,0.2)'}`,
            boxShadow: played ? 'none' : '1px 1px 2px rgba(0,0,0,0.4)',
            opacity: played ? 0.2 : 1,
            transition: 'all 0.3s ease',
          }} />
        );
      })}
    </div>
  );
}

function SeatCard({ player, isActive, isMe, position }: {
  player: Player; isActive: boolean; isMe?: boolean;
  position: 'top' | 'left' | 'right' | 'bottom';
}) {
  const teamColor = player.team === 1 ? '#88c0f0' : '#f0956a';
  const teamBorder = player.team === 1 ? 'rgba(74,144,217,0.25)' : 'rgba(217,112,74,0.25)';
  const vertical = position === 'left' || position === 'right';

  return (
    <div style={{
      background: isActive ? 'rgba(8,4,1,0.95)' : 'rgba(8,4,1,0.8)',
      border: `1px solid ${isActive ? 'rgba(76,175,80,0.4)' : isMe ? 'rgba(244,184,66,0.2)' : teamBorder}`,
      borderRadius: 4, padding: '5px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      minWidth: 80,
      boxShadow: isActive ? '0 0 14px rgba(76,175,80,0.1)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', background: teamColor,
          boxShadow: isActive ? `0 0 6px ${teamColor}` : 'none',
        }} />
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.1em',
          color: isActive ? '#7ecf82' : isMe ? '#f4e8c1' : 'rgba(244,232,193,0.65)',
        }}>
          {player.username.toUpperCase()}{isActive ? ' ▶' : ''}
        </span>
        <span style={{
          fontSize: 7, letterSpacing: '0.1em', padding: '1px 4px', borderRadius: 2,
          background: player.team === 1 ? 'rgba(74,144,217,0.1)' : 'rgba(217,112,74,0.1)',
          color: teamColor, border: `0.5px solid ${teamBorder}`,
          fontFamily: "'Bebas Neue', sans-serif",
        }}>
          T{player.team}
        </span>
      </div>
      {!isMe && <FaceDownTiles total={7} remaining={player.handSize} vertical={vertical} />}
      <span style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 9,
        color: isActive ? '#7ecf82' : 'rgba(200,184,122,0.28)',
      }}>
        {isActive ? `${player.handSize} tiles · playing…` : `${player.handSize} tiles`}
      </span>
    </div>
  );
}

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const playerId = localStorage.getItem('playerId');
  const username = localStorage.getItem('username');

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [sidePrompt, setSidePrompt] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logCounter, setLogCounter] = useState(0);
  const [gameOver, setGameOver] = useState<{ winner: number; scores: { 1: number; 2: number } } | null>(null);
  const [bootTimer, setBootTimer] = useState(180);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((text: string, type: LogEntry['type'], player?: string) => {
    setLogCounter(c => {
      const id = c + 1;
      setLog(prev => [{ id, text, type, player }, ...prev.slice(0, 49)]);
      return id;
    });
  }, []);

  const isMyTurn = gameState?.currentTurn === playerId;

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(prev => (prev ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  useEffect(() => {
    if (!gameOver) return;
    if (bootTimer <= 0) { navigate('/lobby'); return; }
    const t = setTimeout(() => setBootTimer(b => b - 1), 1000);
    return () => clearTimeout(t);
  }, [gameOver, bootTimer]);

  useEffect(() => {
    const s = io(`${API_URL}/game`, { auth: { playerId, username } });

    s.on('connect', () => s.emit('joinGame', code));
    s.on('gameState', (data: GameState) => setGameState(data));

    s.on('timerStarted', (data: { currentTurn: string; duration: number }) => {
      setGameState(prev => prev ? { ...prev, currentTurn: data.currentTurn } : prev);
      setTimeLeft(data.duration);
    });

    s.on('dominoPlaced', (data: any) => {
      setGameState(prev => {
        if (!prev) return prev;
        const placerName = prev.players.find(p => p.playerId === data.playerId)?.username ?? data.playerId;
        const type: LogEntry['type'] = data.autoPlayed ? 'auto' : 'play';
        const text = data.autoPlayed
          ? `${placerName} auto-played (timer)`
          : `${placerName} played ${data.board[data.board.length - 1]?.left}|${data.board[data.board.length - 1]?.right}`;
        addLog(text, type, placerName);
        return { ...prev, board: data.board, leftEnd: data.leftEnd, rightEnd: data.rightEnd };
      });
    });

    s.on('handUpdated', (data: any) => {
      setGameState(prev => prev ? { ...prev, hand: data.hand } : prev);
    });

    s.on('handSizesUpdated', (data: any) => {
      setGameState(prev => prev ? {
        ...prev,
        players: prev.players.map(p => ({ ...p, handSize: data.handSizes[p.playerId] ?? p.handSize })),
      } : prev);
    });

    s.on('turnChanged', (data: any) => {
      setGameState(prev => prev ? { ...prev, currentTurn: data.currentTurn } : prev);
    });

    s.on('playerKnocked', (data: any) => {
      setGameState(prev => prev ? { ...prev, scores: data.scores } : prev);
      addLog(`${data.username} knocked — ${data.points}pt to opposing team`, 'knock', data.username);
    });

    s.on('softLock', (data: any) => {
      setGameState(prev => prev ? { ...prev, scores: data.scores } : prev);
      addLog('Soft lock — 2pts awarded', 'score');
    });

    s.on('roundStarted', (data: any) => {
      setGameState(prev => prev ? {
        ...prev, board: [], leftEnd: null, rightEnd: null,
        roundNumber: data.roundNumber, currentTurn: data.currentTurn,
      } : prev);
      setTimeLeft(data.timeLimit);
      addLog(`— Round ${data.roundNumber} started —`, 'system');
    });

    s.on('roundEnded', (data: any) => {
      setGameState(prev => prev ? { ...prev, scores: data.scores } : prev);
      addLog(`Round ended — tally ${data.tally} = ${data.points}pts to Team ${data.winningTeam}`, 'score');
      setTimeLeft(null);
    });

    s.on('gameOver', (data: any) => {
      setGameOver({ winner: data.winner, scores: data.scores });
      setTimeLeft(null);
      addLog(`Game over — Team ${data.winner} wins!`, 'score');
    });

    s.on('gameError', () => navigate('/lobby'));

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  const getValidIndices = (): number[] => {
    if (!gameState) return [];
    const { hand, leftEnd, rightEnd, board, roundNumber } = gameState;
    if (board.length === 0 && roundNumber === 1)
      return hand.map((_, i) => i).filter(i => hand[i].left === 6 && hand[i].right === 6);
    if (board.length === 0) return hand.map((_, i) => i);
    return hand.reduce((acc: number[], d, i) => {
      if (d.left === leftEnd || d.right === leftEnd || d.left === rightEnd || d.right === rightEnd)
        acc.push(i);
      return acc;
    }, []);
  };

  const validIndices = isMyTurn ? getValidIndices() : [];

  const handlePlaceDomino = (dominoIndex: number) => {
    if (!isMyTurn || !validIndices.includes(dominoIndex)) return;
    const domino = gameState!.hand[dominoIndex];
    const { leftEnd, rightEnd, board } = gameState!;
    if (board.length === 0) {
      socket?.emit('placeDomino', { code, dominoIndex, side: 'right' });
      return;
    }
    const fitsLeft = domino.left === leftEnd || domino.right === leftEnd;
    const fitsRight = domino.left === rightEnd || domino.right === rightEnd;
    if (fitsLeft && fitsRight) { setSidePrompt(dominoIndex); return; }
    socket?.emit('placeDomino', { code, dominoIndex, side: fitsLeft ? 'left' : 'right' });
  };

  const getSeatedPlayers = () => {
    if (!gameState) return { bottom: null, left: null, top: null, right: null };
    const me = gameState.players.find(p => p.playerId === playerId);
    if (!me) return { bottom: null, left: null, top: null, right: null };
    const myIndex = gameState.players.indexOf(me);
    const order = [0, 1, 2, 3].map(offset => gameState.players[(myIndex + offset) % 4]);
    return { bottom: order[0], left: order[1], top: order[2], right: order[3] };
  };

  const seats = getSeatedPlayers();
  const timerPct = timeLeft !== null ? (timeLeft / 30) * 100 : 100;
  const timerColor = timerPct < 20 ? '#e05555' : timerPct < 50 ? '#f4a042' : '#4caf50';
  const formatBoot = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!gameState) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#160d06' }}>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: '0.15em', color: 'rgba(200,184,122,0.5)' }}>
        CONNECTING TO GAME…
      </span>
    </div>
  );

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#160d06',
      fontFamily: "'Bebas Neue', sans-serif", color: '#f4e8c1',
      display: 'grid', gridTemplateColumns: '1fr 230px', gridTemplateRows: '38px 1fr',
      overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{
        gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', background: 'rgba(8,4,1,0.97)',
        borderBottom: '1px solid rgba(180,140,60,0.16)', zIndex: 3,
      }}>
        <div style={{
          fontSize: 19, letterSpacing: '0.12em',
          background: 'linear-gradient(90deg,#ff4f64,#ff8c42)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          ¡Doble Seis!
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[1, 2].map(t => (
            <div key={t} style={{
              padding: '2px 11px', borderRadius: 3, fontSize: 11, letterSpacing: '0.1em',
              background: t === 1 ? 'rgba(74,144,217,0.1)' : 'rgba(217,112,74,0.1)',
              color: t === 1 ? '#88c0f0' : '#f0956a',
              border: `1px solid ${t === 1 ? 'rgba(74,144,217,0.28)' : 'rgba(217,112,74,0.28)'}`,
            }}>
              TEAM {t} — {gameState.scores[t as 1 | 2]} PTS
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 5px #4caf50' }} />
          <span style={{ fontSize: 10, color: 'rgba(200,184,122,0.3)', letterSpacing: '0.12em' }}>
            GAME #{code} · RND {gameState.roundNumber}
          </span>
        </div>
      </div>

      {/* TABLE AREA */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* felt */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 48%,#1e3d1b 0%,#122810 52%,#0a1b0b 100%)',
        }}>
          {/* grid texture */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(0,0,0,0.022) 27px,rgba(0,0,0,0.022) 28px),repeating-linear-gradient(90deg,transparent,transparent 27px,rgba(0,0,0,0.022) 27px,rgba(0,0,0,0.022) 28px)',
          }} />

          {/* border frame */}
          <div style={{
            position: 'absolute', inset: 8,
            border: '1px solid rgba(180,140,60,0.1)', borderRadius: 8, pointerEvents: 'none', zIndex: 2,
          }}>
            {[
              { top: -1, left: -1, borderWidth: '2px 0 0 2px' },
              { top: -1, right: -1, borderWidth: '2px 2px 0 0' },
              { bottom: -1, left: -1, borderWidth: '0 0 2px 2px' },
              { bottom: -1, right: -1, borderWidth: '0 2px 2px 0' },
            ].map((s, i) => (
              <div key={i} style={{
                position: 'absolute', width: 12, height: 12,
                borderColor: 'rgba(180,140,60,0.28)', borderStyle: 'solid', ...s,
              }} />
            ))}
          </div>

          {/* end labels */}
          {gameState.board.length > 0 && (
            <>
              <div style={{
                position: 'absolute', left: 26, top: '50%', transform: 'translateY(-50%)', zIndex: 3,
                background: 'rgba(6,3,0,0.88)', border: '1px solid rgba(180,140,60,0.2)',
                borderRadius: 3, padding: '2px 7px', fontSize: 13, color: '#f4b942', letterSpacing: '0.08em',
              }}>{gameState.leftEnd}</div>
              <div style={{
                position: 'absolute', right: 26, top: '50%', transform: 'translateY(-50%)', zIndex: 3,
                background: 'rgba(6,3,0,0.88)', border: '1px solid rgba(180,140,60,0.2)',
                borderRadius: 3, padding: '2px 7px', fontSize: 13, color: '#f4b942', letterSpacing: '0.08em',
              }}>{gameState.rightEnd}</div>
            </>
          )}

          {/* seats */}
          {seats.top && (
            <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
              <SeatCard player={seats.top} isActive={gameState.currentTurn === seats.top.playerId} position="top" />
            </div>
          )}
          {seats.left && (
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>
              <SeatCard player={seats.left} isActive={gameState.currentTurn === seats.left.playerId} position="left" />
            </div>
          )}
          {seats.right && (
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>
              <SeatCard player={seats.right} isActive={gameState.currentTurn === seats.right.playerId} position="right" />
            </div>
          )}

          {/* board chain */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '60px 110px',
          }}>
            <BoardChain board={gameState.board} />
          </div>
        </div>

        {/* timer bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', position: 'relative', zIndex: 4 }}>
          <div style={{
            height: '100%', width: `${timerPct}%`,
            background: `linear-gradient(90deg,${timerColor},${timerPct < 20 ? '#f47a42' : timerPct < 50 ? '#f4c042' : '#f4b942'})`,
            transition: 'width 1s linear, background 0.5s ease',
          }} />
        </div>

        {/* hand tray */}
        <div style={{
          padding: '8px 14px 10px', background: 'rgba(6,3,0,0.92)',
          borderTop: '1px solid rgba(180,140,60,0.12)',
          display: 'flex', flexDirection: 'column', gap: 5, zIndex: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {seats.bottom && (
              <>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: seats.bottom.team === 1 ? '#88c0f0' : '#f0956a' }} />
                <span style={{ fontSize: 9, letterSpacing: '0.14em', color: isMyTurn ? '#7ecf82' : 'rgba(200,184,122,0.35)' }}>
                  {isMyTurn
                    ? gameState.board.length === 0 && gameState.roundNumber === 1
                      ? 'YOUR TURN — PLAY THE 6|6 TO OPEN'
                      : 'YOUR TURN — PLAY A TILE'
                    : `YOU (TEAM ${seats.bottom.team}) — WAITING…`}
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(200,184,122,0.18)', textAlign: 'center' }}>
            YOUR HAND
          </div>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'flex-end' }}>
            {gameState.hand?.map((domino, i) => {
              const isValid = validIndices.includes(i);
              return (
                <div key={i} style={{ opacity: isMyTurn && !isValid ? 0.22 : 1, transition: 'opacity 0.2s' }}>
                  <DominoTile
                    left={domino.left} right={domino.right}
                    size={40} valid={isValid}
                    onClick={isValid ? () => handlePlaceDomino(i) : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        background: 'rgba(6,3,0,0.9)', borderLeft: '1px solid rgba(180,140,60,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '5px 12px',
          background: 'rgba(180,140,60,0.04)', borderBottom: '0.5px solid rgba(180,140,60,0.07)',
          fontSize: 9, letterSpacing: '0.12em', color: 'rgba(200,184,122,0.28)',
        }}>
          <span>ROUND <span style={{ color: 'rgba(244,184,66,0.48)', fontSize: 10 }}>{gameState.roundNumber}</span></span>
          <span>FIRST TO <span style={{ color: 'rgba(244,184,66,0.48)', fontSize: 10 }}>20</span></span>
        </div>

        <div style={{ padding: '9px 12px', borderBottom: '0.5px solid rgba(180,140,60,0.07)' }}>
          {[1, 2].map(t => (
            <div key={t} style={{ marginBottom: t === 1 ? 8 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.1em', color: t === 1 ? '#88c0f0' : '#f0956a' }}>TEAM {t}</span>
                <span style={{ fontSize: 15, color: t === 1 ? '#88c0f0' : '#f0956a' }}>{gameState.scores[t as 1 | 2]}</span>
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 1, marginBottom: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 1,
                  width: `${Math.min(100, (gameState.scores[t as 1 | 2] / 20) * 100)}%`,
                  background: t === 1 ? '#4a90d9' : '#d9704a', transition: 'width 0.4s ease',
                }} />
              </div>
              {gameState.players.filter(p => p.team === t).map(p => (
                <div key={p.playerId} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 9,
                  color: 'rgba(200,184,122,0.25)', letterSpacing: '0.06em', padding: '1px 0',
                }}>
                  <span>{p.username.toUpperCase()}</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, color: 'rgba(244,184,66,0.4)' }}>—</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,184,122,0.28)', padding: '7px 12px 5px', borderBottom: '0.5px solid rgba(180,140,60,0.07)' }}>
          ROUND LOG
        </div>
        <div ref={logRef} style={{
          flex: 1, overflowY: 'auto', padding: '5px 10px',
          display: 'flex', flexDirection: 'column', gap: 2, scrollbarWidth: 'none',
        }}>
          {log.map(entry => (
            <div key={entry.id} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10,
              lineHeight: 1.5, paddingBottom: 2,
              borderBottom: '0.5px solid rgba(180,140,60,0.04)',
              color: entry.type === 'knock' ? 'rgba(217,112,74,0.5)'
                : entry.type === 'score' ? 'rgba(76,175,80,0.5)'
                  : entry.type === 'system' ? 'rgba(200,184,122,0.15)'
                    : 'rgba(200,184,122,0.35)',
            }}>
              {entry.player
                ? <><b style={{ color: 'rgba(244,184,66,0.58)', fontWeight: 500 }}>{entry.player}</b>{' '}{entry.text.replace(entry.player + ' ', '')}</>
                : entry.text}
            </div>
          ))}
          {log.length === 0 && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'rgba(200,184,122,0.15)', fontStyle: 'italic' }}>
              Round log will appear here…
            </div>
          )}
        </div>
      </div>

      {/* SIDE PROMPT */}
      {sidePrompt !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: 'rgba(10,5,1,0.98)', border: '1px solid rgba(180,140,60,0.28)',
            borderRadius: 6, padding: '24px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(200,184,122,0.3)', marginBottom: 8 }}>WHICH END?</div>
            <div style={{ fontFamily: "'Abril Fatface', serif", fontSize: 22, color: '#f4e8c1', marginBottom: 18 }}>
              {gameState.hand[sidePrompt]?.left}|{gameState.hand[sidePrompt]?.right}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {([
                { side: 'left' as const, color: '#88c0f0', border: 'rgba(74,144,217,0.3)', label: `← LEFT (${gameState.leftEnd})` },
                { side: 'right' as const, color: '#f0956a', border: 'rgba(217,112,74,0.3)', label: `RIGHT (${gameState.rightEnd}) →` },
              ]).map(({ side, color, border, label }) => (
                <div key={side}
                     onClick={() => { socket?.emit('placeDomino', { code, dominoIndex: sidePrompt, side }); setSidePrompt(null); }}
                     style={{ padding: '8px 16px', borderRadius: 3, border: `1px solid ${border}`, color, cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em' }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POST GAME */}
      {gameOver && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.87)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{
            background: 'rgba(10,5,1,0.98)', border: '1px solid rgba(180,140,60,0.25)',
            borderRadius: 6, padding: '24px 32px', textAlign: 'center', width: 300,
          }}>
            <div style={{ fontSize: 28, color: '#f4b942', letterSpacing: '0.1em', marginBottom: 2 }}>
              TEAM {gameOver.winner} WINS!
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(200,184,122,0.28)', textTransform: 'uppercase', marginBottom: 18 }}>
              Final Score · Round {gameState.roundNumber}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[1, 2].map(t => (
                <div key={t} style={{
                  borderRadius: 4, padding: '10px',
                  border: `1px solid ${t === 1 ? 'rgba(74,144,217,0.28)' : 'rgba(217,112,74,0.28)'}`,
                  background: t === 1 ? 'rgba(74,144,217,0.05)' : 'rgba(217,112,74,0.05)',
                }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.14em', color: t === 1 ? '#88c0f0' : '#f0956a', marginBottom: 2 }}>TEAM {t}</div>
                  <div style={{ fontSize: 24, color: t === 1 ? '#88c0f0' : '#f0956a', marginBottom: 5 }}>{gameOver.scores[t as 1 | 2]}</div>
                  {gameState.players.filter(p => p.team === t).map(p => (
                    <div key={p.playerId} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: t === 1 ? 'rgba(136,192,240,0.55)' : 'rgba(240,149,106,0.55)' }}>
                      {p.username}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'rgba(200,184,122,0.22)', marginBottom: 12 }}>
              Returning to lobby in {formatBoot(bootTimer)}
            </div>
            <div onClick={() => navigate('/lobby')} style={{
              display: 'inline-block', padding: '7px 20px', borderRadius: 3,
              border: '1px solid rgba(180,140,60,0.22)', background: 'transparent',
              color: 'rgba(200,184,122,0.48)', fontSize: 13, letterSpacing: '0.12em', cursor: 'pointer',
            }}>
              LEAVE GAME
            </div>
          </div>
        </div>
      )}
    </div>
  );
}