import React from 'react';
import { useEffect, useState } from 'react';
import CornerCard from "../CornerCard/CornerCard.tsx";
import { Button, Stack, Text, TextInput } from "@mantine/core";
import { Socket } from "socket.io-client";
import { useNavigate } from 'react-router-dom';
import './CreateLobby.css';

interface Player {
    playerId: string;
    username: string;
    team: number;
}

interface CreateLobbyProps {
    lobbyName: string;
    setLobbyName: (name: string) => void;
    socket: Socket | null;
    connected: boolean;
    lobbyCreated: boolean;
    setLobbyCreated: (val: boolean) => void;
    lobbyCode: string;
    setLobbyCode: (val: string) => void;
    joinedCode: string | null;
    countdown: number | null;
    setCountdown: (val: number | null) => void;
}

export default function CreateLobby({ lobbyName, setLobbyName, socket, connected, lobbyCreated, setLobbyCreated, lobbyCode, setLobbyCode, joinedCode, countdown, setCountdown }: CreateLobbyProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const navigate = useNavigate();

    const isFull = players.length === 4;
    const clearCountdown = () => setCountdown(null);

    const handleCreate = () => {
        if (!socket) return;
        if (!lobbyName.trim()) return;
        socket.emit('createLobby', { name: lobbyName.trim() });
    };

    const handleDelete = () => {
        if (!socket) return;
        socket.emit('deleteLobby', lobbyCode);
        setLobbyCreated(false);
        setLobbyCode('');
        setPlayers([]);
        setSelectedPlayer(null);
        clearCountdown();
    };

    const handleStartGame = () => socket?.emit('startGame', lobbyCode);
    const handleCancelStart = () => socket?.emit('cancelStart', lobbyCode);

    const handleSwapTeam = (pid: string, newTeam: number) => {
        const team1Count = players.filter(p => p.team === 1 && p.playerId !== pid).length;
        const team2Count = players.filter(p => p.team === 2 && p.playerId !== pid).length;
        if (newTeam === 1 && team1Count >= 2) return;
        if (newTeam === 2 && team2Count >= 2) return;
        socket?.emit('swapTeam', { lobbyCode, playerId: pid, team: newTeam });
    };

    const handlePlayerClick = (player: Player) => {
        if (!selectedPlayer) { setSelectedPlayer(player); return; }
        if (selectedPlayer.playerId === player.playerId) { setSelectedPlayer(null); return; }
        socket?.emit('swapTeam', { lobbyCode, playerId: selectedPlayer.playerId, team: player.team });
        socket?.emit('swapTeam', { lobbyCode, playerId: player.playerId, team: selectedPlayer.team });
        setSelectedPlayer(null);
    };

    const handleEmptySlotClick = (team: number) => {
        if (!selectedPlayer) return;
        if (selectedPlayer.team === team) { setSelectedPlayer(null); return; }
        handleSwapTeam(selectedPlayer.playerId, team);
        setSelectedPlayer(null);
    };

    // countdown tick
    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) {
            navigate(`/game/${lobbyCode}`);
            return;
        }
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    useEffect(() => {
        if (!socket) return;

        socket.on('lobbyCreated', (lobby) => {
            setLobbyCode(lobby.code);
            setLobbyCreated(true);
            setPlayers(lobby.players);
        });

        socket.on('lobbyUpdated', (lobby) => setPlayers(lobby.players));
        socket.on('teamSwapped', (lobby) => setPlayers(lobby.players));
        socket.on('gameStarting', ({ code }) => {
            navigate(`/game/${code}`);
        });

        return () => {
            socket.off('lobbyCreated');
            socket.off('lobbyUpdated');
            socket.off('teamSwapped');
            socket.off('gameStarting');
        };
    }, [socket]);

    const team1 = players.filter(p => p.team === 1);
    const team2 = players.filter(p => p.team === 2);

    const renderSlots = (team: number, teamPlayers: Player[]) => {
        return [0, 1].map((i) => {
            const player = teamPlayers[i];
            const isSelected = selectedPlayer?.playerId === player?.playerId;
            return player ? (
                <div
                    key={player.playerId}
                    className={`player-badge ${isSelected ? 'player-badge-selected' : ''}`}
                    style={{
                        borderColor: team === 1 ? 'rgba(74,144,217,0.5)' : 'rgba(217,112,74,0.5)',
                        color: team === 1 ? '#4a90d9' : '#d9704a',
                    }}
                    onClick={() => handlePlayerClick(player)}
                >
                    <span className="player-badge-name">{player.username}</span>
                </div>
            ) : (
                <div
                    key={`empty-${i}`}
                    className={`player-slot-empty ${selectedPlayer ? 'player-slot-droppable' : ''}`}
                    onClick={() => handleEmptySlotClick(team)}
                />
            );
        });
    };

    const radius = 26;
    const circumference = 2 * Math.PI * radius;

    return (
        <CornerCard style={{ padding: '24px' }} cornerSize={15}>
            <Text style={{ fontSize: 14, letterSpacing: '0.15em', color: 'rgba(200,184,122,0.6)', marginBottom: 20 }}>
                Create Lobby
            </Text>

            <Stack gap="md">
                <TextInput
                    label="Lobby Name"
                    value={lobbyName}
                    onChange={(e) => setLobbyName(e.currentTarget.value)}
                    maxLength={24}
                    disabled={lobbyCreated}
                    styles={{
                        input: { fontFamily: 'KomikaTitle, serif', fontSize: 10 },
                        label: { marginBottom: '10px', fontSize: 10 },
                    }}
                />

                {lobbyCreated && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '0 12px' }}>
                            <div className="team-column" onClick={() => handleEmptySlotClick(1)}>
                                <Text className="team-label" style={{ color: '#4a90d9' }}>Team 1</Text>
                                {renderSlots(1, team1)}
                            </div>
                            <div style={{ background: 'rgba(180,140,60,0.15)' }} />
                            <div className="team-column" onClick={() => handleEmptySlotClick(2)}>
                                <Text className="team-label" style={{ color: '#d9704a' }}>Team 2</Text>
                                {renderSlots(2, team2)}
                            </div>
                        </div>

                        <Text style={{ fontSize: 10, color: 'rgba(200,184,122,0.3)', textAlign: 'center', letterSpacing: '0.08em' }}>
                            {players.length}/4 · click a player then a slot to swap
                        </Text>

                        {countdown !== null && (
                            <div style={{ textAlign: 'center' }}>
                                <Text style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(200,184,122,0.5)', marginBottom: 12 }}>
                                    Game Starting In
                                </Text>
                                <div className="countdown-wrap">
                                    <svg className="countdown-ring" viewBox="0 0 60 60">
                                        <circle cx="30" cy="30" r={radius} className="countdown-ring-bg" />
                                        <circle
                                            cx="30" cy="30" r={radius}
                                            className="countdown-ring-fill"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={circumference * (1 - countdown / 10)}
                                        />
                                    </svg>
                                    <span className="countdown-number">{countdown}</span>
                                </div>
                            </div>
                        )}

                        {isFull && countdown === null && (
                            <Button fullWidth className="start-btn" onClick={handleStartGame}>
                                Start Game
                            </Button>
                        )}

                        {countdown !== null && lobbyCreated && (
                            <Button fullWidth className="delete-btn" onClick={handleCancelStart}>
                                Cancel
                            </Button>
                        )}
                    </>
                )}

                <Button
                    fullWidth
                    className="create-btn"
                    disabled={!connected || !socket || !lobbyName.trim() || lobbyCreated || !!joinedCode}
                    onClick={handleCreate}
                    style={{ overflow: 'visible' }}
                >
                    Create Game
                </Button>

                {lobbyCreated && countdown === null && (
                    <Button fullWidth className="delete-btn" onClick={handleDelete}>
                        Delete Game
                    </Button>
                )}
            </Stack>
        </CornerCard>
    );
}