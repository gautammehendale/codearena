const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { cacheGet, cacheSet } = require('../services/redis');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  const { difficulty, tag, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = 'SELECT id, title, slug, difficulty, tags, accepted_count, submission_count FROM problems WHERE 1=1';
    const params = [];
    if (difficulty) { params.push(difficulty); query += ` AND difficulty=$${params.length}`; }
    if (tag) { params.push(tag); query += ` AND $${params.length}=ANY(tags)`; }
    if (search) { params.push(`%${search}%`); query += ` AND title ILIKE $${params.length}`; }
    params.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM problems');
    res.json({ problems: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

router.get('/:slug', optionalAuth, async (req, res) => {
  const cached = await cacheGet(`problem:${req.params.slug}`);
  if (cached) return res.json(cached);
  try {
    const result = await pool.query(
      'SELECT id, title, slug, description, difficulty, tags, time_limit, memory_limit, accepted_count, submission_count FROM problems WHERE slug=$1',
      [req.params.slug]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Problem not found' });
    await cacheSet(`problem:${req.params.slug}`, result.rows[0], 600);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

router.post('/', authenticate, requireAdmin, [
  body('title').trim().notEmpty(),
  body('description').notEmpty(),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']),
  body('testCases').isArray({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, difficulty, tags, testCases, timeLimit, memoryLimit } = req.body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const result = await pool.query(
      'INSERT INTO problems (title, slug, description, difficulty, tags, test_cases, time_limit, memory_limit, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, slug, description, tags || [], JSON.stringify(testCases), timeLimit || 2000, memoryLimit || 256, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Problem with this title already exists' });
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

module.exports = router;
