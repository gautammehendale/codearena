const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');
const { getRedis } = require('../services/redis');
const logger = require('../utils/logger');

const router = express.Router();

const MAX_HINTS = 3;

// Predefined hints for seeded problems as fallback
const PREDEFINED_HINTS = {
  'two-sum': [
    'Think about what information you need to store as you traverse the array. For each number, what would you need to find its complement?',
    'A hash map can store each number\'s index as you iterate. For each element, check if its complement (target - current) already exists in the map.',
    'Logic: Iterate once. For each nums[i], compute complement = target - nums[i]. If complement is in your map, return [map[complement], i]. Else store nums[i] → i.',
  ],
  'reverse-string': [
    'You don\'t need extra space. Think about swapping characters from both ends simultaneously.',
    'Use two pointers — one starting at index 0, one at the last index. Swap them, then move both pointers toward the center.',
    'Logic: While left < right, swap s[left] and s[right], then left++ and right--.',
  ],
  'longest-substring-without-repeating': [
    'Think about maintaining a "window" of valid characters as you scan the string. What happens when you find a repeated character?',
    'Use a sliding window with a set/map. Expand the right boundary; when a duplicate is found, shrink from the left until the duplicate is removed.',
    'Logic: Use a map storing char → last seen index. For each char at i, if it\'s in the map and its index >= window start, move window start to map[char]+1. Track max window size.',
  ],
  'valid-parentheses': [
    'Think about the last opened bracket needing to be closed first — which data structure follows this "last in, first out" pattern?',
    'Use a stack. Push every opening bracket. When you see a closing bracket, check if the top of the stack is its matching opener.',
    'Logic: For each char — if it\'s (, [, or {, push it. If it\'s ), ], or }, the stack top must be the matching opener, else return false. At the end, stack must be empty.',
  ],
  'binary-search': [
    'Since the array is sorted, you can eliminate half the search space with each comparison. What do you compare to decide which half to keep?',
    'Maintain left and right pointers. Calculate mid = (left + right) / 2. Compare nums[mid] to target and eliminate one half.',
    'Logic: While left <= right: mid = (left+right)//2. If nums[mid]==target return mid. If nums[mid]<target set left=mid+1, else set right=mid-1. Return -1 if not found.',
  ],
  'maximum-subarray': [
    'Think about whether extending the current subarray or starting fresh gives a better sum at each position.',
    'Kadane\'s algorithm: Keep track of the current subarray sum. If adding the next element increases it, extend; if not, start a new subarray from that element.',
    'Logic: currentSum = nums[0], maxSum = nums[0]. For each num from index 1: currentSum = max(num, currentSum + num). maxSum = max(maxSum, currentSum).',
  ],
  'climbing-stairs': [
    'Think recursively — to reach step n, you can come from step n-1 or step n-2. How many ways to reach n-1 and n-2?',
    'This follows the Fibonacci pattern. The number of ways to reach step n equals ways(n-1) + ways(n-2). Use dynamic programming to avoid recalculation.',
    'Logic: dp[1]=1, dp[2]=2. For i from 3 to n: dp[i] = dp[i-1] + dp[i-2]. You only need the last two values, so use two variables instead of an array.',
  ],
};

async function generateAIHint(problem, code, hintNumber, language) {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const hintInstructions = [
      'Give a very high-level conceptual hint only. No code, no algorithm names. Just a guiding question or observation.',
      'Give a more specific hint about the data structure or approach to use. No code, but you can name the technique.',
      'Explain the core logic clearly step by step in plain English. Absolutely no code — logic only.',
    ];

    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a coding mentor. Guide students with hints only — never give the full solution or actual code. Be concise (2-3 sentences max).',
        },
        {
          role: 'user',
          content: `Problem: ${problem.title}\n\nDescription: ${problem.description.slice(0, 500)}\n\nStudent's ${language} code so far:\n${(code || '(none yet)').slice(0, 300)}\n\nHint ${hintNumber}/3: ${hintInstructions[hintNumber - 1]}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return res.choices[0].message.content;
  } catch (err) {
    logger.error('Groq hint error:', err.message);
    return null;
  }
}

router.post('/', authenticate, [
  body('problemId').isUUID(),
  body('code').optional().isString(),
  body('language').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { problemId, code, language } = req.body;
  const userId = req.user.id;
  const redis = getRedis();

  try {
    const problem = await pool.query('SELECT id, title, slug, description FROM problems WHERE id=$1', [problemId]);
    if (!problem.rows.length) return res.status(404).json({ error: 'Problem not found' });

    const prob = problem.rows[0];
    const hintKey = `hints:${userId}:${problemId}`;
    const hintCount = parseInt(await redis.get(hintKey) || '0');

    if (hintCount >= MAX_HINTS) {
      return res.status(429).json({
        error: 'No more hints available',
        message: 'You have used all 3 hints for this problem.',
        hintsUsed: MAX_HINTS,
        maxHints: MAX_HINTS,
      });
    }

    const nextHint = hintCount + 1;

    // Try AI first, fall back to predefined
    let hint = await generateAIHint(prob, code, nextHint, language);
    if (!hint) {
      const predefined = PREDEFINED_HINTS[prob.slug];
      hint = predefined?.[nextHint - 1] || `Think carefully about the problem constraints and what data structures might help you solve it efficiently for hint ${nextHint}.`;
    }

    await redis.setex(hintKey, 86400 * 7, nextHint); // expires in 7 days

    res.json({
      hint,
      hintNumber: nextHint,
      hintsRemaining: MAX_HINTS - nextHint,
      maxHints: MAX_HINTS,
    });
  } catch (err) {
    logger.error('Hint error:', err);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

router.get('/status/:problemId', authenticate, async (req, res) => {
  const redis = getRedis();
  const hintKey = `hints:${req.user.id}:${req.params.problemId}`;
  const hintsUsed = parseInt(await redis.get(hintKey) || '0');
  res.json({ hintsUsed, hintsRemaining: MAX_HINTS - hintsUsed, maxHints: MAX_HINTS });
});

module.exports = router;
