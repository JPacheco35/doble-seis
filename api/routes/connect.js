const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// POST /api/connect
// connect a client to the server, provide them with a unique uuid
router.post('/connect', (req, res) => {
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
})

module.exports = router;