import React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Text, Stack, Badge, Group } from '@mantine/core';

const API_URL = import.meta.env.VITE_API_URL;

interface Player {
  playerId: string;
  username: string;
  team: number;
  handSize: number;
}

interface GameState {
  board: { left: number; right: number; placedBy: string }[];
  hand: { left: number; right: number }[];
  currentTurn: string;
  scores: { 1: number; 2: number };
  leftEnd: number | null;
  rightEnd: number | null;
  players: Player[];
  roundNumber: number;
}

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const playerId = localStorage.getItem('playerId');
  const username = localStorage.getItem('username');

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastEvent, setLastEvent] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [sidePrompt, setSidePrompt] = useState<number | null>(null);

  const isMyTurn = gameState?.currentTurn === playerId;

  // countdown tick
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((prev) => (prev ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  useEffect(() => {
    const s = io(`${API_URL}/game`, {
      auth: { playerId, username },
    });

    s.on('connect', () => {
      s.emit('joinGame', code);
    });

    s.on('gameState', (data: GameState) => {
      setGameState(data);
    });

    s.on('timerStarted', (data: { currentTurn: string; duration: number }) => {
      setGameState((prev) =>
        prev ? { ...prev, currentTurn: data.currentTurn } : prev,
      );
      setTimeLeft(data.duration);
    });

    s.on('dominoPlaced', (data: any) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const placerName =
          prev.players.find((p) => p.playerId === data.playerId)?.username ??
          data.playerId;
        setLastEvent(
          `${data.autoPlayed ? '⏱ Auto-played' : '▶ Placed'} by ${placerName}`,
        );
        return {
          ...prev,
          board: data.board,
          leftEnd: data.leftEnd,
          rightEnd: data.rightEnd,
        };
      });
    });

    s.on('handUpdated', (data: any) => {
      setGameState((prev) => (prev ? { ...prev, hand: data.hand } : prev));
    });

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

    s.on('turnChanged', (data: any) => {
      setGameState((prev) =>
        prev ? { ...prev, currentTurn: data.currentTurn } : prev,
      );
    });

    s.on('playerKnocked', (data: any) => {
      setGameState((prev) => (prev ? { ...prev, scores: data.scores } : prev));
      setLastEvent(
        `🤜 ${data.username} knocked — ${data.points} pt${data.points > 1 ? 's' : ''} to opposing team`,
      );
    });

    s.on('softLock', (data: any) => {
      setGameState((prev) => (prev ? { ...prev, scores: data.scores } : prev));
      setLastEvent('🔒 Soft lock! 2 pts awarded');
    });

    s.on('roundStarted', (data: any) => {
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
      setLastEvent(`🎲 Round ${data.roundNumber} started`);
      setTimeLeft(data.timeLimit);
    });

    s.on('roundEnded', (data: any) => {
      setGameState((prev) => (prev ? { ...prev, scores: data.scores } : prev));
      setLastEvent(`✅ Round ended — tally ${data.tally} = ${data.points} pts`);
      setTimeLeft(null);
    });

    s.on('gameOver', (data: any) => {
      setLastEvent(`🏆 Game over — Team ${data.winner} wins!`);
      setTimeLeft(null);
      setTimeout(() => navigate('/lobby'), 4000);
    });

    s.on('gameError', () => {
      navigate('/lobby');
    });

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  const getValidIndices = (): number[] => {
    if (!gameState) return [];
    const { hand, leftEnd, rightEnd, board, roundNumber } = gameState;

    // round 1 first move — only 6|6
    if (board.length === 0 && roundNumber === 1) {
      return hand
        .map((_, i) => i)
        .filter((i) => hand[i].left === 6 && hand[i].right === 6);
    }

    // subsequent round first move — anything
    if (board.length === 0) {
      return hand.map((_, i) => i);
    }

    return hand.reduce((acc: number[], d, i) => {
      if (
        d.left === leftEnd ||
        d.right === leftEnd ||
        d.left === rightEnd ||
        d.right === rightEnd
      )
        acc.push(i);
      return acc;
    }, []);
  };

  const validIndices = isMyTurn ? getValidIndices() : [];

  const handlePlaceDomino = (dominoIndex: number) => {
    if (!isMyTurn) return;
    if (!validIndices.includes(dominoIndex)) return;

    const domino = gameState!.hand[dominoIndex];
    const { leftEnd, rightEnd, board } = gameState!;

    // first move of any round — just play it
    if (board.length === 0) {
      socket?.emit('placeDomino', { code, dominoIndex, side: 'right' });
      return;
    }

    const fitsLeft = domino.left === leftEnd || domino.right === leftEnd;
    const fitsRight = domino.left === rightEnd || domino.right === rightEnd;

    if (fitsLeft && fitsRight) {
      setSidePrompt(dominoIndex);
      return;
    }

    socket?.emit('placeDomino', {
      code,
      dominoIndex,
      side: fitsLeft ? 'left' : 'right',
    });
  };

  if (!gameState)
    return (
      <div
        className="wood-grain"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#f4e8c1',
            fontFamily: 'KomikaTitle, serif',
            fontSize: 24,
          }}
        >
          Connecting to game...
        </Text>
      </div>
    );

  return (
    <div
      className="wood-grain"
      style={{
        minHeight: '100vh',
        padding: '32px',
        fontFamily: 'KomikaTitle, serif',
      }}
    >
      {/* Side prompt modal */}
      {sidePrompt !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'rgba(10,7,3,0.97)',
              border: '1px solid rgba(180,140,60,0.3)',
              borderRadius: 12,
              padding: '28px 36px',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                color: 'rgba(200,184,122,0.6)',
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Which end?
            </Text>
            <Text
              style={{
                color: '#f4e8c1',
                fontFamily: 'Abril Fatface, serif',
                fontSize: 24,
                marginBottom: 20,
              }}
            >
              {gameState.hand[sidePrompt]?.left}|
              {gameState.hand[sidePrompt]?.right}
            </Text>
            <Group gap="md" justify="center">
              <div
                onClick={() => {
                  socket?.emit('placeDomino', {
                    code,
                    dominoIndex: sidePrompt,
                    side: 'left',
                  });
                  setSidePrompt(null);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid rgba(74,144,217,0.4)',
                  color: '#4a90d9',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                ← Left ({gameState.leftEnd})
              </div>
              <div
                onClick={() => {
                  socket?.emit('placeDomino', {
                    code,
                    dominoIndex: sidePrompt,
                    side: 'right',
                  });
                  setSidePrompt(null);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid rgba(217,112,74,0.4)',
                  color: '#d9704a',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Right ({gameState.rightEnd}) →
              </div>
            </Group>
          </div>
        </div>
      )}

      <Stack gap="xl" align="center">
        {/* Header */}
        <Group justify="space-between" style={{ width: '100%', maxWidth: 900 }}>
          <Text
            style={{
              color: '#f4b942',
              fontSize: 28,
              fontFamily: 'KomikaTitle, serif',
              letterSpacing: '0.1em',
            }}
          >
            ¡Doble Seis!
          </Text>
          <Group gap="lg">
            <Text style={{ color: 'rgba(200,184,122,0.5)', fontSize: 12 }}>
              Game {code}
            </Text>
            <Badge
              style={{
                background: 'rgba(74,144,217,0.15)',
                color: '#4a90d9',
                border: '1px solid rgba(74,144,217,0.3)',
              }}
            >
              Team 1: {gameState.scores[1]} pts
            </Badge>
            <Badge
              style={{
                background: 'rgba(217,112,74,0.15)',
                color: '#d9704a',
                border: '1px solid rgba(217,112,74,0.3)',
              }}
            >
              Team 2: {gameState.scores[2]} pts
            </Badge>
          </Group>
        </Group>

        {/* Players */}
        <Group gap="md">
          {gameState.players?.map((player) => (
            <div
              key={player.playerId}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: `1px solid ${player.team === 1 ? 'rgba(74,144,217,0.3)' : 'rgba(217,112,74,0.3)'}`,
                background:
                  gameState.currentTurn === player.playerId
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(255,255,255,0.02)',
              }}
            >
              <Text
                style={{
                  color: player.team === 1 ? '#4a90d9' : '#d9704a',
                  fontSize: 12,
                }}
              >
                {player.username}{' '}
                {gameState.currentTurn === player.playerId ? '▶' : ''}
              </Text>
              <Text style={{ color: 'rgba(200,184,122,0.4)', fontSize: 10 }}>
                {player.handSize} tiles
              </Text>
            </div>
          ))}
        </Group>

        {/* Board */}
        <div
          style={{
            width: '100%',
            maxWidth: 900,
            minHeight: 80,
            padding: '16px',
            borderRadius: 12,
            border: '1px solid rgba(180,140,60,0.2)',
            background: 'rgba(10,7,3,0.4)',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap' as const,
            gap: 4,
          }}
        >
          {gameState.board.length === 0 ? (
            <Text
              style={{
                color: 'rgba(200,184,122,0.2)',
                fontSize: 12,
                margin: '0 auto',
              }}
            >
              Board is empty
            </Text>
          ) : (
            gameState.board.map((domino, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(244,184,66,0.08)',
                  border: '1px solid rgba(244,184,66,0.2)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontFamily: 'Abril Fatface, serif',
                  color: '#f4e8c1',
                  fontSize: 13,
                }}
              >
                {domino.left}|{domino.right}
              </div>
            ))
          )}
        </div>

        {/* Ends + Timer */}
        <Group gap="xl" align="center">
          {gameState.board.length > 0 && (
            <>
              <Text style={{ color: 'rgba(200,184,122,0.5)', fontSize: 12 }}>
                Left:{' '}
                <span style={{ color: '#f4b942' }}>{gameState.leftEnd}</span>
              </Text>
              <Text style={{ color: 'rgba(200,184,122,0.5)', fontSize: 12 }}>
                Right:{' '}
                <span style={{ color: '#f4b942' }}>{gameState.rightEnd}</span>
              </Text>
            </>
          )}
          {timeLeft !== null && (
            <Text
              style={{
                color:
                  timeLeft <= 5
                    ? '#e05555'
                    : isMyTurn
                      ? '#f4b942'
                      : 'rgba(200,184,122,0.3)',
                fontSize: 20,
                fontFamily: 'Abril Fatface, serif',
              }}
            >
              {timeLeft}s
            </Text>
          )}
        </Group>

        {/* Turn indicator */}
        <Text
          style={{
            color: isMyTurn ? '#4caf50' : 'rgba(200,184,122,0.4)',
            fontSize: 13,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
          }}
        >
          {isMyTurn
            ? gameState.board.length === 0 && gameState.roundNumber === 1
              ? '▶ Your Turn — Play the 6|6 to open'
              : '▶ Your Turn'
            : 'Waiting for opponent...'}
        </Text>

        {/* Hand */}
        <Stack align="center" gap="sm" style={{ width: '100%', maxWidth: 900 }}>
          <Text
            style={{
              color: 'rgba(200,184,122,0.4)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
            }}
          >
            Your Hand
          </Text>
          <Group
            gap="sm"
            justify="center"
            style={{ flexWrap: 'wrap' as const }}
          >
            {gameState.hand?.map((domino, i) => {
              const isValid = validIndices.includes(i);
              return (
                <div
                  key={i}
                  onClick={() => handlePlaceDomino(i)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${isValid ? 'rgba(244,184,66,0.5)' : 'rgba(200,184,122,0.1)'}`,
                    background: isValid
                      ? 'rgba(244,184,66,0.08)'
                      : 'rgba(255,255,255,0.02)',
                    fontFamily: 'Abril Fatface, serif',
                    color: isValid ? '#f4e8c1' : 'rgba(200,184,122,0.25)',
                    fontSize: 16,
                    cursor: isValid ? 'pointer' : 'default',
                    textAlign: 'center' as const,
                    opacity: isMyTurn && !isValid ? 0.3 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {domino.left}|{domino.right}
                </div>
              );
            })}
          </Group>
        </Stack>

        {/* Last event */}
        {lastEvent && (
          <Text
            style={{
              color: 'rgba(200,184,122,0.3)',
              fontSize: 11,
              letterSpacing: '0.08em',
            }}
          >
            {lastEvent}
          </Text>
        )}
      </Stack>
    </div>
  );
}
