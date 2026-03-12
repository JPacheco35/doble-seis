const { lobbies, games } = require('./state.js');

const countdownTimeouts = {};

function broadcastLobbyList(lobby) {
    lobby.emit('lobbyList', Object.values(lobbies));
}

function generateLobbyCode() {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return lobbies[code] ? generateLobbyCode() : code;
}

module.exports = (io) => {
    const lobby = io.of('/lobby');

    lobby.on('connection', (socket) => {
        const { playerId, username } = socket.handshake.auth;
        console.log(`${username} connected to lobby`);
        lobby.emit('lobbyList', Object.values(lobbies));

        socket.on('createLobby', ({ name }) => {
            if (!name?.trim()) {
                console.log(`${username} tried creating a lobby with no name.`);
                return socket.emit('lobbyError', { message: 'Lobby name is required' });
            }

            const alreadyHosting = Object.values(lobbies).find(l => l.host === playerId);
            if (alreadyHosting) {
                console.log(`${username} tried hosting a second lobby.`);
                return socket.emit('lobbyError', { message: 'You are already hosting a lobby' });
            }

            const code = generateLobbyCode();

            lobbies[code] = {
                code,
                name: name.trim(),
                host: playerId,
                hostname: username,
                status: 'waiting',
                players: [{ playerId, username, team: 1 }],
            };

            socket.join(code);
            socket.emit('lobbyCreated', lobbies[code]);
            console.log(`${username} created lobby ${name} (${code})`);
            broadcastLobbyList(lobby);
        });

        socket.on('deleteLobby', (code) => {
            const foundLobby = lobbies[code];
            if (!foundLobby) return socket.emit('lobbyError', { message: 'Lobby not found' });
            if (foundLobby.host !== playerId) return socket.emit('lobbyError', { message: 'Only the host can delete the lobby' });

            clearTimeout(countdownTimeouts[code]);
            delete countdownTimeouts[code];

            lobby.to(code).emit('lobbyClosed', { code });
            delete lobbies[code];
            broadcastLobbyList(lobby);
            console.log(`${username} deleted lobby ${code}`);
        });

        socket.on('joinLobby', (code) => {
            const lobbyCode = code.toUpperCase().trim();
            const foundLobby = lobbies[lobbyCode];

            if (!foundLobby) return socket.emit('lobbyError', { message: 'Lobby not found' });
            if (foundLobby.players.length >= 4) return socket.emit('lobbyError', { message: 'Lobby is full' });
            if (foundLobby.status === 'playing') return socket.emit('lobbyError', { message: 'Game already in progress' });

            const team1Count = foundLobby.players.filter(p => p.team === 1).length;
            const team = team1Count < 2 ? 1 : 2;

            foundLobby.players.push({ playerId, username, team });
            socket.join(lobbyCode);

            console.log(`${username} joined lobby ${lobbyCode}`);
            lobby.to(lobbyCode).emit('lobbyUpdated', foundLobby);
            socket.emit('lobbyJoined', foundLobby);
            broadcastLobbyList(lobby);
        });

        socket.on('leaveLobby', (code) => {
            const foundLobby = lobbies[code];
            if (!foundLobby) return;

            const index = foundLobby.players.findIndex(p => p.playerId === playerId);
            if (index === -1) return;

            foundLobby.players.splice(index, 1);

            if (foundLobby.players.length === 0 || foundLobby.host === playerId) {
                clearTimeout(countdownTimeouts[code]);
                delete countdownTimeouts[code];
                lobby.to(code).emit('lobbyClosed', { code });
                socket.leave(code);
                delete lobbies[code];
            } else {
                if (foundLobby.status === 'starting') {
                    clearTimeout(countdownTimeouts[code]);
                    delete countdownTimeouts[code];
                    foundLobby.status = 'waiting';
                    lobby.to(code).emit('countdownCancelled', { code });
                }
                socket.leave(code);
                lobby.to(code).emit('lobbyUpdated', foundLobby);
            }

            broadcastLobbyList(lobby);
        });

        socket.on('closeLobby', (code) => {
            const foundLobby = lobbies[code];
            if (!foundLobby) return;
            if (foundLobby.host !== playerId) return socket.emit('lobbyError', { message: 'Only the host can close the lobby' });

            clearTimeout(countdownTimeouts[code]);
            delete countdownTimeouts[code];
            lobby.to(code).emit('lobbyClosed', { code });
            delete lobbies[code];
            broadcastLobbyList(lobby);
        });

        socket.on('swapTeam', ({ lobbyCode, playerId: targetId, team }) => {
            const foundLobby = lobbies[lobbyCode];
            if (!foundLobby) return;
            if (foundLobby.host !== playerId) return;

            const player = foundLobby.players.find(p => p.playerId === targetId);
            if (!player) return;

            player.team = team;
            lobby.in(lobbyCode).emit('teamSwapped', foundLobby);
            socket.emit('teamSwapped', foundLobby);
            console.log(`${player.username} swapped to team ${team} in lobby ${lobbyCode}`);
            broadcastLobbyList(lobby);
        });

        socket.on('startGame', (code) => {
            const foundLobby = lobbies[code];
            if (!foundLobby) return socket.emit('lobbyError', { message: 'Lobby not found' });
            if (foundLobby.host !== playerId) return socket.emit('lobbyError', { message: 'Only the host can start' });
            if (foundLobby.players.length < 4) return socket.emit('lobbyError', { message: 'Need 4 players to start' });

            foundLobby.status = 'starting';
            lobby.to(code).emit('gameCountdown', { code });

            countdownTimeouts[code] = setTimeout(() => {
                games[code] = {
                    code,
                    status: 'active',
                    players: foundLobby.players,
                    teams: {
                        1: foundLobby.players.filter(p => p.team === 1),
                        2: foundLobby.players.filter(p => p.team === 2),
                    },
                };

                lobby.in(code).emit('gameStarting', { code });
                socket.emit('gameStarting', { code });
                delete lobbies[code];
                delete countdownTimeouts[code];
                broadcastLobbyList(lobby);
                console.log(`Game ${code} started`);
            }, 10000);
        });

        socket.on('cancelStart', (code) => {
            const foundLobby = lobbies[code];
            if (!foundLobby) return;
            if (foundLobby.host !== playerId) return;

            clearTimeout(countdownTimeouts[code]);
            delete countdownTimeouts[code];
            foundLobby.status = 'waiting';
            lobby.to(code).emit('countdownCancelled', { code });
            broadcastLobbyList(lobby);
        });

        socket.on('disconnect', () => {
            console.log(`${username} disconnected from lobby`);

            for (const code in lobbies) {
                const foundLobby = lobbies[code];

                if (foundLobby.host === playerId) {
                    clearTimeout(countdownTimeouts[code]);
                    delete countdownTimeouts[code];
                    lobby.to(code).emit('lobbyClosed', { code });
                    delete lobbies[code];
                    console.log(`Lobby ${code} deleted — host disconnected`);
                    continue;
                }

                const index = foundLobby.players.findIndex(p => p.playerId === playerId);
                if (index !== -1) {
                    foundLobby.players.splice(index, 1);

                    if (foundLobby.status === 'starting') {
                        clearTimeout(countdownTimeouts[code]);
                        delete countdownTimeouts[code];
                        foundLobby.status = 'waiting';
                        lobby.to(code).emit('countdownCancelled', { code });
                    }

                    lobby.to(code).emit('lobbyUpdated', foundLobby);
                }
            }
            broadcastLobbyList(lobby);
        });
    });
};