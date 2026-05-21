const express = require('express');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const BADGE_META = {
  first_blood: { label: 'First Blood', icon: '🩸', desc: 'First ever to solve a problem on CodeArena', color: 'red' },
  streak_7:    { label: '7-Day Streak', icon: '🔥', desc: 'Solved problems 7 days in a row', color: 'orange' },
  streak_30:   { label: '30-Day Streak', icon: '⚡', desc: '30 day problem-solving streak', color: 'yellow' },
  streak_100:  { label: 'Century', icon: '💯', desc: '100 day streak legend', color: 'purple' },
  battle_win:  { label: 'Battle Victor', icon: '⚔️', desc: 'Won a 1v1 battle', color: 'blue' },
  first_solve: { label: 'First Solve', icon: '🏅', desc: 'Solved your first problem', color: 'green' },
};

router.get('/my', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_badges WHERE user_id=$1 ORDER BY earned_at DESC',
      [req.user.id]
    );
    const badges = result.rows.map(b => ({
      ...b,
      ...(BADGE_META[b.badge_type] || { label: b.badge_type, icon: '🏆', desc: '', color: 'gray' }),
    }));
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_badges WHERE user_id=$1 ORDER BY earned_at DESC',
      [req.params.userId]
    );
    const badges = result.rows.map(b => ({
      ...b,
      ...(BADGE_META[b.badge_type] || { label: b.badge_type, icon: '🏆', desc: '', color: 'gray' }),
    }));
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

module.exports = router;
