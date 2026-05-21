const express = require('express');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'damn', 'hell'];

function censor(text) {
  let t = text;
  for (const word of BAD_WORDS) {
    const re = new RegExp(word, 'gi');
    t = t.replace(re, '*'.repeat(word.length));
  }
  return t;
}

// GET /api/chat/:roomId - get recent messages
router.get('/:roomId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contest_chat WHERE room_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.params.roomId]
    );
    res.json(result.rows.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// POST /api/chat/:roomId - send message
router.post('/:roomId', authenticate, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim() || message.length > 300) return res.status(400).json({ error: 'Invalid message' });

  const censored = censor(message.trim());
  try {
    const result = await pool.query(
      `INSERT INTO contest_chat (room_id, user_id, username, message) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.roomId, req.user.id, req.user.username, censored]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
