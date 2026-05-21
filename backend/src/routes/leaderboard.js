const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getLeaderboard, getUserRank } = require('../services/redis');

const router = express.Router();

router.get('/', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const start = (page - 1) * limit;
  const end = start + parseInt(limit) - 1;
  try {
    const leaderboard = await getLeaderboard(start, end);
    res.json({ leaderboard, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const rank = await getUserRank(req.user.id);
    res.json(rank);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rank' });
  }
});

module.exports = router;
