import React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import BGDominoes from '../../animations/BGDominoes/BGDominoes.tsx';
import './Game.css';
import dominoSrc from "../../../functions/dominoSrc.ts";
import {GameState, DominoPlacedPayload, Domino, ScorePayload, LogEntry } from "../../../types/Game.ts";
import { getValidIndices, getSeatedPlayers, getTimerPct, getTimerColor } from './gameUtils.ts';
import SidePrompt from "../../gameui/SidePrompt/SidePrompt.tsx";
import PostGamePrompt from "../../gameui/PostGamePrompt/PostGamePrompt.tsx";
import Seats from "../../gameui/Seats/Seats.tsx";
import TimerBar from "../../gameui/TimerBar/TimerBar.tsx";
import HandCard from "../../gameui/HandCard/HandCard.tsx";
import DominoBoard from '../../gameui/DominoBoard/DominoBoard.tsx';
import LoadingScreen from "../../gameui/LoadingScreen/LoadingScreen.tsx";
import GameHeader from "../../gameui/GameHeader/GameHeader.tsx";

const API_URL = import.meta.env.VITE_API_URL;

// Hand sizing knobs: tweak these to scale all player/opponent hand tiles.
const PLAYER_NAME_COLOR = '#ffc94a';

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

  const validIndices = isMyTurn ? getValidIndices(gameState) : [];

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

  const seats = getSeatedPlayers(gameState, playerId);
  const currentRound = gameState?.roundNumber ?? 1;
  const displayUsername = (username?.trim() || 'Guest').slice(0, 20);
  const timerPct = getTimerPct(timeLeft);
  const timerColor = getTimerColor(timerPct);

  // if not connected to a game, or game hasnt started yet
  if (!gameState)
    return (<LoadingScreen/>);

  return (
    <div className="wood-grain game-page-root" style={{
      width: '100vw',
      height: '100vh',
      fontFamily: 'KomikaTitle, sans-serif',
      color: '#f4e8c1',
      display: 'grid',
      gridTemplateColumns: '1fr 230px',
      gridTemplateRows: '38px 1fr',
      overflow: 'hidden',
    }}>

      {/*dominoes background*/}
      <div className="game-bg-dominoes-layer" aria-hidden="true">
        <BGDominoes />
      </div>

      {/* HEADER */}
      <GameHeader gameState={gameState} code={code ?? 'unknown'} displayUsername={displayUsername} currentRound={currentRound} />

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

          {/* board */}
          <div className="game-board-zone" style={{
            position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%, -50%)',
            width: 'min(94%, 680px)', zIndex: 3, pointerEvents: 'none',
          }}>
            <DominoBoard board={gameState.board} />
          </div>

          {/*other players seats*/}
          <Seats seats={seats} gameState={gameState} />
        </div>

        {/*turn timer bar (30s)*/}
        <TimerBar timerColor={timerColor} timerPct={timerPct} />

        {/* your hand tray */}
        <HandCard seats={seats} gameState={gameState} isMyTurn={isMyTurn} handlePlaceDomino={handlePlaceDomino} validIndices={validIndices} />
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

      {/*conditional prompts*/}
      {code && (<SidePrompt sidePrompt={sidePrompt} setSidePrompt={setSidePrompt} gameState={gameState} code={code} socket={socket} />)}
      {gameOver && (<PostGamePrompt gameOver={gameOver} gameState={gameState} bootTimer={bootTimer} onLeave={() => navigate('/lobby')} />)}
    </div>
  );
}