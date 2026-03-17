import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import './Game.css';
import {GameState, DominoPlacedPayload, ScorePayload, LogEntry, RoundEndedPayload} from "../../../types/Game.ts";
import { getValidIndices, getSeatedPlayers, getTimerPct, getTimerColor } from './gameUtils.ts';
import BGDominoes from '../../animations/BGDominoes/BGDominoes.tsx';
import SidePrompt from '../../gameui/SidePrompt/SidePrompt.tsx';
import PostGamePrompt from '../../gameui/PostGamePrompt/PostGamePrompt.tsx';
import TimerBar from '../../gameui/TimerBar/TimerBar.tsx';
import HandCard from '../../gameui/HandCard/HandCard.tsx';
import LoadingScreen from "../../gameui/LoadingScreen/LoadingScreen.tsx";
import GameHeader from '../../gameui/GameHeader/GameHeader.tsx';
import Scoreboard from '../../gameui/Scoreboard/Scoreboard.tsx';
import RoundLog from '../../gameui/RoundLog/RoundLog.tsx';
import Playmat from '../../gameui/Playmat/Playmat.tsx';
import CornerCard from '../../ui/CornerCard/CornerCard.tsx';
import useRoundLog from './useRoundLog.ts';

const API_URL = import.meta.env.VITE_API_URL;
const ROUND_END_POPUP_FALLBACK_SEC = 15;

function getTeamLabel(team: number | null | undefined) {
  if (team === 1) return 'Blue Team';
  if (team === 2) return 'Red Team';
  return 'Unknown Team';
}

function getTeamLabelLower(team: number | null | undefined) {
  return getTeamLabel(team).toLowerCase();
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
  const [gameOver, setGameOver] = useState<{ winner: number; scores: { 1: number; 2: number } } | null>(null);
  const [bootTimer, setBootTimer] = useState(180);
  const [roundEndPrompt, setRoundEndPrompt] = useState<{
    winningTeam: number | null;
    points: number;
    scores: { 1: number; 2: number };
    endAtMs: number;
  } | null>(null);
  const [roundEndSecondsLeft, setRoundEndSecondsLeft] = useState(0);
  const [knockedPlayerId, setKnockedPlayerId] = useState<string | null>(null);
  const [knockShakeToken, setKnockShakeToken] = useState(0);
  const gameStateRef = useRef<GameState | null>(null);
  const {log, addLog, clearRoundLog, logEntriesRef, lastDominoLogKeyRef, lastRoundStartLogKeyRef} = useRoundLog(logStorageKey);
  const isMyTurn = gameState?.currentTurn === playerId;

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (sidePrompt === null) return;
    if (!isMyTurn || (timeLeft !== null && timeLeft <= 0)) {
      setSidePrompt(null);
    }
  }, [isMyTurn, sidePrompt, timeLeft]);

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
    if (!roundEndPrompt) return;

    const tick = () => {
      const seconds = Math.max(0, Math.ceil((roundEndPrompt.endAtMs - Date.now()) / 1000));
      setRoundEndSecondsLeft(seconds);
      if (seconds <= 0) {
        setRoundEndPrompt(null);
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [roundEndPrompt]);

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
      if (data.currentTurn !== playerId) setSidePrompt(null);
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
      if (data.currentTurn !== playerId) setSidePrompt(null);
    });

    s.on('playerKnocked', (data: ScorePayload & { playerId: string; username: string; points: number; isFreeKnock?: boolean; awardedTeam?: number | null }) => {
      setKnockedPlayerId(data.playerId);
      setKnockShakeToken((prev) => prev + 1);

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
      const awardedTeam = data.awardedTeam ?? (knockerTeam === 1 ? 2 : knockerTeam === 2 ? 1 : null);
      const outcome = myTeam && knockerTeam
        ? (knockerTeam === myTeam ? 'lose' : 'win')
        : undefined;

      addLog(
        data.isFreeKnock
          ? `${data.username} knocked — free knock (no points)`
          : `${data.username} knocked — ${data.points}pt to ${awardedTeam ? getTeamLabelLower(awardedTeam) : 'opposing team'}`,
        'knock',
        data.username,
        undefined,
        outcome,
        data.isFreeKnock
      );
    });


    s.on('roundStarted', (data: any) => {
      setRoundEndPrompt(null);

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

    s.on('roundEnded', (data: RoundEndedPayload) => {
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

      addLog(`Round ended — tally ${data.tally} = ${data.points}pts to ${data.winningTeam ? getTeamLabel(data.winningTeam) : 'no team'}`, 'score', undefined, undefined, outcome);
      const leadingTeam = data.scores[1] >= data.scores[2] ? 1 : 2;
      addLog(`${data.scores[1]}-${data.scores[2]} ${getTeamLabel(leadingTeam)}`, 'score', undefined, undefined, outcome);

      const roundDelaySec = data.nextRoundInSec ?? ROUND_END_POPUP_FALLBACK_SEC;
      setRoundEndPrompt({
        winningTeam: data.winningTeam,
        points: data.points,
        scores: data.scores,
        endAtMs: Date.now() + (roundDelaySec * 1000),
      });

      // Reuse the main timer bar during round intermission.
      setTimeLeft(roundDelaySec);
    });

    s.on('gameOver', (data: any) => {
      setRoundEndPrompt(null);
      setGameOver({ winner: data.winner, scores: data.scores });
      setTimeLeft(null);
      addLog(`Game over — ${getTeamLabel(data.winner)} wins!`, 'score');
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

      {/* header */}
      <GameHeader gameState={gameState} code={code ?? 'unknown'} displayUsername={displayUsername}/>

      {/* table area */}
      <div className="game-table-column" style={{ position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/*play board (domino board + player seat cards*/}
        <Playmat gameState={gameState} seats={seats} knockedPlayerId={knockedPlayerId} knockShakeToken={knockShakeToken} />

        {/*turn timer bar (30s)*/}
        <TimerBar timerColor={timerColor} timerPct={timerPct} remainingSeconds={timeLeft} />

        {/* your hand tray */}
        <HandCard seats={seats} gameState={gameState} isMyTurn={isMyTurn} handlePlaceDomino={handlePlaceDomino} validIndices={validIndices} />
      </div>

      {/* right side panel */}
      <div className="game-right-panel"
           style={{
             display: 'flex',
             flexDirection: 'column',
             overflow: 'hidden',
             zIndex: 1,
           }}
      >
        <Scoreboard gameState={gameState} currentRound={currentRound} />
        <RoundLog log={log} />
      </div>

      {/*conditional prompts*/}
      {code && (<SidePrompt sidePrompt={sidePrompt} setSidePrompt={setSidePrompt} gameState={gameState} code={code} socket={socket} />)}
      {roundEndPrompt && !gameOver && (
        <div className="game-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55 }}>
          <CornerCard style={{ borderRadius: 6, padding: '24px 24px 18px', textAlign: 'center', width: 360 }} cornerSize={14}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(235,218,165,0.72)', marginBottom: 6 }}>ROUND ENDED</div>
            <div style={{ fontSize: 22, color: roundEndPrompt.winningTeam === 1 ? '#88c0f0' : roundEndPrompt.winningTeam === 2 ? '#f0956a' : '#f4e8c1', marginBottom: 8 }}>
              {roundEndPrompt.winningTeam ? `${getTeamLabel(roundEndPrompt.winningTeam).toUpperCase()} WON ${roundEndPrompt.points} PTS` : 'ROUND COMPLETE'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {[1, 2].map((team) => (
                <div key={team} style={{ borderRadius: 4, padding: '10px', border: `1px solid ${team === 1 ? 'rgba(74,144,217,0.28)' : 'rgba(217,112,74,0.28)'}`, background: team === 1 ? 'rgba(74,144,217,0.05)' : 'rgba(217,112,74,0.05)' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', color: team === 1 ? '#88c0f0' : '#f0956a' }}>{getTeamLabel(team).toUpperCase()}</div>
                  <div style={{ fontSize: 24, color: team === 1 ? '#88c0f0' : '#f0956a' }}>{roundEndPrompt.scores[team as 1 | 2]}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(235,218,165,0.8)', marginBottom: 12 }}>
              Next round begins in {roundEndSecondsLeft}s
            </div>

            <div style={{
              marginBottom: 12,
              border: '1px solid rgba(180,140,60,0.2)',
              borderRadius: 4,
              background: 'rgba(12,7,3,0.44)',
              maxHeight: 170,
              overflow: 'hidden',
            }}>
              <RoundLog log={log} />
            </div>

            <div className="game-dialog-leave-btn" onClick={() => setRoundEndPrompt(null)} style={{ display: 'inline-block', padding: '7px 20px', borderRadius: 3, fontSize: 13, letterSpacing: '0.12em', cursor: 'pointer' }}>
              CONTINUE TO NEXT ROUND
            </div>
          </CornerCard>
        </div>
      )}
      {gameOver && (<PostGamePrompt gameOver={gameOver} gameState={gameState} bootTimer={bootTimer} onLeave={() => navigate('/lobby')} log={log} />)}
    </div>
  );
}