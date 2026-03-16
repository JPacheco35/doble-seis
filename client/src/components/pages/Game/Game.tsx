import React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import BGDominoes from '../../animations/BGDominoes/BGDominoes.tsx';
import Logo from '../../ui/Logo/Logo.tsx';
import './Game.css';
import dominoSrc from "../../../functions/dominoSrc.ts";
import DominoBoard from '../../gameui/DominoBoard/DominoBoard.tsx';

const API_URL = import.meta.env.VITE_API_URL;

// Hand sizing knobs: tweak these to scale all player/opponent hand tiles.
const PLAYER_HAND_TILE_SIZE = 40;
const OPPONENT_TILE_WIDTH = 12;
const OPPONENT_TILE_HEIGHT = 18;
const PLAYER_NAME_COLOR = '#ffc94a';


interface Player {
  playerId: string;
  username: string;
  team: number;
  handSize: number;
  points: number;
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

interface ScorePayload {
  scores: { 1: number; 2: number };
  playerScores?: Record<string, number>;
}

interface DominoPlacedPayload {
  playerId: string;
  placedDomino?: Domino;
  moveNumber?: number;
  side?: 'left' | 'right';
  board: BoardDomino[];
  leftEnd: number | null;
  rightEnd: number | null;
  autoPlayed: boolean;
}

interface LogEntry {
  id: number;
  text: string;
  type: 'play' | 'knock' | 'score' | 'system' | 'auto';
  player?: string;
  domino?: Domino;
  outcome?: 'win' | 'lose';
  isFreeKnock?: boolean;
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

function FaceDownTiles({ total, remaining }: {
  total: number; remaining: number;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'row',
      gap: 2,
      flexWrap: 'wrap',
      maxWidth: 96,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {Array.from({ length: total }).map((_, i) => {
        const played = i >= remaining;
        return (
          <div key={i} style={{
            width: OPPONENT_TILE_WIDTH, height: OPPONENT_TILE_HEIGHT,
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

function SeatCard({ player, isActive, isMe }: {
  player: Player; isActive: boolean; isMe?: boolean;
}) {
  const teamColor = player.team === 1 ? '#88c0f0' : '#f0956a';
  const teamBorder = player.team === 1 ? 'rgba(74,144,217,0.25)' : 'rgba(217,112,74,0.25)';

  return (
    <div style={{
      background: isActive ? 'rgba(8,4,1,0.95)' : 'rgba(8,4,1,0.8)',
      border: `2px solid ${isActive ? 'rgba(76,175,80,0.4)' : isMe ? 'rgba(244,184,66,0.2)' : teamBorder}`,
      borderRadius: 15, padding: '5px 10px',
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
          fontFamily: 'KomikaTitle, sans-serif', fontSize: 12, letterSpacing: '0.1em',
          color: isActive ? '#7ecf82' : PLAYER_NAME_COLOR,
          textShadow: isActive ? 'none' : '0 0 6px rgba(255,201,74,0.35)',
        }}>
          {player.username.toUpperCase()}{isActive ? ' ▶' : ''}
        </span>
        <span style={{
          fontSize: 7, letterSpacing: '0.1em', padding: '1px 4px', borderRadius: 2,
          background: player.team === 1 ? 'rgba(74,144,217,0.1)' : 'rgba(217,112,74,0.1)',
          color: teamColor, border: `0.5px solid ${teamBorder}`,
          fontFamily: 'KomikaTitle, sans-serif',
        }}>
          T{player.team}
        </span>
      </div>
      {!isMe && <FaceDownTiles total={7} remaining={player.handSize} />}
      <span style={{
        fontFamily: 'KomikaTitle, sans-serif', fontSize: 9,
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
  const logStorageKey = `game-log:v1:${code ?? 'unknown'}:${playerId ?? 'anon'}`;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [sidePrompt, setSidePrompt] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logsHydrated, setLogsHydrated] = useState(false);
  const [gameOver, setGameOver] = useState<{ winner: number; scores: { 1: number; 2: number } } | null>(null);
  const [bootTimer, setBootTimer] = useState(180);
  const logRef = useRef<HTMLDivElement>(null);
  const logEntriesRef = useRef<LogEntry[]>([]);
  const gameStateRef = useRef<GameState | null>(null);
  const lastDominoLogKeyRef = useRef('');
  const logCounterRef = useRef(0);
  const lastRoundStartLogKeyRef = useRef('');

  useEffect(() => {
    setLogsHydrated(false);

    let restoredLog: LogEntry[] = [];
    try {
      const raw = localStorage.getItem(logStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          log?: LogEntry[];
          logCounter?: number;
          lastDominoLogKey?: string;
        };

        if (Array.isArray(parsed.log)) restoredLog = parsed.log.slice(0, 50);
        logCounterRef.current = typeof parsed.logCounter === 'number' ? parsed.logCounter : 0;
        lastDominoLogKeyRef.current = parsed.lastDominoLogKey ?? '';
      } else {
        logCounterRef.current = 0;
        lastDominoLogKeyRef.current = '';
      }
    } catch {
      // Ignore invalid persisted log payloads.
      logCounterRef.current = 0;
      lastDominoLogKeyRef.current = '';
    }

    lastRoundStartLogKeyRef.current = '';

    setLog(restoredLog);
    setLogsHydrated(true);
  }, [logStorageKey]);

  useEffect(() => {
    if (!logsHydrated) return;
    try {
      localStorage.setItem(logStorageKey, JSON.stringify({
        log,
        logCounter: logCounterRef.current,
        lastDominoLogKey: lastDominoLogKeyRef.current,
      }));
    } catch {
      // Ignore storage write failures; gameplay should continue.
    }
  }, [log, logStorageKey, logsHydrated]);

  const addLog = useCallback((
    text: string,
    type: LogEntry['type'],
    player?: string,
    domino?: Domino,
    outcome?: LogEntry['outcome'],
    isFreeKnock?: boolean
  ) => {
    logCounterRef.current += 1;
    const id = logCounterRef.current;
    setLog(prev => [{ id, text, type, player, domino, outcome, isFreeKnock }, ...prev.slice(0, 49)]);
  }, []);

  const clearRoundLog = useCallback(() => {
    logCounterRef.current = 0;
    lastDominoLogKeyRef.current = '';
    lastRoundStartLogKeyRef.current = '';
    setLog([]);
  }, []);

  const isMyTurn = gameState?.currentTurn === playerId;

  useEffect(() => {
    logEntriesRef.current = log;
  }, [log]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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
    s.on('gameState', (data: GameState) => {
      setGameState(prev => ({
        ...data,
        roundNumber: data.roundNumber ?? prev?.roundNumber ?? 1,
        players: (data.players || []).map((p) => ({
          ...p,
          points: p.points ?? prev?.players.find((old) => old.playerId === p.playerId)?.points ?? 0,
        })),
      }));
    });

    s.on('timerStarted', (data: { currentTurn: string; duration: number }) => {
      setGameState(prev => prev ? { ...prev, currentTurn: data.currentTurn } : prev);
      setTimeLeft(data.duration);
    });

    s.on('dominoPlaced', (data: DominoPlacedPayload) => {
      const inferredLast = data.board?.[data.board.length - 1];
      const placed = data.placedDomino ?? inferredLast;
      const eventKey = [
        typeof data.moveNumber === 'number' ? `m${data.moveNumber}` : data.playerId,
        `${placed?.left ?? 'x'}-${placed?.right ?? 'x'}`,
        data.side ?? 'x',
      ].join(':');

      if (lastDominoLogKeyRef.current === eventKey) return;
      lastDominoLogKeyRef.current = eventKey;

      const placerName = gameStateRef.current?.players.find(p => p.playerId === data.playerId)?.username ?? data.playerId;
      const type: LogEntry['type'] = data.autoPlayed ? 'auto' : 'play';
      const tileLabel = placed ? `${placed.left}-${placed.right}` : '?-?';
      const text = data.autoPlayed
        ? `${placerName} played ${tileLabel} (timeout)`
        : `${placerName} played ${tileLabel}`;

      addLog(text, type, placerName, placed);
      setGameState(prev => prev ? { ...prev, board: data.board, leftEnd: data.leftEnd, rightEnd: data.rightEnd } : prev);
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

    s.on('playerKnocked', (data: ScorePayload & { playerId: string; username: string; points: number; isFreeKnock?: boolean }) => {
      setGameState(prev => prev ? {
        ...prev,
        scores: data.scores,
        players: prev.players.map((p) => ({
          ...p,
          points: data.playerScores?.[p.playerId] ?? p.points,
        })),
      } : prev);

      const myTeam = gameStateRef.current?.players.find(p => p.playerId === playerId)?.team;
      const knockerTeam = gameStateRef.current?.players.find(p => p.playerId === data.playerId)?.team;
      const outcome = myTeam && knockerTeam
        ? (knockerTeam === myTeam ? 'lose' : 'win')
        : undefined;

      addLog(
        data.isFreeKnock
          ? `${data.username} knocked — free knock (no points)`
          : `${data.username} knocked — ${data.points}pt to opposing team`,
        'knock',
        data.username,
        undefined,
        outcome,
        data.isFreeKnock
      );
    });

    s.on('softLock', (data: ScorePayload & { playerId?: string }) => {
      setGameState(prev => prev ? {
        ...prev,
        scores: data.scores,
        players: prev.players.map((p) => ({
          ...p,
          points: data.playerScores?.[p.playerId] ?? p.points,
        })),
      } : prev);

      const myTeam = gameStateRef.current?.players.find(p => p.playerId === playerId)?.team;
      const lockerTeam = data.playerId
        ? gameStateRef.current?.players.find(p => p.playerId === data.playerId)?.team
        : undefined;
      const outcome = myTeam && lockerTeam
        ? (lockerTeam === myTeam ? 'win' : 'lose')
        : undefined;

      addLog('Soft lock — 2pts awarded', 'score', undefined, undefined, outcome);
    });

    s.on('roundStarted', (data: any) => {
      if (data.roundNumber > 1) {
        clearRoundLog();
      }

      setGameState(prev => prev ? {
        ...prev, board: [], leftEnd: null, rightEnd: null,
        roundNumber: data.roundNumber, currentTurn: data.currentTurn,
      } : prev);
      setTimeLeft(data.timeLimit);

      const roundStartKey = `${data.roundNumber}:${data.currentTurn}`;
      const roundStartText = `— Round ${data.roundNumber} started —`;
      const alreadyLogged = logEntriesRef.current.some(
        (entry) => entry.type === 'system' && entry.text === roundStartText
      );

      if (lastRoundStartLogKeyRef.current !== roundStartKey && !alreadyLogged) {
        lastRoundStartLogKeyRef.current = roundStartKey;
        addLog(roundStartText, 'system');
      }
    });

    s.on('roundEnded', (data: ScorePayload & { tally: number; points: number; winningTeam: number | null }) => {
      setGameState(prev => prev ? {
        ...prev,
        scores: data.scores,
        players: prev.players.map((p) => ({
          ...p,
          points: data.playerScores?.[p.playerId] ?? p.points,
        })),
      } : prev);

      const myTeam = gameStateRef.current?.players.find(p => p.playerId === playerId)?.team;
      const outcome = myTeam && data.winningTeam
        ? (data.winningTeam === myTeam ? 'win' : 'lose')
        : undefined;

      addLog(`Round ended — tally ${data.tally} = ${data.points}pts to Team ${data.winningTeam}`, 'score', undefined, undefined, outcome);
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
  }, [addLog, clearRoundLog, code, navigate, playerId, username]);

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
    if (fitsLeft && fitsRight && leftEnd !== rightEnd) { setSidePrompt(dominoIndex); return; }
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
  const currentRound = gameState?.roundNumber ?? 1;
  const displayUsername = (username?.trim() || 'Guest').slice(0, 20);
  const timerPct = timeLeft !== null ? (timeLeft / 30) * 100 : 100;
  const timerColor = timerPct < 20 ? '#e05555' : timerPct < 50 ? '#f4a042' : '#4caf50';
  const formatBoot = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!gameState) return (
    <div className="wood-grain game-loading-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'KomikaTitle, sans-serif', fontSize: 24, letterSpacing: '0.15em', color: 'rgba(200,184,122,0.5)' }}>
        CONNECTING TO GAME…
      </span>
    </div>
  );

  return (
    <div className="wood-grain game-page-root" style={{
      width: '100vw', height: '100vh',
      fontFamily: 'KomikaTitle, sans-serif', color: '#f4e8c1',
      display: 'grid', gridTemplateColumns: '1fr 230px', gridTemplateRows: '38px 1fr',
      overflow: 'hidden',
    }}>
      <div className="game-bg-dominoes-layer" aria-hidden="true">
        <BGDominoes />
      </div>

      {/* HEADER */}
      <div className="game-header" style={{
        gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 3,
      }}>
        <div className="game-title" style={{ display: 'flex', alignItems: 'center' }}>
          <Logo fontSize={24} />
        </div>
        <div className="game-team-scores" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[1, 2].map(t => (
            <div key={t} className="game-team-chip" style={{
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
          <span className="game-user-chip" style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            padding: '2px 8px',
            borderRadius: 999,
            color: '#f4e8c1',
            textTransform: 'uppercase',
          }}>
            {displayUsername}
          </span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 5px #4caf50' }} />
          <span style={{ fontSize: 10, color: 'rgba(200,184,122,0.3)', letterSpacing: '0.12em' }}>
            GAME #{code} · RND {currentRound}
          </span>
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="game-table-column" style={{ position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* felt */}
        <div className="game-felt" style={{
          flex: 1, position: 'relative', overflow: 'hidden',
        }}>
          {/* grid texture */}
          <div className="game-felt-texture" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
          }} />

          {/* border frame */}
          <div className="game-felt-frame" style={{
            position: 'absolute', inset: 8,
            borderRadius: 8, pointerEvents: 'none', zIndex: 2,
          }}>
            {[
              { top: -1, left: -1, borderWidth: '2px 0 0 2px' },
              { top: -1, right: -1, borderWidth: '2px 2px 0 0' },
              { bottom: -1, left: -1, borderWidth: '0 0 2px 2px' },
              { bottom: -1, right: -1, borderWidth: '0 2px 2px 0' },
            ].map((s, i) => (
              <div key={i} className="game-felt-corner" style={{
                position: 'absolute', width: 12, height: 12,
                borderStyle: 'solid', ...s,
              }} />
            ))}
          </div>


          {/* seats */}
          {seats.top && (
            <div className="game-seat game-seat-top" style={{ zIndex: 3 }}>
              <SeatCard player={seats.top} isActive={gameState.currentTurn === seats.top.playerId} />
            </div>
          )}
          {seats.left && (
            <div className="game-seat game-seat-left" style={{ zIndex: 3 }}>
              <SeatCard player={seats.left} isActive={gameState.currentTurn === seats.left.playerId} />
            </div>
          )}
          {seats.right && (
            <div className="game-seat game-seat-right" style={{ zIndex: 3 }}>
              <SeatCard player={seats.right} isActive={gameState.currentTurn === seats.right.playerId} />
            </div>
          )}

          {/* board chain */}
          <div className="game-board-zone" style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '60px 110px',
          }}>
            <DominoBoard board={gameState.board} />
          </div>
        </div>

        {/* timer bar */}
        <div className="game-timer-track" style={{ height: 3, position: 'relative', zIndex: 4 }}>
          <div className="game-timer-fill" style={{
            height: '100%', width: `${timerPct}%`,
            background: `linear-gradient(90deg,${timerColor},${timerPct < 20 ? '#f47a42' : timerPct < 50 ? '#f4c042' : '#f4b942'})`,
            transition: 'width 1s linear, background 0.35s ease',
          }} />
        </div>

        {/* hand tray */}
        <div className="game-hand-tray" style={{
          padding: '8px 14px 10px',
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
          <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'flex-end' }}>
            {gameState.hand?.map((domino, i) => {
              const isValid = validIndices.includes(i);
              return (
                <div key={i} style={{ opacity: isMyTurn && !isValid ? 0.22 : 1, transition: 'opacity 0.2s' }}>
                  <DominoTile
                    left={domino.left} right={domino.right}
                    size={PLAYER_HAND_TILE_SIZE} valid={isValid}
                    onClick={isValid ? () => handlePlaceDomino(i) : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="game-right-panel" style={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1,
      }}>
        <div className="game-right-panel-meta" style={{
          display: 'flex', justifyContent: 'space-between', padding: '5px 12px',
          fontSize: 9, letterSpacing: '0.12em', color: 'rgba(200,184,122,0.28)',
        }}>
          <span>ROUND <span style={{ color: 'rgba(244,184,66,0.48)', fontSize: 10 }}>{currentRound}</span></span>
          <span>FIRST TO <span style={{ color: 'rgba(244,184,66,0.48)', fontSize: 10 }}>20</span></span>
        </div>

        <div className="game-right-panel-scores" style={{ padding: '9px 12px' }}>
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
                  fontFamily: 'KomikaTitle, sans-serif', fontSize: 9,
                  color: PLAYER_NAME_COLOR, letterSpacing: '0.06em', padding: '1px 0',
                  textShadow: '0 0 5px rgba(255,201,74,0.22)',
                }}>
                  <span>{p.username.toUpperCase()}</span>
                  <span style={{ fontFamily: 'KomikaTitle, sans-serif', fontSize: 10, color: 'rgba(244,184,66,0.4)' }}>{p.points}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="game-log-title" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,184,122,0.28)', padding: '7px 12px 5px' }}>
          ROUND LOG
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

      {/* SIDE PROMPT */}
      {sidePrompt !== null && (
        <div className="game-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="game-dialog-card" style={{
            borderRadius: 6, padding: '24px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(200,184,122,0.3)', marginBottom: 8 }}>WHICH END?</div>
            <div style={{ fontFamily: 'KomikaTitle, sans-serif', fontSize: 22, color: '#f4e8c1', marginBottom: 18 }}>
              {gameState.hand[sidePrompt]?.left}|{gameState.hand[sidePrompt]?.right}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {([
                { side: 'left' as const, color: '#88c0f0', border: 'rgba(74,144,217,0.3)', label: `← LEFT (${gameState.leftEnd})` },
                { side: 'right' as const, color: '#f0956a', border: 'rgba(217,112,74,0.3)', label: `RIGHT (${gameState.rightEnd}) →` },
              ]).map(({ side, color, border, label }) => (
                <div key={side}
                     className="game-dialog-action"
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
        <div className="game-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.87)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div className="game-dialog-card" style={{
            borderRadius: 6, padding: '24px 32px', textAlign: 'center', width: 300,
          }}>
            <div style={{ fontSize: 28, color: '#f4b942', letterSpacing: '0.1em', marginBottom: 2 }}>
              TEAM {gameOver.winner} WINS!
            </div>
            <div style={{ fontFamily: 'KomikaTitle, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(200,184,122,0.28)', textTransform: 'uppercase', marginBottom: 18 }}>
              Final Score · Round {currentRound}
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
                    <div key={p.playerId} style={{
                      fontFamily: 'KomikaTitle, sans-serif',
                      fontSize: 9,
                      color: PLAYER_NAME_COLOR,
                      textShadow: '0 0 5px rgba(255,201,74,0.22)',
                    }}>
                      {p.username}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'KomikaTitle, sans-serif', fontSize: 9, color: 'rgba(200,184,122,0.22)', marginBottom: 12 }}>
              Returning to lobby in {formatBoot(bootTimer)}
            </div>
            <div className="game-dialog-leave-btn" onClick={() => navigate('/lobby')} style={{
              display: 'inline-block', padding: '7px 20px', borderRadius: 3,
              fontSize: 13, letterSpacing: '0.12em', cursor: 'pointer',
            }}>
              LEAVE GAME
            </div>
          </div>
        </div>
      )}
    </div>
  );
}