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
        if (existing.rows.length === 0) {
          await pool.query(`UPDATE users SET total_solved=total_solved+1 WHERE id=$1`, [userId]);
          const userRes = await pool.query(`SELECT username, total_solved FROM users WHERE id=$1`, [userId]);
          if (userRes.rows[0]) {
            await updateLeaderboard(userId, userRes.rows[0].username, userRes.rows[0].total_solved * 10);
          }
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
