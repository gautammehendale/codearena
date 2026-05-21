const Bull = require('bull');
const { runCode } = require('./judge');
const { pool } = require('../models/db');
const { updateLeaderboard, cacheDel } = require('./redis');
const logger = require('../utils/logger');

let submissionQueue;

async function initQueue(io) {
  submissionQueue = new Bull('submissions', {
    redis: { host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379 }
  });

  submissionQueue.process(3, async (job) => {
    const { submissionId, code, language, testCases, timeLimit, memoryLimit, userId, problemId } = job.data;
    logger.info(`Processing submission ${submissionId}`);

    try {
      const results = await runCode(code, language, testCases, timeLimit, memoryLimit);
      const allPassed = results.every(r => r.passed);
      const status = allPassed ? 'Accepted' : results.find(r => r.status !== 'passed')?.status || 'Wrong Answer';
      const runtime = Math.max(...results.map(r => r.runtime || 0));
      const memoryUsed = Math.max(...results.map(r => r.memory || 0));

      await pool.query(
        `UPDATE submissions SET status=$1, runtime=$2, memory_used=$3, test_results=$4 WHERE id=$5`,
        [status, runtime, memoryUsed, JSON.stringify(results), submissionId]
      );

      if (allPassed) {
        const existing = await pool.query(
          `SELECT id FROM submissions WHERE user_id=$1 AND problem_id=$2 AND status='Accepted' AND id!=$3`,
          [userId, problemId, submissionId]
        );
        const isFirstSolveByUser = existing.rows.length === 0;

        if (isFirstSolveByUser) {
          await pool.query(`UPDATE users SET total_solved=total_solved+1, points=points+20 WHERE id=$1`, [userId]);
          const userRes = await pool.query(`SELECT username, total_solved FROM users WHERE id=$1`, [userId]);
          if (userRes.rows[0]) {
            await updateLeaderboard(userId, userRes.rows[0].username, userRes.rows[0].total_solved * 10);
          }

          // First Blood Badge — first person EVER to solve this problem
          const prob = await pool.query('SELECT first_solved_by FROM problems WHERE id=$1', [problemId]);
          if (prob.rows[0] && !prob.rows[0].first_solved_by) {
            await pool.query(
              `UPDATE problems SET first_solved_by=$1, first_solved_at=NOW() WHERE id=$2 AND first_solved_by IS NULL`,
              [userId, problemId]
            );
            const wasFirst = await pool.query('SELECT first_solved_by FROM problems WHERE id=$1', [problemId]);
            if (wasFirst.rows[0]?.first_solved_by === userId) {
              await pool.query(
                `INSERT INTO user_badges (user_id, badge_type, metadata) VALUES ($1, 'first_blood', $2)`,
                [userId, JSON.stringify({ problem_id: problemId })]
              );
              await pool.query('UPDATE users SET points=points+100 WHERE id=$1', [userId]);
              io.to(`user:${userId}`).emit('badge_earned', { badge: 'first_blood', problemId, bonus: 100 });
              logger.info(`First Blood badge awarded to ${userId} for problem ${problemId}`);
            }
          }

          // Update streak
          const today = new Date().toISOString().split('T')[0];
          const userStreak = await pool.query('SELECT streak, last_solved_date FROM users WHERE id=$1', [userId]);
          const u = userStreak.rows[0];
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const yd = yesterday.toISOString().split('T')[0];
          const newStreak = u.last_solved_date === yd ? u.streak + 1 : 1;
          await pool.query('UPDATE users SET streak=$1, last_solved_date=$2 WHERE id=$3', [newStreak, today, userId]);
          if ([7, 30, 100].includes(newStreak)) {
            const bonus = newStreak === 7 ? 50 : newStreak === 30 ? 150 : 500;
            await pool.query(`INSERT INTO user_badges (user_id, badge_type, metadata) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
              [userId, `streak_${newStreak}`, JSON.stringify({ days: newStreak })]);
            await pool.query('UPDATE users SET points=points+$1 WHERE id=$2', [bonus, userId]);
            io.to(`user:${userId}`).emit('badge_earned', { badge: `streak_${newStreak}`, days: newStreak, bonus });
          }
        }

        // Update battle progress if in active battle
        const today2 = new Date().toISOString().split('T')[0];
        const activeBattle = await pool.query(
          `SELECT b.* FROM battles b
           WHERE (b.player1_id=$1 OR b.player2_id=$1) AND b.battle_date=$2 AND b.status='active' AND b.problem_id=$3 LIMIT 1`,
          [userId, today2, problemId]
        );
        if (activeBattle.rows.length) {
          const battle = activeBattle.rows[0];
          await pool.query(
            `UPDATE battle_progress SET tests_passed=$1, total_tests=$2, solved=true, solved_at=NOW(), updated_at=NOW()
             WHERE battle_id=$3 AND user_id=$4`,
            [results.length, results.length, battle.id, userId]
          );
          const opponentId = battle.player1_id === userId ? battle.player2_id : battle.player1_id;
          io.to(`battle:${battle.id}`).emit('battle_progress', { userId, testsPassed: results.length, totalTests: results.length, solved: true });

          // End battle — this user wins
          const { endBattle } = require('./battleScheduler');
          await endBattle(io, battle.id, userId);
        }
      }

      // Update battle progress (partial) even if not all passed
      const testsPassed = results.filter(r => r.passed).length;
      if (!allPassed && testsPassed > 0) {
        const today3 = new Date().toISOString().split('T')[0];
        const ab = await pool.query(
          `SELECT id FROM battles WHERE (player1_id=$1 OR player2_id=$1) AND battle_date=$2 AND status='active' AND problem_id=$3 LIMIT 1`,
          [userId, today3, problemId]
        );
        if (ab.rows.length) {
          await pool.query(
            `UPDATE battle_progress SET tests_passed=$1, total_tests=$2, updated_at=NOW() WHERE battle_id=$3 AND user_id=$4`,
            [testsPassed, results.length, ab.rows[0].id, userId]
          );
          io.to(`battle:${ab.rows[0].id}`).emit('battle_progress', { userId, testsPassed, totalTests: results.length, solved: false });
        }
      }

      await pool.query(`UPDATE users SET total_submissions=total_submissions+1 WHERE id=$1`, [userId]);
      await pool.query(`UPDATE problems SET submission_count=submission_count+1${allPassed ? ', accepted_count=accepted_count+1' : ''} WHERE id=$1`, [problemId]);
      await cacheDel(`problem:${problemId}`);

      io.to(`submission:${submissionId}`).emit('submission_update', { submissionId, status, runtime, memoryUsed, testResults: results });
      io.to(`user:${userId}`).emit('submission_result', { submissionId, status, problemId });

      return { status, runtime, memoryUsed };
    } catch (err) {
      logger.error(`Judge error for ${submissionId}:`, err);
      await pool.query(`UPDATE submissions SET status='System Error', error_message=$1 WHERE id=$2`, [err.message, submissionId]);
      io.to(`submission:${submissionId}`).emit('submission_update', { submissionId, status: 'System Error' });
      throw err;
    }
  });

  submissionQueue.on('failed', (job, err) => logger.error(`Job ${job.id} failed:`, err));
  logger.info('Submission queue initialized');
}

async function addSubmission(data) {
  return submissionQueue.add(data, { attempts: 2, backoff: { type: 'fixed', delay: 2000 } });
}

module.exports = { initQueue, addSubmission };
