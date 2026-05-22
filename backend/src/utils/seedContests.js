require('dotenv').config();
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({ host: 'localhost', port: 5433, database: 'codearena', user: 'postgres', password: 'postgres' });

async function seedContests() {
  const admin = await pool.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
  const adminId = admin.rows[0]?.id;
  if (!adminId) { console.log('No admin found'); return; }

  // Get some problem IDs
  const easy = await pool.query(`SELECT id FROM problems WHERE difficulty='Easy' LIMIT 3`);
  const medium = await pool.query(`SELECT id FROM problems WHERE difficulty='Medium' LIMIT 2`);
  const hard = await pool.query(`SELECT id FROM problems WHERE difficulty='Hard' LIMIT 1`);

  const easyIds = easy.rows.map(r => r.id);
  const mediumIds = medium.rows.map(r => r.id);
  const hardIds = hard.rows.map(r => r.id);

  const now = new Date();

  const contests = [
    {
      title: 'Weekly Beginner Contest #1',
      description: 'Perfect for newcomers! 3 Easy problems in 90 minutes. Climb the leaderboard and earn your first badge.',
      start: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      end: new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
      problems: easyIds,
    },
    {
      title: 'CodeArena Monthly Challenge',
      description: 'A mix of Easy, Medium and Hard problems. Top 3 earn exclusive badges and leaderboard points.',
      start: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
      end: new Date(now.getTime() + 26 * 60 * 60 * 1000),
      problems: [...easyIds.slice(0, 2), ...mediumIds.slice(0, 2), ...hardIds.slice(0, 1)],
    },
    {
      title: 'Speed Round — Arrays & Strings',
      description: 'Fast-paced 45-minute contest focused on Array and String problems. Speed matters — solve faster to earn more points.',
      start: new Date(now.getTime() + 48 * 60 * 60 * 1000), // day after tomorrow
      end: new Date(now.getTime() + 48.75 * 60 * 60 * 1000),
      problems: [...easyIds.slice(0, 1), ...mediumIds.slice(0, 1)],
    },
    {
      title: 'Algorithm Masters Cup',
      description: 'Hard problems only. For experienced coders looking to challenge themselves. 2-hour battle of wits.',
      start: new Date(now.getTime() + 72 * 60 * 60 * 1000), // 3 days from now
      end: new Date(now.getTime() + 74 * 60 * 60 * 1000),
      problems: [...mediumIds, ...hardIds],
    },
  ];

  for (const c of contests) {
    await pool.query(
      `INSERT INTO contests (title, description, start_time, end_time, problems, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
      [c.title, c.description, c.start, c.end, c.problems, adminId]
    );
    console.log(`  ✓ ${c.title}`);
  }

  console.log('\n✅ Contests seeded!');
  await pool.end();
}

seedContests().catch(console.error);
