const Groq = require('groq-sdk');
const { pool } = require('../models/db');
const logger = require('../utils/logger');

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Topics to rotate through for variety
const TOPIC_POOLS = {
  Easy: [
    'Array manipulation and counting',
    'String reversal and palindromes',
    'Math and number patterns',
    'Simple sorting and searching',
    'Basic bit manipulation',
    'Stack and queue operations',
  ],
  Medium: [
    'Sliding window on arrays',
    'Two pointers on sorted arrays',
    'Dynamic programming with 1D DP',
    'Binary search variations',
    'Hash map frequency counting',
    'Graph BFS traversal',
    'Matrix operations',
    'Prefix sums',
  ],
  Hard: [
    'Dynamic programming with 2D DP',
    'Graph DFS with backtracking',
    'Segment tree or BIT applications',
    'Advanced binary search',
    'Monotonic stack problems',
    'Interval scheduling and merging',
  ],
};

const PROMPT = (difficulty, topic) => `You are a competitive programming problem author. Create a unique, original problem for a 1v1 coding battle.

Requirements:
- Difficulty: ${difficulty}
- Topic: ${topic}
- Must be solvable with Python, JavaScript, Java, or C++
- Input from stdin (space-separated or newline-separated as appropriate)
- Output to stdout
- Include a clear ASCII art visual diagram showing HOW the algorithm works step by step
- NO external libraries needed

IMPORTANT: You must verify your test cases manually before including them.

Return ONLY valid JSON (no markdown, no code blocks) in this EXACT format:
{
  "title": "Catchy Problem Title",
  "tags": ["Tag1", "Tag2"],
  "description": "2-3 sentence problem statement.\\n\\n──────────────────────────────────────\\nVISUAL EXAMPLE\\n\\n  [ASCII diagram showing the algorithm step by step, at least 10 lines]\\n──────────────────────────────────────\\n\\nInput Format:\\n[clear description]\\n\\nExample 1:\\nInput: [exact input]\\nOutput: [exact output]\\nExplanation: [why]\\n\\nExample 2:\\nInput: [exact input]\\nOutput: [exact output]\\n\\nConstraints:\\n- [constraint 1]\\n- [constraint 2]\\n\\nFollow-up: [harder version question]",
  "test_cases": [
    {"input": "exact stdin input here", "expected_output": "exact stdout output"},
    {"input": "exact stdin input 2", "expected_output": "exact stdout output 2"},
    {"input": "exact stdin input 3", "expected_output": "exact stdout output 3"}
  ]
}`;

async function generateBattleProblem(difficulty = 'Medium') {
  if (!process.env.GROQ_API_KEY) {
    logger.warn('GROQ_API_KEY not set, skipping AI problem generation');
    return null;
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const topics = TOPIC_POOLS[difficulty] || TOPIC_POOLS.Medium;
  const topic = topics[Math.floor(Math.random() * topics.length)];

  logger.info(`Generating ${difficulty} battle problem on: ${topic}`);

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: PROMPT(difficulty, topic) }],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const raw = res.choices[0].message.content;
    const data = JSON.parse(raw);

    if (!data.title || !data.description || !data.test_cases?.length) {
      logger.error('Generated problem missing required fields');
      return null;
    }

    // Sanitize slug
    const slug = `battle-ai-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;

    // Check we don't already have a problem with this title
    const existing = await pool.query('SELECT id FROM problems WHERE title=$1', [data.title]);
    if (existing.rows.length) {
      logger.info(`Problem "${data.title}" already exists, generating different slug`);
    }

    const admin = await pool.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
    const adminId = admin.rows[0]?.id;

    const result = await pool.query(
      `INSERT INTO problems (title, slug, description, difficulty, tags, test_cases, time_limit, memory_limit, created_by, is_battle_exclusive)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE) RETURNING id, title`,
      [
        data.title,
        slug,
        data.description,
        difficulty,
        data.tags || [topic],
        JSON.stringify(data.test_cases),
        2000,
        256,
        adminId,
      ]
    );

    logger.info(`✅ AI generated battle problem: "${data.title}" (${difficulty})`);
    return result.rows[0];
  } catch (err) {
    logger.error('Problem generation failed:', err.message);
    return null;
  }
}

// Generate problems to maintain a minimum pool of battle-exclusive problems
async function maintainBattlePool(targetCount = 10) {
  try {
    const current = await pool.query(
      `SELECT COUNT(*) FROM problems WHERE is_battle_exclusive=TRUE AND battle_revealed_at IS NULL`
    );
    const available = parseInt(current.rows[0].count);

    if (available >= targetCount) {
      logger.info(`Battle pool has ${available} problems, no generation needed`);
      return;
    }

    const needed = targetCount - available;
    logger.info(`Battle pool low (${available}), generating ${needed} new problems...`);

    // Generate mix of difficulties
    const diffs = [];
    for (let i = 0; i < needed; i++) {
      diffs.push(DIFFICULTIES[i % DIFFICULTIES.length]);
    }

    for (const diff of diffs) {
      const result = await generateBattleProblem(diff);
      if (result) logger.info(`  + Generated: ${result.title}`);
      // Small delay between API calls
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (err) {
    logger.error('maintainBattlePool error:', err.message);
  }
}

module.exports = { generateBattleProblem, maintainBattlePool };
