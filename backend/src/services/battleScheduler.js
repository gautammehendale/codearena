const { pool } = require('../models/db');
const logger = require('../utils/logger');

// Battles happen every hour on the hour
// Enrollment opens :30 (30 mins before)
// Matching runs :45 (15 mins before)
// Battle starts :00 (top of each hour)

const BOT_SOLVE_TIMES = { Easy: [3, 8], Medium: [8, 15], Hard: [15, 25] };
function randBetween(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function getTodayDate() { return new Date().toISOString().split('T')[0]; }

// Returns scheduled battle time (top of next hour, or current hour if before :45)
function getNextBattleTime() {
  const now = new Date();
  const battle = new Date(now);
  battle.setMinutes(0, 0, 0);
  // If we're past :45, next battle is next hour
  if (now.getMinutes() >= 45) battle.setHours(battle.getHours() + 1);
  return battle;
}

async function runMatchmaking(io, battleTime) {
  const today = getTodayDate();
  const battleDate = battleTime.toISOString().split('T')[0];
  const battleTimeStr = battleTime.toISOString();
  logger.info(`Running matchmaking for battle at ${battleTimeStr}`);

  try {
    // Get all enrolled users for this battle slot
    const enrolled = await pool.query(
      `SELECT user_id FROM battle_enrollments
       WHERE battle_date=$1 AND status='enrolled'
       AND scheduled_battle_time=$2
       ORDER BY created_at`,
      [battleDate, battleTimeStr]
    );

    const users = enrolled.rows.map(r => r.user_id);
    if (users.length === 0) { logger.info('No enrollments for this slot'); return; }

    const pairs = [];
    for (let i = 0; i < users.length - 1; i += 2) pairs.push([users[i], users[i + 1]]);
    if (users.length % 2 === 1) pairs.push([users[users.length - 1], null]);

    for (const [p1, p2] of pairs) {
      const isBot = p2 === null;
      const result = await pool.query(
        `INSERT INTO battles (player1_id, player2_id, is_bot, status, battle_date, scheduled_at)
         VALUES ($1,$2,$3,'matched',$4,$5) RETURNING id`,
        [p1, isBot ? p1 : p2, isBot, battleDate, battleTimeStr]
      );
      if (result.rows.length) {
        await pool.query(
          `UPDATE battle_enrollments SET status='matched' WHERE user_id=ANY($1) AND battle_date=$2 AND scheduled_battle_time=$3`,
          [[p1, ...(isBot ? [] : [p2])], battleDate, battleTimeStr]
        );
        io?.to(`user:${p1}`).emit('battle_matched', { battleId: result.rows[0].id });
        if (!isBot) io?.to(`user:${p2}`).emit('battle_matched', { battleId: result.rows[0].id });
      }
    }
    io?.to('battles').emit('matchmaking_complete', { date: battleDate, pairs: pairs.length });
  } catch (err) {
    logger.error('Matchmaking error:', err);
  }
}

async function openLobby(io, battleTime) {
  const battleTimeStr = battleTime.toISOString();
  const updated = await pool.query(
    `UPDATE battles SET status='lobby' WHERE scheduled_at=$1 AND status='matched' RETURNING id, player1_id, player2_id, is_bot`,
    [battleTimeStr]
  );
  for (const b of updated.rows) {
    io?.to(`battle:${b.id}`).emit('battle_lobby_open', { battleId: b.id });
    io?.to(`user:${b.player1_id}`).emit('battle_lobby_open', { battleId: b.id });
    if (!b.is_bot) io?.to(`user:${b.player2_id}`).emit('battle_lobby_open', { battleId: b.id });
  }
  logger.info(`Opened lobby for ${updated.rowCount} battles at ${battleTimeStr}`);
}

async function startBattles(io, battleTime) {
  const battleTimeStr = battleTime.toISOString();
  const lobbies = await pool.query(
    `SELECT * FROM battles WHERE scheduled_at=$1 AND status='lobby'`, [battleTimeStr]
  );

  for (const b of lobbies.rows) {
    const difficulty = b.difficulty || b.player1_pref || 'Medium';
    const problem = await pool.query(
      `SELECT id FROM problems WHERE difficulty=$1 AND is_premium=FALSE ORDER BY RANDOM() LIMIT 1`,
      [difficulty]
    );
    if (!problem.rows.length) continue;
    const probId = problem.rows[0].id;
    await pool.query(
      `UPDATE battles SET status='active', problem_id=$1, difficulty=$2, started_at=NOW() WHERE id=$3`,
      [probId, difficulty, b.id]
    );
    await pool.query(`INSERT INTO battle_progress (battle_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [b.id, b.player1_id]);
    if (!b.is_bot) await pool.query(`INSERT INTO battle_progress (battle_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [b.id, b.player2_id]);

    io?.to(`battle:${b.id}`).emit('battle_start', { battleId: b.id, problemId: probId, difficulty });
    io?.to(`user:${b.player1_id}`).emit('battle_start', { battleId: b.id, problemId: probId });
    if (!b.is_bot && b.player2_id) io?.to(`user:${b.player2_id}`).emit('battle_start', { battleId: b.id, problemId: probId });

    if (b.is_bot) {
      const [min, max] = BOT_SOLVE_TIMES[difficulty] || BOT_SOLVE_TIMES.Medium;
      setTimeout(() => endBattle(io, b.id, null), randBetween(min, max) * 60000);
    }
    setTimeout(() => endBattle(io, b.id, null), 90 * 60 * 1000);
  }
  logger.info(`Started ${lobbies.rowCount} battles`);
}

async function endBattle(io, battleId, winnerId) {
  const battle = await pool.query(`SELECT * FROM battles WHERE id=$1 AND status='active'`, [battleId]);
  if (!battle.rows.length) return;
  const b = battle.rows[0];
  await pool.query(`UPDATE battles SET status='completed', winner_id=$1, ended_at=NOW() WHERE id=$2`, [winnerId, battleId]);
  if (winnerId) {
    await pool.query('UPDATE users SET battle_wins=battle_wins+1, points=points+50 WHERE id=$1', [winnerId]);
    const loserId = b.player1_id === winnerId ? b.player2_id : b.player1_id;
    if (loserId && !b.is_bot) await pool.query('UPDATE users SET battle_losses=battle_losses+1 WHERE id=$1', [loserId]);
  }
  io?.to(`battle:${battleId}`).emit('battle_end', { battleId, winnerId });
  io?.to(`user:${b.player1_id}`).emit('battle_end', { battleId, winnerId, won: b.player1_id === winnerId });
  if (!b.is_bot && b.player2_id) io?.to(`user:${b.player2_id}`).emit('battle_end', { battleId, winnerId, won: b.player2_id === winnerId });
}

function setupBattleScheduler(io) {
  // Battles every 30 mins: at :00 and :30
  // Matching: :55 and :25 (5 mins before)
  // Lobby: :58 and :28 (2 mins before)
  // Start: :00 and :30
  setInterval(async () => {
    const now = new Date();
    const m = now.getMinutes();

    const battleAt00 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const battleAt30 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 30, 0, 0);
    const nextHour00 = new Date(battleAt00.getTime() + 3600000);

    if (m === 25) await runMatchmaking(io, battleAt30);
    if (m === 28) await openLobby(io, battleAt30);
    if (m === 30) { await startBattles(io, battleAt30); io?.to('battles').emit('enrollment_open', { battleTime: nextHour00.toISOString() }); }
    if (m === 55) await runMatchmaking(io, nextHour00);
    if (m === 58) await openLobby(io, nextHour00);
    if (m === 0)  { await startBattles(io, battleAt00); io?.to('battles').emit('enrollment_open', { battleTime: battleAt30.toISOString() }); }

  }, 60000);

  logger.info('Battle scheduler: every 30 mins (:00 and :30) — match@:55/:25, lobby@:58/:28, start@:00/:30');
}

module.exports = { setupBattleScheduler, endBattle, runMatchmaking };
