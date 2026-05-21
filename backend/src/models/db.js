const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'codearena',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        role VARCHAR(20) DEFAULT 'user',
        total_solved INTEGER DEFAULT 0,
        total_submissions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS problems (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
        tags TEXT[],
        test_cases JSONB NOT NULL,
        time_limit INTEGER DEFAULT 2000,
        memory_limit INTEGER DEFAULT 256,
        accepted_count INTEGER DEFAULT 0,
        submission_count INTEGER DEFAULT 0,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
        contest_id UUID,
        language VARCHAR(20) NOT NULL,
        code TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        runtime INTEGER,
        memory_used INTEGER,
        error_message TEXT,
        test_results JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        problems UUID[],
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
      CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
    `);
    logger.info('Database initialized successfully');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
