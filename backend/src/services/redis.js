const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis;

async function initRedis() {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.error('Redis error:', err));
  return redis;
}

function getRedis() { return redis; }

// Leaderboard using Redis sorted sets
async function updateLeaderboard(userId, username, points) {
  await redis.zadd('leaderboard:global', points, userId);
  await redis.hset(`user:${userId}:info`, 'username', username);
}

async function getLeaderboard(start = 0, end = 49) {
  const entries = await redis.zrevrange('leaderboard:global', start, end, 'WITHSCORES');
  const result = [];
  for (let i = 0; i < entries.length; i += 2) {
    const userId = entries[i];
    const score = parseInt(entries[i + 1]);
    const username = await redis.hget(`user:${userId}:info`, 'username');
    const rank = await redis.zrevrank('leaderboard:global', userId);
    result.push({ userId, username, score, rank: rank + 1 });
  }
  return result;
}

async function getUserRank(userId) {
  const rank = await redis.zrevrank('leaderboard:global', userId);
  const score = await redis.zscore('leaderboard:global', userId);
  return { rank: rank !== null ? rank + 1 : null, score: parseInt(score) || 0 };
}

async function cacheSet(key, value, ttl = 300) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

async function cacheGet(key) {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

async function cacheDel(key) {
  await redis.del(key);
}

module.exports = { initRedis, getRedis, updateLeaderboard, getLeaderboard, getUserRank, cacheSet, cacheGet, cacheDel };
