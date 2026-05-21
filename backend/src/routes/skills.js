const express = require('express');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const ALL_TAGS = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting',
  'Binary Search', 'Greedy', 'Depth-First Search', 'Breadth-First Search', 'Tree', 'Graph',
  'Linked List', 'Stack', 'Queue', 'Heap', 'Trie', 'Sliding Window', 'Two Pointers',
  'Divide and Conquer', 'Recursion', 'Backtracking', 'Memoization', 'Bit Manipulation'];

router.get('/heatmap', authenticate, async (req, res) => {
  try {
    // Get all accepted submissions with problem tags for this user
    const result = await pool.query(
      `SELECT p.tags, COUNT(*) as solved_count
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id=$1 AND s.status='Accepted'
       GROUP BY p.tags`,
      [req.user.id]
    );

    // Also get total problems per tag for completion %
    const total = await pool.query(
      `SELECT tags, COUNT(*) as total FROM problems GROUP BY tags`
    );

    const tagStats = {};

    // Initialize all known tags
    for (const tag of ALL_TAGS) {
      tagStats[tag] = { solved: 0, total: 0, level: 'none' };
    }

    // Count total problems per tag
    for (const row of total.rows) {
      for (const tag of (row.tags || [])) {
        if (!tagStats[tag]) tagStats[tag] = { solved: 0, total: 0, level: 'none' };
        tagStats[tag].total += parseInt(row.total);
      }
    }

    // Count solved per tag
    for (const row of result.rows) {
      for (const tag of (row.tags || [])) {
        if (!tagStats[tag]) tagStats[tag] = { solved: 0, total: 0, level: 'none' };
        tagStats[tag].solved += parseInt(row.solved_count);
      }
    }

    // Assign level based on solved count
    for (const tag of Object.keys(tagStats)) {
      const { solved } = tagStats[tag];
      tagStats[tag].level = solved === 0 ? 'none' : solved < 2 ? 'weak' : solved < 5 ? 'medium' : 'strong';
    }

    // Filter to tags that have at least 1 total problem or are solved
    const filtered = Object.entries(tagStats)
      .filter(([, v]) => v.total > 0 || v.solved > 0)
      .map(([tag, stats]) => ({ tag, ...stats }))
      .sort((a, b) => b.solved - a.solved);

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skill heatmap' });
  }
});

router.get('/summary', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.difficulty, COUNT(*) as count
       FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id=$1 AND s.status='Accepted'
       GROUP BY p.difficulty`,
      [req.user.id]
    );
    const summary = { Easy: 0, Medium: 0, Hard: 0 };
    for (const row of result.rows) summary[row.difficulty] = parseInt(row.count);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skill summary' });
  }
});

module.exports = router;
