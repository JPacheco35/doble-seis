// Main game page component. Handles socket connection, game state management, and renders the main game UI and subcomponents.

import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Box } from '@mantine/core';
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
const ROUND_END_POPUP_FALLBACK_SEC = 15; // how many seconds of intermission between rounds

// convert team number to name
function getTeamLabel(team: number | null | undefined) {
  if (team === 1) return 'Blue Team';
  if (team === 2) return 'Red Team';
  return 'Unknown Team';
}

export default function Game() {
  // user identification
  const playerId = localStorage.getItem('playerId');
  const username = localStorage.getItem('username');

  const { code } = useParams();
  const navigate = useNavigate();

  // key for retrieving logs from app storage
  const logStorageKey = `game-log:v1:${code ?? 'unknown'}:${playerId ?? 'anon'}`;

  // socket connection
  const [socket, setSocket] = useState<Socket | null>(null);

  // track whether the game is over
  const [gameOver, setGameOver] = useState<{
    winner: number;
    scores: { 1: number; 2: number };
  } | null>(null);

  // timers for turn and post game screen
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [bootTimer, setBootTimer] = useState(180);

  // popup prompt states
  const [sidePrompt, setSidePrompt] = useState<number | null>(null);
  const [roundEndPrompt, setRoundEndPrompt] = useState<{
    winningTeam: number | null;
    points: number;
    scores: { 1: number; 2: number };
    endAtMs: number;
  } | null>(null);

  // current game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameStateRef = useRef<GameState | null>(null);

  // turn state & timer
  const isMyTurn = gameState?.currentTurn === playerId;
  const [roundEndSecondsLeft, setRoundEndSecondsLeft] = useState(0);

  // knocking state
  const [knockedPlayerId, setKnockedPlayerId] = useState<string | null>(null);
  const [knockShakeToken, setKnockShakeToken] = useState(0);

  // logging functions
  const {
    log,
    addLog,
    clearRoundLog,
    logEntriesRef,
    lastDominoLogKeyRef,
    lastRoundStartLogKeyRef,
  } = useRoundLog(logStorageKey);

  // gamestate update use effect
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // side selection prompt goes away when time runs out and its no longer your turn
  useEffect(() => {
    if (sidePrompt === null) return;
    if (!isMyTurn || (timeLeft !== null && timeLeft <= 0)) {
      setSidePrompt(null);
    }
  }, [isMyTurn, sidePrompt, timeLeft]);

  // update timer every second -- countdown from 30
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((prev) => (prev ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  // on game over, redirect to lobby after 3 minutes or button select
  useEffect(() => {
    if (!gameOver) return;
    if (bootTimer <= 0) {
      navigate('/lobby');
      return;
    }
    const t = setTimeout(() => setBootTimer((b) => b - 1), 1000);
    return () => clearTimeout(t);
  }, [gameOver, bootTimer]);

  // round end prompt countdown -- 15 seconds
  useEffect(() => {
    if (!roundEndPrompt) return;

    const tick = () => {
      const seconds = Math.max(
        0,
        Math.ceil((roundEndPrompt.endAtMs - Date.now()) / 1000),
      );
      setRoundEndSecondsLeft(seconds);
      if (seconds <= 0) {
        setRoundEndPrompt(null);
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [roundEndPrompt]);

  // game server socket routes
  useEffect(() => {

    // connect to game server
    const s = io(`${API_URL}/game`, { auth: { playerId, username } });

    // connection
    s.on('connect', () => s.emit('joinGame', code));

    // get current game state
    s.on('gameState', (data: GameState) => {
      setGameState((prev) => ({
        ...data,
        roundNumber: data.roundNumber ?? prev?.roundNumber ?? 1,
        players: (data.players || []).map((p) => ({
          ...p,
          points:
            p.points ??
            prev?.players.find((old) => old.playerId === p.playerId)?.points ??
            0,
        })),
      }));
    });

    // start new timer when turn changes
    s.on('timerStarted', (data: { currentTurn: string; duration: number }) => {
      setGameState((prev) =>
        prev ? { ...prev, currentTurn: data.currentTurn } : prev,
      );
      setTimeLeft(data.duration);
      if (data.currentTurn !== playerId) setSidePrompt(null);
    });

    // place a domino on the baord
    s.on('dominoPlaced', (data: DominoPlacedPayload) => {
      const inferredLast = data.board?.[data.board.length - 1];
      const placed = data.placedDomino ?? inferredLast;
      const eventKey = [
        typeof data.moveNumber === 'number'
          ? `m${data.moveNumber}`
          : data.playerId,
        `${placed?.left ?? 'x'}-${placed?.right ?? 'x'}`,
        data.side ?? 'x',
      ].join(':');

      if (lastDominoLogKeyRef.current === eventKey) return;
      lastDominoLogKeyRef.current = eventKey;

      // get info of placement (player, domino, side, auto-played or not) for logging
      const placerName =
        gameStateRef.current?.players.find((p) => p.playerId === data.playerId)
          ?.username ?? data.playerId;
      const type: LogEntry['type'] = data.autoPlayed ? 'auto' : 'play';
      const tileLabel = placed ? `${placed.left}-${placed.right}` : '?-?';
      const text = data.autoPlayed
        ? `${placerName} played ${tileLabel} (timeout)`
        : `${placerName} played ${tileLabel}`;

      // add to the round log
      addLog(text, type, placerName, placed);

      // update the game state
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              board: data.board,
              leftEnd: data.leftEnd,
              rightEnd: data.rightEnd,
            }
          : prev,
      );
    });


    // update user hand after a placement
    s.on('handUpdated', (data: any) => {
      setGameState((prev) => (prev ? { ...prev, hand: data.hand } : prev));
    });

    // update hand size for other players to see
    s.on('handSizesUpdated', (data: any) => {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              players: prev.players.map((p) => ({
                ...p,
                handSize: data.handSizes[p.playerId] ?? p.handSize,
              })),
            }
          : prev,
      );
    });

    // change whose turn it is in game state
    s.on('turnChanged', (data: any) => {
      setGameState((prev) =>
        prev ? { ...prev, currentTurn: data.currentTurn } : prev,
      );
      if (data.currentTurn !== playerId) setSidePrompt(null);
    });

    // player knocked on thier turn
    s.on(
      'playerKnocked',
      (
        data: ScorePayload & {
          playerId: string;
          username: string;
          points: number;
          isFreeKnock?: boolean;
          awardedTeam?: number | null;
        },
      ) => {
        // for player seat card shaking animation in SeatCard.tsx
        setKnockedPlayerId(data.playerId);
        setKnockShakeToken((prev) => prev + 1);

        // update game state
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                scores: data.scores,
                players: prev.players.map((p) => ({
                  ...p,
                  points: data.playerScores?.[p.playerId] ?? p.points,
                })),
              }
            : prev,
        );

        // which team knocked, which team gets the points (used for log formatting)
        const myTeam = gameStateRef.current?.players.find((p) => p.playerId === playerId,)?.team;
        const knockerTeam = gameStateRef.current?.players.find((p) => p.playerId === data.playerId,)?.team;
        const awardedTeam = data.awardedTeam ?? (knockerTeam === 1 ? 2 : knockerTeam === 2 ? 1 : null);
        const outcome =
          myTeam && knockerTeam
            ? knockerTeam === myTeam
              ? 'lose'
              : 'win'
            : undefined;

        // add to the round log
        addLog(
          data.isFreeKnock
            ? `${data.username} knocked — free knock (no points)`
            : `${data.username} knocked — ${data.points}pt to ${awardedTeam ? getTeamLabel(awardedTeam) : 'opposing team'}`,
          'knock',
          data.username,
          undefined,
          outcome,
          data.isFreeKnock,
        );
      },
    );

    // on round start
    s.on('roundStarted', (data: any) => {
      setRoundEndPrompt(null);

      // clear the previous round's log (except on game start)
      if (data.roundNumber > 1) { clearRoundLog(); }

      // update game state
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              board: [],
              leftEnd: null,
              rightEnd: null,
              roundNumber: data.roundNumber,
              currentTurn: data.currentTurn,
            }
          : prev,
      );
      setTimeLeft(data.timeLimit);

      // update the round log
      const roundStartKey = `${data.roundNumber}:${data.currentTurn}`;
      const roundStartText = `— Round ${data.roundNumber} started —`;
      const alreadyLogged = logEntriesRef.current.some((entry) => entry.type === 'system' && entry.text === roundStartText);
      if (lastRoundStartLogKeyRef.current !== roundStartKey && !alreadyLogged) {
        lastRoundStartLogKeyRef.current = roundStartKey;
        addLog(roundStartText, 'system');
      }
    });

    // on round completion
    s.on('roundEnded', (data: RoundEndedPayload) => {

      // update the game state
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              scores: data.scores,
              players: prev.players.map((p) => ({
                ...p,
                points: data.playerScores?.[p.playerId] ?? p.points,
              })),
            }
          : prev,
      );

      // used for round log formatting of round result
      const myTeam = gameStateRef.current?.players.find(
        (p) => p.playerId === playerId,
      )?.team;
      const outcome =
        myTeam && data.winningTeam
          ? data.winningTeam === myTeam
            ? 'win'
            : 'lose'
          : undefined;

      // update round log with end result
      addLog(
        `Round ended — tally ${data.tally} = ${data.points}pts to ${data.winningTeam ? getTeamLabel(data.winningTeam) : 'no team'}`,
        'score',
        undefined,
        undefined,
        outcome,
      );

      // update round log with current score
      const leadingTeam = data.scores[1] >= data.scores[2] ? 1 : 2;
      addLog(
        `${data.scores[1]}-${data.scores[2]} ${getTeamLabel(leadingTeam)}`,
        'score',
        undefined,
        undefined,
        outcome,
      );

      // start the intermission timer -- 15 seconds
      const roundDelaySec = data.nextRoundInSec ?? ROUND_END_POPUP_FALLBACK_SEC;
      setRoundEndPrompt({
        winningTeam: data.winningTeam,
        points: data.points,
        scores: data.scores,
        endAtMs: Date.now() + roundDelaySec * 1000,
      });

      // Reuse the main timer bar during round intermission.
      setTimeLeft(roundDelaySec);
    });

    // on game over (a team reached 20 points)
    s.on('gameOver', (data: any) => {
      // no round over prompt --> game over prompt instead
      setRoundEndPrompt(null);
      setGameOver({ winner: data.winner, scores: data.scores });
      setTimeLeft(null);

      // add to rounf log
      addLog(`Game over — ${getTeamLabel(data.winner)} wins!`, 'score');
    });

    // on some error with the game server, redirect to lobby
    s.on('gameError', () => navigate('/lobby'));

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [addLog, clearRoundLog, code, navigate, playerId, username]);

  // which dominoes are valid to play on player's turn
  const validIndices = isMyTurn ? getValidIndices(gameState) : [];

  // removes a domino from the player's hand and places it on the board
  const handlePlaceDomino = (dominoIndex: number) => {

    // only valid if it is user's turn AND they have at least 1 valid domino to play
    if (!isMyTurn || !validIndices.includes(dominoIndex)) return;

    // get the selected domino data
    const domino = gameState!.hand[dominoIndex];
    const { leftEnd, rightEnd, board } = gameState!;

    // special case: player starts round, side doesnt matter so default to right side
    if (board.length === 0) {
      socket?.emit('placeDomino', { code, dominoIndex, side: 'right' });
      return;
    }

    // which sides can the domino be played on?
    const fitsLeft = domino.left === leftEnd || domino.right === leftEnd;
    const fitsRight = domino.left === rightEnd || domino.right === rightEnd;

    // if domino can be played on both sides, prompt user to choose
    if (fitsLeft && fitsRight && leftEnd !== rightEnd) {
      setSidePrompt(dominoIndex);
      return;
    }

    // emit to server and update game state
    socket?.emit('placeDomino', {
      code,
      dominoIndex,
      side: fitsLeft ? 'left' : 'right',
    });
  };

  // get seated player positions for SeatCard component
  const seats = getSeatedPlayers(gameState, playerId);
  const currentRound = gameState?.roundNumber ?? 1;

  // username
  const displayUsername = (username?.trim() || 'Guest').slice(0, 20);

  // timer bar state variables
  const timerPct = getTimerPct(timeLeft);
  const timerColor = getTimerColor(timerPct);

  // if not connected to a game, or game hasnt started yet
  if (!gameState) return <LoadingScreen />;

  return (
    <Box
      component="div"
      className="wood-grain game-page-root"
      style={{
        width: '100vw',
        height: '100vh',
        fontFamily: 'KomikaTitle, sans-serif',
        color: '#f4e8c1',
        display: 'grid',
        gridTemplateColumns: '1fr 230px',
        gridTemplateRows: '38px 1fr',
        overflow: 'hidden',
      }}
    >
      {/*dominoes background*/}
      <Box
        component="div"
        className="game-bg-dominoes-layer"
        aria-hidden="true"
      >
        <BGDominoes />
      </Box>

      {/* header */}
      <GameHeader
        gameState={gameState}
        code={code ?? 'unknown'}
        displayUsername={displayUsername}
      />

      {/* table area */}
      <Box
        component="div"
        className="game-table-column"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/*play board (domino board + player seat cards*/}
        <Playmat
          gameState={gameState}
          seats={seats}
          knockedPlayerId={knockedPlayerId}
          knockShakeToken={knockShakeToken}
        />

        {/*turn timer bar (30s)*/}
        <TimerBar
          timerColor={timerColor}
          timerPct={timerPct}
          remainingSeconds={timeLeft}
        />

        {/* your hand tray */}
        <HandCard
          seats={seats}
          gameState={gameState}
          isMyTurn={isMyTurn}
          handlePlaceDomino={handlePlaceDomino}
          validIndices={validIndices}
        />
      </Box>

      {/* right side panel */}
      <Box
        component="div"
        className="game-right-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <Scoreboard gameState={gameState} currentRound={currentRound} />
        <RoundLog log={log} />
      </Box>

      {/*conditional prompts*/}

      {/*select side prompt*/}
      {code && (
        <SidePrompt
          sidePrompt={sidePrompt}
          setSidePrompt={setSidePrompt}
          gameState={gameState}
          code={code}
          socket={socket}
        />
      )}

      {/*round over prompt*/}
      {roundEndPrompt && !gameOver && (
        <Box
          component="div"
          className="game-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 55,
          }}
        >
          <CornerCard
            style={{
              borderRadius: 6,
              padding: '24px 24px 18px',
              textAlign: 'center',
              width: 360,
            }}
            cornerSize={14}
          >
            <Box
              component="div"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'rgba(235,218,165,0.72)',
                marginBottom: 6,
              }}
            >
              ROUND ENDED
            </Box>
            <Box
              component="div"
              style={{
                fontSize: 22,
                color:
                  roundEndPrompt.winningTeam === 1
                    ? '#88c0f0'
                    : roundEndPrompt.winningTeam === 2
                      ? '#f0956a'
                      : '#f4e8c1',
                marginBottom: 8,
              }}
            >
              {roundEndPrompt.winningTeam
                ? `${getTeamLabel(roundEndPrompt.winningTeam).toUpperCase()} WON ${roundEndPrompt.points} PTS`
                : 'ROUND COMPLETE'}
            </Box>
            <Box
              component="div"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 10,
              }}
            >
              {[1, 2].map((team) => (
                <Box
                  component="div"
                  key={team}
                  style={{
                    borderRadius: 4,
                    padding: '10px',
                    border: `1px solid ${team === 1 ? 'rgba(74,144,217,0.28)' : 'rgba(217,112,74,0.28)'}`,
                    background:
                      team === 1
                        ? 'rgba(74,144,217,0.05)'
                        : 'rgba(217,112,74,0.05)',
                  }}
                >
                  <Box
                    component="div"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      color: team === 1 ? '#88c0f0' : '#f0956a',
                    }}
                  >
                    {getTeamLabel(team).toUpperCase()}
                  </Box>
                  <Box
                    component="div"
                    style={{
                      fontSize: 24,
                      color: team === 1 ? '#88c0f0' : '#f0956a',
                    }}
                  >
                    {roundEndPrompt.scores[team as 1 | 2]}
                  </Box>
                </Box>
              ))}
            </Box>

            <Box
              component="div"
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                color: 'rgba(235,218,165,0.8)',
                marginBottom: 12,
              }}
            >
              Next round begins in {roundEndSecondsLeft}s
            </Box>

            <Box
              component="div"
              style={{
                marginBottom: 12,
                border: '1px solid rgba(180,140,60,0.2)',
                borderRadius: 4,
                background: 'rgba(12,7,3,0.44)',
                maxHeight: 170,
                overflow: 'hidden',
              }}
            >
              <RoundLog log={log} />
            </Box>

            <Box
              component="div"
              className="game-dialog-leave-btn"
              onClick={() => setRoundEndPrompt(null)}
              style={{
                display: 'inline-block',
                padding: '7px 20px',
                borderRadius: 3,
                fontSize: 13,
                letterSpacing: '0.12em',
                cursor: 'pointer',
              }}
            >
              CONTINUE TO NEXT ROUND
            </Box>
          </CornerCard>
        </Box>
      )}

      {/*game over prompt*/}
      {gameOver && (
        <PostGamePrompt
          gameOver={gameOver}
          gameState={gameState}
          bootTimer={bootTimer}
          onLeave={() => navigate('/lobby')}
          log={log}
        />
      )}
    </Box>
  );
}