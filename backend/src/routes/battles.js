const express = require('express');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const BATTLE_HOUR = 18; // 6 PM
const ENROLL_CUTOFF_HOUR = 16; // 4 PM
const LOBBY_MINUTES_BEFORE = 5;

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getBattleScheduledAt(dateStr) {
  const d = new Date(dateStr);
  d.setHours(BATTLE_HOUR, 0, 0, 0);
  return d;
}

// GET /api/battles/schedule - current battle schedule info
router.get('/schedule', async (req, res) => {
  const today = getTodayDate();
  const now = new Date();
  const cutoff = new Date(today);
  cutoff.setHours(ENROLL_CUTOFF_HOUR, 0, 0, 0);
  const battleTime = new Date(today);
  battleTime.setHours(BATTLE_HOUR, 0, 0, 0);
  const lobbyTime = new Date(battleTime.getTime() - LOBBY_MINUTES_BEFORE * 60000);

  res.json({
    today,
    enrollmentOpen: now < cutoff,
    enrollmentCutoff: cutoff.toISOString(),
    battleTime: battleTime.toISOString(),
    lobbyTime: lobbyTime.toISOString(),
    isLobbyOpen: now >= lobbyTime && now < battleTime,
    isBattleActive: now >= battleTime,
  });
});

// POST /api/battles/enroll - enroll for today's battle
router.post('/enroll', authenticate, async (req, res) => {
  const today = getTodayDate();
  const now = new Date();
  const cutoff = new Date(today);
  cutoff.setHours(ENROLL_CUTOFF_HOUR, 0, 0, 0);

  if (now >= cutoff) return res.status(400).json({ error: 'Enrollment closed for today. Opens again tomorrow.' });

  try {
    await pool.query(
      `INSERT INTO battle_enrollments (user_id, battle_date) VALUES ($1, $2)
       ON CONFLICT (user_id, battle_date) DO NOTHING`,
      [req.user.id, today]
    );
    const count = await pool.query('SELECT COUNT(*) FROM battle_enrollments WHERE battle_date=$1 AND status=$2', [today, 'enrolled']);
    res.json({ enrolled: true, totalEnrolled: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

// DELETE /api/battles/enroll - withdraw enrollment
router.delete('/enroll', authenticate, async (req, res) => {
  const today = getTodayDate();
  const now = new Date();
  const cutoff = new Date(today);
  cutoff.setHours(ENROLL_CUTOFF_HOUR, 0, 0, 0);

  if (now >= cutoff) return res.status(400).json({ error: 'Cannot withdraw after enrollment closes' });

  await pool.query('DELETE FROM battle_enrollments WHERE user_id=$1 AND battle_date=$2', [req.user.id, today]);
  res.json({ enrolled: false });
});

// GET /api/battles/enrollment - my enrollment status
router.get('/enrollment', authenticate, async (req, res) => {
  const today = getTodayDate();
  const enroll = await pool.query('SELECT * FROM battle_enrollments WHERE user_id=$1 AND battle_date=$2', [req.user.id, today]);
  const count = await pool.query('SELECT COUNT(*) FROM battle_enrollments WHERE battle_date=$1', [today]);
  res.json({
    enrolled: enroll.rows.length > 0,
    status: enroll.rows[0]?.status || null,
    totalEnrolled: parseInt(count.rows[0].count),
  });
});

// GET /api/battles/active - get user's active battle for today
router.get('/active', authenticate, async (req, res) => {
  const today = getTodayDate();
  try {
    const result = await pool.query(
      `SELECT b.*,
        p1.username as player1_name, p2.username as player2_name,
        pr.title as problem_title, pr.slug as problem_slug, pr.difficulty as problem_difficulty
       FROM battles b
       LEFT JOIN users p1 ON b.player1_id = p1.id
       LEFT JOIN users p2 ON b.player2_id = p2.id
       LEFT JOIN problems pr ON b.problem_id = pr.id
       WHERE (b.player1_id=$1 OR b.player2_id=$1) AND b.battle_date=$2
       ORDER BY b.created_at DESC LIMIT 1`,
      [req.user.id, today]
    );

    if (!result.rows.length) return res.json({ battle: null });

    const battle = result.rows[0];
    const isPlayer1 = battle.player1_id === req.user.id;
    const opponentId = isPlayer1 ? battle.player2_id : battle.player1_id;
    const opponentName = isPlayer1 ? battle.player2_name : battle.player1_name;

    // Get progress for both players
    const progress = await pool.query('SELECT * FROM battle_progress WHERE battle_id=$1', [battle.id]);
    const myProgress = progress.rows.find(p => p.user_id === req.user.id) || {};
    const opponentProgress = progress.rows.find(p => p.user_id === opponentId) || {};

    res.json({
      battle: {
        ...battle,
        isPlayer1,
        opponentId,
        opponentName: battle.is_bot ? `🤖 ArenaBot` : opponentName,
        myProgress,
        opponentProgress,
      }
    });
  } catch (err) {
    logger.error('Active battle error:', err);
    res.status(500).json({ error: 'Failed to fetch battle' });
  }
});

// POST /api/battles/:id/preference - set difficulty preference in lobby
router.post('/:id/preference', authenticate, async (req, res) => {
  const { difficulty } = req.body;
  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' });

  try {
    const battle = await pool.query('SELECT * FROM battles WHERE id=$1', [req.params.id]);
    if (!battle.rows.length) return res.status(404).json({ error: 'Battle not found' });

    const b = battle.rows[0];
    const isPlayer1 = b.player1_id === req.user.id;
    if (!isPlayer1 && b.player2_id !== req.user.id) return res.status(403).json({ error: 'Not your battle' });
    if (b.status !== 'lobby') return res.status(400).json({ error: 'Lobby is not open' });

    const col = isPlayer1 ? 'player1_pref' : 'player2_pref';
    await pool.query(`UPDATE battles SET ${col}=$1 WHERE id=$2`, [difficulty, b.id]);

    // Reload and check if both preferences set
    const updated = await pool.query('SELECT * FROM battles WHERE id=$1', [b.id]);
    const ub = updated.rows[0];

    if (ub.player1_pref && ub.player2_pref) {
      // Both set — agree on difficulty (player1 wins tie-break)
      const agreed = ub.player1_pref === ub.player2_pref ? ub.player1_pref : ub.player1_pref;
      await pool.query('UPDATE battles SET difficulty=$1 WHERE id=$2', [agreed, b.id]);
    }

    res.json({ set: true, preference: difficulty });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set preference' });
  }
});

// GET /api/battles/history - past battles
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*,
        p1.username as player1_name, p2.username as player2_name,
        w.username as winner_name,
        pr.title as problem_title, pr.difficulty as problem_difficulty
       FROM battles b
       LEFT JOIN users p1 ON b.player1_id = p1.id
       LEFT JOIN users p2 ON b.player2_id = p2.id
       LEFT JOIN users w ON b.winner_id = w.id
       LEFT JOIN problems pr ON b.problem_id = pr.id
       WHERE (b.player1_id=$1 OR b.player2_id=$1) AND b.status='completed'
       ORDER BY b.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows.map(b => ({
      ...b,
      won: b.winner_id === req.user.id,
      opponentName: b.player1_id === req.user.id
        ? (b.is_bot ? '🤖 ArenaBot' : b.player2_name)
        : b.player1_name,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch battle history' });
  }
});

// POST /api/battles/:id/quit - quit the battle (opponent wins)
router.post('/:id/quit', authenticate, async (req, res) => {
  try {
    const battle = await pool.query('SELECT * FROM battles WHERE id=$1 AND status=$2', [req.params.id, 'active']);
    if (!battle.rows.length) return res.status(404).json({ error: 'No active battle found' });
    const b = battle.rows[0];
    if (b.player1_id !== req.user.id && b.player2_id !== req.user.id) return res.status(403).json({ error: 'Not your battle' });

    const opponentId = b.player1_id === req.user.id ? b.player2_id : b.player1_id;

    await pool.query(`UPDATE battles SET status='completed', winner_id=$1, ended_at=NOW() WHERE id=$2`, [opponentId, b.id]);
    await pool.query('UPDATE users SET battle_losses=battle_losses+1 WHERE id=$1', [req.user.id]);
    if (opponentId && !b.is_bot) {
      await pool.query('UPDATE users SET battle_wins=battle_wins+1, points=points+50 WHERE id=$1', [opponentId]);
    }

    const { getRedis } = require('../services/redis');
    const io = req.app.get('io');
    io?.to(`battle:${b.id}`).emit('battle_end', { battleId: b.id, winnerId: opponentId, reason: 'opponent_quit' });
    io?.to(`user:${opponentId}`).emit('battle_end', { battleId: b.id, winnerId: opponentId, won: true, reason: 'opponent_quit' });

    res.json({ quit: true, opponentWins: true, message: 'You quit. Opponent wins.' });
  } catch (err) {
    logger.error('Quit error:', err);
    res.status(500).json({ error: 'Failed to quit battle' });
  }
});

// GET /api/battles/leaderboard - battle leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.battle_wins, u.battle_losses,
        CASE WHEN (u.battle_wins + u.battle_losses) > 0
          THEN ROUND(u.battle_wins::numeric / (u.battle_wins + u.battle_losses) * 100)
          ELSE 0 END as win_rate,
        COUNT(DISTINCT ub.id) as badge_count
       FROM users u
       LEFT JOIN user_badges ub ON u.id = ub.user_id
       WHERE u.battle_wins > 0 OR u.battle_losses > 0
       GROUP BY u.id
       ORDER BY u.battle_wins DESC, win_rate DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch battle leaderboard' });
  }
});

module.exports = router;
