const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connect = require('./db');
const { v4: uuidv4 } = require('uuid');

const healthRoutes = require('./routes/health');
const connectRoutes = require('./routes/connect');


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


// connect to the database
connect();

// import api routes
app.use('/api', healthRoutes);
app.use('/api', connectRoutes);


server.listen(3000, () => console.log('Server running on port 3000'));