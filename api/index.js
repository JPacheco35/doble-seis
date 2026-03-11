const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connect = require('./db');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://doble-seis.vercel.app"],
        methods: ["GET", "POST"]
    }
});

let currentColor = "blue"; // server holds the truth

// POST /api/health
// This route returns OK if the api is running
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// POST / join
// This route is used to join a new user to the lobby
app.post('/api/join', (req, res) => {
    const { username } = req.body;

    // no username provided
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const playerId = uuidv4();

    // join the lobby
    res.status(200).json({
        message: 'Joined lobby',
        playerId,
        username,
    });
});


io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // immediately tell the new client the current color
    socket.emit('colorUpdate', currentColor);

    socket.on('toggleColor', () => {
        currentColor = currentColor === 'blue' ? 'red' : 'blue';
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] Client ${socket.id} toggled color to ${currentColor}`);
        io.emit('colorUpdate', currentColor);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

connect();
server.listen(3000, () => console.log('Server running on port 3000'));