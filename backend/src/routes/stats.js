const express = require('express');
const { pool } = require('../models/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/public - visible to everyone
router.get('/public', async (req, res) => {
  try {
    const [users, problems, submissions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM problems'),
      pool.query("SELECT COUNT(*) FROM submissions WHERE status='Accepted'"),
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalProblems: parseInt(problems.rows[0].count),
      totalSolved: parseInt(submissions.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/stats/admin/users - admin only: list all users with activity
router.get('/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.total_solved, u.total_submissions,
        u.points, u.streak, u.battle_wins, u.created_at, u.last_solved_date,
        COUNT(DISTINCT s.id) FILTER (WHERE s.created_at > NOW() - INTERVAL '7 days') as submissions_this_week
       FROM users u
       LEFT JOIN submissions s ON u.id = s.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
