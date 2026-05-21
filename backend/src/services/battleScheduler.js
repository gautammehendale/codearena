const { pool } = require('../models/db');
const logger = require('../utils/logger');

const BOT_SOLVE_TIMES = { Easy: [8, 12], Medium: [15, 25], Hard: [30, 50] };

function randBetween(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function getTodayDate() { return new Date().toISOString().split('T')[0]; }

async function runMatchmaking(io) {
  const today = getTodayDate();
  logger.info('Running battle matchmaking for', today);

  try {
    const enrolled = await pool.query(
      `SELECT user_id FROM battle_enrollments WHERE battle_date=$1 AND status='enrolled' ORDER BY created_at`,
      [today]
    );
    const users = enrolled.rows.map(r => r.user_id);
    if (users.length === 0) { logger.info('No enrollments for today'); return; }

    const scheduledAt = new Date(today);
    scheduledAt.setHours(18, 0, 0, 0);

    const pairs = [];
    for (let i = 0; i < users.length - 1; i += 2) pairs.push([users[i], users[i + 1]]);
    if (users.length % 2 === 1) pairs.push([users[users.length - 1], null]); // bot match

    for (const [p1, p2] of pairs) {
      const isBot = p2 === null;
      const result = await pool.query(
        `INSERT INTO battles (player1_id, player2_id, is_bot, status, battle_date, scheduled_at)
         VALUES ($1, $2, $3, 'matched', $4, $5)
         ON CONFLICT DO NOTHING RETURNING id`,
        [p1, isBot ? p1 : p2, isBot, today, scheduledAt]
      );

      if (result.rows.length) {
        await pool.query(
          `UPDATE battle_enrollments SET status='matched' WHERE user_id=ANY($1) AND battle_date=$2`,
          [[p1, ...(isBot ? [] : [p2])], today]
        );
        logger.info(`Matched: ${p1} vs ${isBot ? 'BOT' : p2}`);
      }
    }

    io?.to('battles').emit('matchmaking_complete', { date: today, totalPairs: pairs.length });
  } catch (err) {
    logger.error('Matchmaking error:', err);
  }
}

async function openLobby(io) {
  const today = getTodayDate();
  const updated = await pool.query(
    `UPDATE battles SET status='lobby' WHERE battle_date=$1 AND status='matched' RETURNING id, player1_id, player2_id, is_bot`,
    [today]
  );
  logger.info(`Opened lobby for ${updated.rowCount} battles`);
  for (const b of updated.rows) {
    io?.to(`battle:${b.id}`).emit('battle_lobby_open', { battleId: b.id });
    io?.to(`user:${b.player1_id}`).emit('battle_lobby_open', { battleId: b.id });
    if (!b.is_bot) io?.to(`user:${b.player2_id}`).emit('battle_lobby_open', { battleId: b.id });
  }
}

async function startBattles(io) {
  const today = getTodayDate();
  const lobbies = await pool.query(
    `SELECT * FROM battles WHERE battle_date=$1 AND status='lobby'`, [today]
  );

  for (const b of lobbies.rows) {
    const difficulty = b.difficulty || b.player1_pref || 'Medium';
    const problem = await pool.query(
      `SELECT id FROM problems WHERE difficulty=$1 AND is_premium=FALSE ORDER BY RANDOM() LIMIT 1`,
      [difficulty]
    );
    if (!problem.rows.length) continue;

    const probId = problem.rows[0].id;
    const now = new Date();
    await pool.query(
      `UPDATE battles SET status='active', problem_id=$1, difficulty=$2, started_at=$3 WHERE id=$4`,
      [probId, difficulty, now, b.id]
    );

    // Init progress rows
    await pool.query(`INSERT INTO battle_progress (battle_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [b.id, b.player1_id]);
    if (!b.is_bot) await pool.query(`INSERT INTO battle_progress (battle_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [b.id, b.player2_id]);

    io?.to(`battle:${b.id}`).emit('battle_start', { battleId: b.id, problemId: probId, difficulty });
    io?.to(`user:${b.player1_id}`).emit('battle_start', { battleId: b.id, problemId: probId, difficulty });
    if (!b.is_bot) io?.to(`user:${b.player2_id}`).emit('battle_start', { battleId: b.id, problemId: probId, difficulty });

    // Schedule bot solve if applicable
    if (b.is_bot) {
      const [min, max] = BOT_SOLVE_TIMES[difficulty] || BOT_SOLVE_TIMES.Medium;
      const botSolveMs = randBetween(min, max) * 60000;
      setTimeout(() => resolveBotWin(io, b.id, b.player1_id), botSolveMs);
      logger.info(`Bot will solve in ${botSolveMs / 60000} mins for battle ${b.id}`);
    }

    // Auto-end battle after 2 hours
    setTimeout(() => endBattle(io, b.id, null), 2 * 60 * 60 * 1000);
  }
  logger.info(`Started ${lobbies.rowCount} battles`);
}

async function resolveBotWin(io, battleId, playerId) {
  const battle = await pool.query('SELECT * FROM battles WHERE id=$1 AND status=$2', [battleId, 'active']);
  if (!battle.rows.length) return;
  // Bot doesn't actually win in this implementation — player gets the win if they solve it, otherwise draw
  logger.info(`Bot solve time reached for battle ${battleId}, battle continues`);
}

async function endBattle(io, battleId, winnerId) {
  const battle = await pool.query('SELECT * FROM battles WHERE id=$1 AND status=\'active\'', [battleId]);
  if (!battle.rows.length) return;

  const b = battle.rows[0];
  await pool.query(
    `UPDATE battles SET status='completed', winner_id=$1, ended_at=NOW() WHERE id=$2`,
    [winnerId, battleId]
  );

  if (winnerId) {
    await pool.query('UPDATE users SET battle_wins=battle_wins+1, points=points+50 WHERE id=$1', [winnerId]);
    const loserId = b.player1_id === winnerId ? b.player2_id : b.player1_id;
    if (loserId && !b.is_bot) await pool.query('UPDATE users SET battle_losses=battle_losses+1 WHERE id=$1', [loserId]);
  }

  io?.to(`battle:${battleId}`).emit('battle_end', { battleId, winnerId });
  io?.to(`user:${b.player1_id}`).emit('battle_end', { battleId, winnerId, won: b.player1_id === winnerId });
  if (!b.is_bot && b.player2_id) io?.to(`user:${b.player2_id}`).emit('battle_end', { battleId, winnerId, won: b.player2_id === winnerId });
  logger.info(`Battle ${battleId} ended. Winner: ${winnerId || 'none'}`);
}

function setupBattleScheduler(io) {
  // Check every minute for scheduled events
  setInterval(async () => {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();

    if (h === 16 && m === 0) await runMatchmaking(io);
    if (h === 17 && m === 55) await openLobby(io);
    if (h === 18 && m === 0) await startBattles(io);
  }, 60000);

  logger.info('Battle scheduler initialized (matchmaking@16:00, lobby@17:55, start@18:00)');
}

module.exports = { setupBattleScheduler, endBattle, runMatchmaking };
