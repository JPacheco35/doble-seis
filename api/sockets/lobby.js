// keep track of all the current lobbies
// const lobbies = {};

// DEBUG: PLACEHOLDER LOBBIES
const lobbies = {
    'TEST': {
        code: 'TEST',
        name: 'Test Lobby 1',
        host: 'system',
        hostname: 'System',
        status: 'waiting',
        players: [
            { playerId:"aaa-123", username:"Alice", team: 1 },
            { playerId:"bbb-123", username:"Bob", team: 2 },
            { playerId:"ccc-123", username:"Charlie", team: 1 },
            { playerId:"ddd-123", username:"David", team: 2 },
        ],
    },
    'DEV2': {
        code: 'DEV2',
        name: 'Test Lobby 2',
        host: 'system',
        hostname: 'System',
        status: 'waiting',
        players: [
            { playerId:"eee-123", username:"Ethan", team: 1 },
            { playerId:"fff-123", username:"Fatima", team: 2 },
            { playerId:"ggg-123", username:"George", team: 1 },
        ],
    },
    'DEV3': {
        code: 'DEV3',
        name: 'Test Lobby 3',
        hostname: 'System',
        host: 'system',
        status: 'waiting',
        players: [
            { playerId:"hhh-123", username:"Hailey", team: 1 },
            { playerId:"iii-123", username:"Ian", team: 2 },
        ],
    },
    'DEV4': {
        code: 'DEV4',
        name: 'Test Lobby 4',
        hostname: 'System',
        host: 'system',
        status: 'waiting',
        players: [
            { playerId:"jjj-123", username:"Jim", team: 1 },
        ],
    },
};

// helper function at the top of lobby.js
function broadcastLobbyList(lobby) {
    lobby.emit('lobbyList', Object.values(lobbies));
}

// generate a unique lobby code and add it to the lobbies object
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
        console.log(`${username} connected to lobby`)
        lobby.emit('lobbyList', lobbies);

        socket.on('createLobby', ({ name }) => {

            if (!name?.trim()) {
                console.log(`${username} tried creating a lobby with no name.`);
                return socket.emit('lobbyError', { message: 'Lobby name is required' });
            }

            // check if player is already hosting a lobby
            const alreadyHosting = Object.values(lobbies).find(l => l.host === playerId);
            if (alreadyHosting) {
                console.log(`${username} tried hosting a second lobby.`);
                return socket.emit('lobbyError', { message: 'You are already hosting a lobby' });
            }

            const code = generateLobbyCode(); // was generateCode()

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

            lobby.to(code).emit('lobbyClosed', { code }); // notify players first
            delete lobbies[code];
            broadcastLobbyList(lobby);
            console.log(`${username} deleted lobby ${code}`);
        });


        // user joining a lobby
        socket.on('joinLobby', (code) => {
            const lobbyCode = code.toUpperCase().trim();
            const foundLobby = lobbies[lobbyCode];

            // lobby doesn't exist
            if (!foundLobby) {
                return socket.emit('lobbyError', { message: 'Lobby not found' });
            }

            // lobby is full
            if (foundLobby.players.length >= 4) {
                return socket.emit('lobbyError', { message: 'Lobby is full' });
            }

            // lobby already in game
            if (foundLobby.status === 'playing') {
                return socket.emit('lobbyError', { message: 'Game already in progress' });
            }

            // assign team — random between 1/2
            const team = foundLobby.players.length % 2 === 0 ? 1 : 2;

            // add player to lobby
            foundLobby.players.push({ playerId, username, team });

            // put socket in the new room
            socket.join(lobbyCode);

            // tell the lobby the updated state
            console.log(`${username} joined lobby ${lobbyCode}`);
            lobby.to(lobbyCode).emit('lobbyUpdated', foundLobby);

            // tell the new player specifically
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
                lobby.to(code).emit('lobbyClosed', { code }); // emit BEFORE leaving
                socket.leave(code);
                delete lobbies[code];
            } else {
                socket.leave(code);
                lobby.to(code).emit('lobbyUpdated', foundLobby);
            }

            broadcastLobbyList(lobby);
        });

        socket.on('closeLobby', (code) => {
            const foundLobby = lobbies[code];
            if (!foundLobby) return;
            if (foundLobby.host !== username) return socket.emit('lobbyError', { message: 'Only the host can close the lobby' });

            lobby.to(code).emit('lobbyClosed', { code });
            delete lobbies[code];
            broadcastLobbyList(lobby);
        });


        // starting the game
        socket.on('startGame', (code) => {
            const foundLobby = lobbies[code];

            // lobby doesn't exist
            if (!foundLobby) {
                return socket.emit('lobbyError', { message: 'Lobby not found' });
            }

            // only host can start
            if (foundLobby.host !== playerId) {
                return socket.emit('lobbyError', { message: 'Only the host can start the game' });
            }

            // need exactly 4 players
            if (foundLobby.players.length < 4) {
                return socket.emit('lobbyError', { message: 'Need 4 players to start' });
            }

            // tell everyone in the lobby the game is starting
            foundLobby.status = 'playing';
            console.log(`Game starting in lobby ${code}`);
            lobby.to(code).emit('gameStarting', { code });
            broadcastLobbyList(lobby);
        });

        // leaving a lobby
        socket.on('disconnect', () => {
            console.log(`${username} disconnected from lobby`);

            for (const code in lobbies) {
                const foundLobby = lobbies[code];

                // delete any lobby they were hosting
                if (foundLobby.host === playerId) {
                    delete lobbies[code];
                    console.log(`Lobby ${code} deleted — host disconnected`);
                    continue;
                }

                // remove them as a player from lobbies they joined
                const index = foundLobby.players.findIndex(p => p.playerId === playerId);
                if (index !== -1) {
                    foundLobby.players.splice(index, 1);
                    lobby.to(code).emit('lobbyUpdated', foundLobby);
                }
            }
            broadcastLobbyList(lobby);
        });
    });
};