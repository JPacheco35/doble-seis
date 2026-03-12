const { lobbies, games } = require('./state.js');

module.exports = (io) => {
    const game = io.of('/game');

    game.on('connection', (socket) => {
        const { playerId, username } = socket.handshake.auth;

        socket.on('joinGame', (code) => {
            const foundGame = games[code];

            // verify player belongs to this game
            if (!foundGame) return socket.emit('gameError', { message: 'Game not found' });
            const inGame = foundGame.players.find(p => p.playerId === playerId);
            if (!inGame) return socket.emit('gameError', { message: 'You are not in this game' });

            socket.join(code);
            socket.emit('gameJoined', foundGame);
            console.log(`${username} joined game ${code}`);
        });

        socket.on('disconnect', () => {
            // handle player disconnecting mid-game
        });
    });
};