const { pool } = require('./db');
const logger = require('../utils/logger');

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS premium_points_required INTEGER DEFAULT 0;
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS first_solved_by UUID REFERENCES users(id);
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS first_solved_at TIMESTAMP;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_solved_date DATE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS battle_wins INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS battle_losses INTEGER DEFAULT 0;

      ALTER TABLE battle_enrollments ADD COLUMN IF NOT EXISTS scheduled_battle_time TIMESTAMP;
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_battle_exclusive BOOLEAN DEFAULT FALSE;
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS battle_revealed_at TIMESTAMP;

      CREATE TABLE IF NOT EXISTS battle_enrollments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        battle_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'enrolled',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, battle_date)
      );

      CREATE TABLE IF NOT EXISTS battles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player1_id UUID REFERENCES users(id),
        player2_id UUID REFERENCES users(id),
        is_bot BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'lobby',
        difficulty VARCHAR(10),
        problem_id UUID REFERENCES problems(id),
        player1_pref VARCHAR(10),
        player2_pref VARCHAR(10),
        winner_id UUID REFERENCES users(id),
        battle_date DATE NOT NULL,
        scheduled_at TIMESTAMP NOT NULL,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS battle_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        tests_passed INTEGER DEFAULT 0,
        total_tests INTEGER DEFAULT 0,
        solved BOOLEAN DEFAULT FALSE,
        solved_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        badge_type VARCHAR(50) NOT NULL,
        metadata JSONB DEFAULT '{}',
        earned_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contest_chat (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR(100) NOT NULL,
        user_id UUID REFERENCES users(id),
        username VARCHAR(50),
        message TEXT NOT NULL,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_battle_enrollments_date ON battle_enrollments(battle_date);
      CREATE INDEX IF NOT EXISTS idx_battles_date ON battles(battle_date);
      CREATE INDEX IF NOT EXISTS idx_battle_progress_battle ON battle_progress(battle_id);
      CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_room ON contest_chat(room_id);
    `);
    logger.info('Migrations completed');
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
