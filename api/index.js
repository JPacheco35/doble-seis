const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connect = require('./db');

const healthRoutes = require('./routes/health');
const connectRoutes = require('./routes/connect');
const lobbySocket = require('./sockets/lobby');

const app = express();
app.use(cors());
app.use(express.json());

// create server and io FIRST
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'https://doble-seis.vercel.app'],
        methods: ['GET', 'POST'],
    },
});

// now you can use io and server
lobbySocket(io);

// api routes
app.use('/api', healthRoutes);
app.use('/api', connectRoutes);

// connect to the database
connect();

server.listen(3000, () => console.log('Server running on port 3000'));