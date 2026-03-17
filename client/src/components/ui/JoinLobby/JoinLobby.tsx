import React from 'react';
import { useEffect, useState } from 'react';
import CornerCard from "../CornerCard/CornerCard.tsx";
import { Stack, Text, Box, Flex } from "@mantine/core";
import { Socket } from "socket.io-client";
import { useNavigate } from 'react-router-dom';
import '../CreateLobby/CreateLobby.css';

interface JoinLobbyProps {
    joinCode: string;
    setJoinCode: (code: string) => void;
    socket: Socket | null;
    countdown: number | null;
    setCountdown: (val: number | null) => void;
    joinedCode: string | null;
    lobbyCreated: boolean;
}

function getTeamLabel(team: number) {
    return team === 1 ? 'Blue Team' : 'Red Team';
}

export default function JoinLobby({ setJoinCode, socket, countdown, joinedCode, lobbyCreated }: JoinLobbyProps) {
    const [, setJoined] = useState(false);
    const [, setError] = useState('');
    const [currentLobby, setCurrentLobby] = useState<any>(null);
    const navigate = useNavigate();

    // countdown tick for joined players
    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) {
            navigate(`/game/${joinedCode}`);
            return;
        }
    }, [countdown]);

    useEffect(() => {
        if (!socket) return;

        const onLobbyJoined = (lobby: any) => { setCurrentLobby(lobby); setJoined(true); setError(''); };
        const onLobbyUpdated = (lobby: any) => setCurrentLobby(lobby);
        const onTeamSwapped = (lobby: any) => setCurrentLobby(lobby);
        const onLobbyError = ({ message }: any) => setError(message);
        const onLobbyClosed = () => { setJoined(false); setCurrentLobby(null); setJoinCode(''); };

        socket.on('lobbyJoined', onLobbyJoined);
        socket.on('lobbyUpdated', onLobbyUpdated);
        socket.on('teamSwapped', onTeamSwapped);
        socket.on('lobbyError', onLobbyError);
        socket.on('lobbyClosed', onLobbyClosed);
        socket.on('gameStarting', ({ code }) => {
            navigate(`/game/${code}`);
        });

        return () => {
            socket.off('lobbyJoined', onLobbyJoined);
            socket.off('lobbyUpdated', onLobbyUpdated);
            socket.off('teamSwapped', onTeamSwapped);
            socket.off('lobbyError', onLobbyError);
            socket.off('lobbyClosed', onLobbyClosed);
            socket.off('gameStarting');
        };
    }, [socket]);

    const radius = 26;
    const circumference = 2 * Math.PI * radius;

    return (
        <Box component="div">
            {joinedCode && !lobbyCreated && (
                <CornerCard style={{ padding: '24px' }} cornerSize={15}>
                    <Text style={{ fontSize: 14, letterSpacing: '0.15em', color: 'rgba(200,184,122,0.6)', marginBottom: 20 }}>
                        Join Lobby
                    </Text>

                    <Stack gap="md">
                        <Text style={{ color: '#f4e8c1', fontSize: 13 }}>
                            In lobby <Text component="span" style={{ fontFamily: 'Abril Fatface, serif', color: '#f4b942' }}>{currentLobby?.code}</Text>
                            {' — '}{currentLobby?.name}
                        </Text>
                        <Text style={{ color: 'rgba(200,184,122,0.5)', fontSize: 11 }}>
                            {currentLobby?.players?.length}/4 players
                        </Text>

                        {/* Teams — always show */}
                        <Box component="div" style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '0 12px' }}>
                            <Box component="div" className="team-column">
                                <Text className="team-label" style={{ color: '#4a90d9' }}>{getTeamLabel(1)}</Text>
                                {currentLobby?.players?.filter((p: any) => p.team === 1).map((p: any) => (
                                    <Box component="div" key={p.playerId} className="player-badge" style={{ borderColor: 'rgba(74,144,217,0.5)', color: '#4a90d9' }}>
                                        <span className="player-badge-name">{p.username}</span>
                                    </Box>
                                ))}
                                {Array.from({ length: 2 - (currentLobby?.players?.filter((p: any) => p.team === 1).length ?? 0) }).map((_, i) => (
                                    <Box component="div" key={`e1-${i}`} className="player-slot-empty" />
                                ))}
                            </Box>

                            <Box component="div" style={{ background: 'rgba(180,140,60,0.15)' }} />

                            <Box component="div" className="team-column">
                                <Text className="team-label" style={{ color: '#d9704a' }}>{getTeamLabel(2)}</Text>
                                {currentLobby?.players?.filter((p: any) => p.team === 2).map((p: any) => (
                                    <Box component="div" key={p.playerId} className="player-badge" style={{ borderColor: 'rgba(217,112,74,0.5)', color: '#d9704a' }}>
                                        <span className="player-badge-name">{p.username}</span>
                                    </Box>
                                ))}
                                {Array.from({ length: 2 - (currentLobby?.players?.filter((p: any) => p.team === 2).length ?? 0) }).map((_, i) => (
                                    <Box component="div" key={`e2-${i}`} className="player-slot-empty" />
                                ))}
                            </Box>
                        </Box>

                        {/* Countdown — show when starting */}
                        {countdown !== null && (
                            <Flex direction="column" align="center">
                                <Text style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(200,184,122,0.5)', marginBottom: 12 }}>
                                    Game Starting In
                                </Text>
                                <Box component="div" className="countdown-wrap">
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
                                </Box>
                            </Flex>
                        )}
                    </Stack>
                </CornerCard>
            )}
        </Box>
    );
}