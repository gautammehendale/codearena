const express = require('express');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

function getNextBattleTime() {
  // Battles every 30 mins: at :00 and :30 of every hour
  // Enrollment closes 10 mins before (:50 and :20)
  // Matching 5 mins before (:55 and :25)
  const now = new Date();
  const battle = new Date(now);
  const mins = now.getMinutes();
  const secs = now.getSeconds();

  if (mins < 30 || (mins === 30 && secs === 0)) {
    // Next battle is at :30
    battle.setMinutes(30, 0, 0);
  } else {
    // Next battle is at :00 of next hour
    battle.setMinutes(0, 0, 0);
    battle.setHours(battle.getHours() + 1);
  }
  return battle;
}

function getTodayDate() { return new Date().toISOString().split('T')[0]; }

router.get('/schedule', async (req, res) => {
  const now = new Date();
  const nextBattle = getNextBattleTime();
  const enrollmentOpens = new Date(nextBattle.getTime() - 30 * 60000); // 30 mins before
  const matchingTime = new Date(nextBattle.getTime() - 5 * 60000);    // 5 mins before
  const lobbyTime = new Date(nextBattle.getTime() - 2 * 60000);       // 2 mins before

  res.json({
    nextBattleTime: nextBattle.toISOString(),
    enrollmentOpens: enrollmentOpens.toISOString(),
    matchingTime: matchingTime.toISOString(),
    lobbyTime: lobbyTime.toISOString(),
    enrollmentOpen: now >= enrollmentOpens && now < matchingTime,
    isLobbyOpen: now >= lobbyTime && now < nextBattle,
    isBattleActive: now >= nextBattle && (nextBattle.getTime() + 90 * 60000) > now.getTime(),
    minutesUntilBattle: Math.max(0, Math.round((nextBattle.getTime() - now.getTime()) / 60000)),
  });
});

router.post('/enroll', authenticate, async (req, res) => {
  const now = new Date();
  const nextBattle = getNextBattleTime();
  const enrollmentOpens = new Date(nextBattle.getTime() - 30 * 60000);
  const matchingTime = new Date(nextBattle.getTime() - 5 * 60000);

  if (now < enrollmentOpens) {
    const minsUntil = Math.round((enrollmentOpens.getTime() - now.getTime()) / 60000);
    return res.status(400).json({ error: `Enrollment opens in ${minsUntil} minutes` });
  }
  if (now >= matchingTime) {
    return res.status(400).json({ error: 'Enrollment closed. Next battle starts soon.' });
  }

  try {
    const today = getTodayDate();
    await pool.query(
      `INSERT INTO battle_enrollments (user_id, battle_date, scheduled_battle_time)
       VALUES ($1,$2,$3) ON CONFLICT (user_id, battle_date) DO UPDATE SET scheduled_battle_time=$3, status='enrolled'`,
      [req.user.id, today, nextBattle.toISOString()]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM battle_enrollments WHERE scheduled_battle_time=$1 AND status='enrolled'`,
      [nextBattle.toISOString()]
    );
    res.json({ enrolled: true, totalEnrolled: parseInt(count.rows[0].count), nextBattleTime: nextBattle.toISOString() });
  } catch (err) {
    logger.error('Enroll error:', err);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

router.delete('/enroll', authenticate, async (req, res) => {
  const today = getTodayDate();
  await pool.query('DELETE FROM battle_enrollments WHERE user_id=$1 AND battle_date=$2', [req.user.id, today]);
  res.json({ enrolled: false });
});

router.get('/enrollment', authenticate, async (req, res) => {
  const today = getTodayDate();
  const nextBattle = getNextBattleTime();
  const enroll = await pool.query(
    'SELECT * FROM battle_enrollments WHERE user_id=$1 AND battle_date=$2', [req.user.id, today]
  );
  const count = await pool.query(
    'SELECT COUNT(*) FROM battle_enrollments WHERE scheduled_battle_time=$1 AND status=$2',
    [nextBattle.toISOString(), 'enrolled']
  );
  res.json({ enrolled: enroll.rows.length > 0, status: enroll.rows[0]?.status || null, totalEnrolled: parseInt(count.rows[0].count) });
});

router.get('/active', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, p1.username as player1_name, p2.username as player2_name,
        pr.title as problem_title, pr.slug as problem_slug, pr.difficulty as problem_difficulty
       FROM battles b
       LEFT JOIN users p1 ON b.player1_id=p1.id
       LEFT JOIN users p2 ON b.player2_id=p2.id
       LEFT JOIN problems pr ON b.problem_id=pr.id
       WHERE (b.player1_id=$1 OR b.player2_id=$1) AND b.status IN ('lobby','active','matched')
       ORDER BY b.created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.json({ battle: null });
    const battle = result.rows[0];
    const isPlayer1 = battle.player1_id === req.user.id;
    const opponentId = isPlayer1 ? battle.player2_id : battle.player1_id;
    const opponentName = isPlayer1 ? battle.player2_name : battle.player1_name;
    const progress = await pool.query('SELECT * FROM battle_progress WHERE battle_id=$1', [battle.id]);
    res.json({ battle: { ...battle, isPlayer1, opponentId, opponentName: battle.is_bot ? '🤖 ArenaBot' : opponentName, myProgress: progress.rows.find(p => p.user_id === req.user.id) || {}, opponentProgress: progress.rows.find(p => p.user_id === opponentId) || {} } });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch battle' }); }
});

router.post('/:id/preference', authenticate, async (req, res) => {
  const { difficulty } = req.body;
  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' });
  try {
    const battle = await pool.query('SELECT * FROM battles WHERE id=$1', [req.params.id]);
    if (!battle.rows.length) return res.status(404).json({ error: 'Battle not found' });
    const b = battle.rows[0];
    const isPlayer1 = b.player1_id === req.user.id;
    const col = isPlayer1 ? 'player1_pref' : 'player2_pref';
    await pool.query(`UPDATE battles SET ${col}=$1 WHERE id=$2`, [difficulty, b.id]);
    const updated = await pool.query('SELECT * FROM battles WHERE id=$1', [b.id]);
    const ub = updated.rows[0];
    if (ub.player1_pref && ub.player2_pref) {
      const agreed = ub.player1_pref === ub.player2_pref ? ub.player1_pref : 'Medium';
      await pool.query('UPDATE battles SET difficulty=$1 WHERE id=$2', [agreed, b.id]);
    }
    res.json({ set: true, preference: difficulty });
  } catch (err) { res.status(500).json({ error: 'Failed to set preference' }); }
});

router.post('/:id/quit', authenticate, async (req, res) => {
  try {
    const battle = await pool.query('SELECT * FROM battles WHERE id=$1 AND status=$2', [req.params.id, 'active']);
    if (!battle.rows.length) return res.status(404).json({ error: 'No active battle' });
    const b = battle.rows[0];
    const opponentId = b.player1_id === req.user.id ? b.player2_id : b.player1_id;
    await pool.query(`UPDATE battles SET status='completed', winner_id=$1, ended_at=NOW() WHERE id=$2`, [opponentId, b.id]);
    await pool.query('UPDATE users SET battle_losses=battle_losses+1 WHERE id=$1', [req.user.id]);
    if (opponentId && !b.is_bot) await pool.query('UPDATE users SET battle_wins=battle_wins+1, points=points+50 WHERE id=$1', [opponentId]);
    const io = req.app.get('io');
    io?.to(`battle:${b.id}`).emit('battle_end', { battleId: b.id, winnerId: opponentId, reason: 'opponent_quit' });
    io?.to(`user:${opponentId}`).emit('battle_end', { battleId: b.id, winnerId: opponentId, won: true, reason: 'opponent_quit' });
    res.json({ quit: true, opponentWins: true });
  } catch (err) { res.status(500).json({ error: 'Failed to quit' }); }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, p1.username as player1_name, p2.username as player2_name, w.username as winner_name, pr.title as problem_title, pr.difficulty as problem_difficulty
       FROM battles b LEFT JOIN users p1 ON b.player1_id=p1.id LEFT JOIN users p2 ON b.player2_id=p2.id
       LEFT JOIN users w ON b.winner_id=w.id LEFT JOIN problems pr ON b.problem_id=pr.id
       WHERE (b.player1_id=$1 OR b.player2_id=$1) AND b.status='completed' ORDER BY b.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows.map(b => ({ ...b, won: b.winner_id === req.user.id, opponentName: b.player1_id === req.user.id ? (b.is_bot ? '🤖 ArenaBot' : b.player2_name) : b.player1_name })));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch history' }); }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.battle_wins, u.battle_losses,
        CASE WHEN (u.battle_wins+u.battle_losses)>0 THEN ROUND(u.battle_wins::numeric/(u.battle_wins+u.battle_losses)*100) ELSE 0 END as win_rate
       FROM users u WHERE u.battle_wins>0 OR u.battle_losses>0 ORDER BY u.battle_wins DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch leaderboard' }); }
});

module.exports = router;
