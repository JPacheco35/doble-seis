require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const cors = require('cors');

app.use(cors({
    origin: ["https://pheels.vercel.app", "http://localhost:5173"],
    credentials: true,
}));


// POST /api/health
// This route returns OK if the api is running
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;