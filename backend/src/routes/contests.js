const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, description, start_time, end_time, array_length(problems, 1) as problem_count FROM contests ORDER BY start_time DESC'
    );
    const now = new Date();
    const contests = result.rows.map(c => ({
      ...c,
      status: now < new Date(c.start_time) ? 'Upcoming' : now > new Date(c.end_time) ? 'Ended' : 'Live'
    }));
    res.json(contests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contests WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Contest not found' });

    const contest = result.rows[0];
    const now = new Date();
    contest.status = now < new Date(contest.start_time) ? 'Upcoming' : now > new Date(contest.end_time) ? 'Ended' : 'Live';

    if (contest.problems?.length) {
      const problems = await pool.query(
        'SELECT id, title, slug, difficulty FROM problems WHERE id=ANY($1)', [contest.problems]
      );
      contest.problemList = problems.rows;
    }
    res.json(contest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contest' });
  }
});

router.post('/', authenticate, requireAdmin, [
  body('title').trim().notEmpty(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
  body('problems').isArray({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, startTime, endTime, problems } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contests (title, description, start_time, end_time, problems, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, description, startTime, endTime, problems, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create contest' });
  }
});

module.exports = router;
