const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');
const { addSubmission } = require('../services/queue');

const router = express.Router();

const SUPPORTED_LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'c'];

router.post('/', authenticate, [
  body('problemId').isUUID(),
  body('language').isIn(SUPPORTED_LANGUAGES),
  body('code').notEmpty().isLength({ max: 50000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { problemId, language, code, contestId } = req.body;
  try {
    const problem = await pool.query('SELECT id, test_cases, time_limit, memory_limit FROM problems WHERE id=$1', [problemId]);
    if (!problem.rows.length) return res.status(404).json({ error: 'Problem not found' });

    const submission = await pool.query(
      'INSERT INTO submissions (user_id, problem_id, contest_id, language, code, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, status, created_at',
      [req.user.id, problemId, contestId || null, language, code, 'Pending']
    );
    const sub = submission.rows[0];

    await addSubmission({
      submissionId: sub.id,
      userId: req.user.id,
      problemId,
      language,
      code,
      testCases: problem.rows[0].test_cases,
      timeLimit: problem.rows[0].time_limit,
      memoryLimit: problem.rows[0].memory_limit,
    });

    res.status(201).json({ id: sub.id, status: sub.status, message: 'Submission queued' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, p.title as problem_title, p.slug as problem_slug
       FROM submissions s JOIN problems p ON s.problem_id=p.id
       WHERE s.id=$1 AND (s.user_id=$2 OR $3='admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Submission not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

router.get('/user/history', authenticate, async (req, res) => {
  const { page = 1, limit = 20, problemId } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = `SELECT s.id, s.language, s.status, s.runtime, s.memory_used, s.created_at, p.title, p.slug
                 FROM submissions s JOIN problems p ON s.problem_id=p.id WHERE s.user_id=$1`;
    const params = [req.user.id];
    if (problemId) { params.push(problemId); query += ` AND s.problem_id=$${params.length}`; }
    params.push(limit, offset);
    query += ` ORDER BY s.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
