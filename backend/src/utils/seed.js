require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'codearena',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const problems = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: 0 1

Example 2:
Input: nums = [3,2,4], target = 6
Output: 1 2

Constraints:
- 2 <= nums.length <= 10^4
- Each input has exactly one solution`,
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    test_cases: [
      { input: '4\n2 7 11 15\n9', expected_output: '0 1' },
      { input: '3\n3 2 4\n6', expected_output: '1 2' },
      { input: '2\n3 3\n6', expected_output: '0 1' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
  {
    title: 'Reverse a String',
    slug: 'reverse-string',
    description: `Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.

Example 1:
Input: hello
Output: olleh

Example 2:
Input: Hannah
Output: hannaH

Constraints:
- 1 <= s.length <= 10^5
- s[i] is a printable ASCII character`,
    difficulty: 'Easy',
    tags: ['String', 'Two Pointers'],
    test_cases: [
      { input: 'hello', expected_output: 'olleh' },
      { input: 'Hannah', expected_output: 'hannaH' },
      { input: 'abcde', expected_output: 'edcba' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating',
    description: `Given a string s, find the length of the longest substring without repeating characters.

Example 1:
Input: abcabcbb
Output: 3 (The answer is "abc")

Example 2:
Input: bbbbb
Output: 1 (The answer is "b")

Example 3:
Input: pwwkew
Output: 3 (The answer is "wke")

Constraints:
- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces`,
    difficulty: 'Medium',
    tags: ['String', 'Sliding Window', 'Hash Table'],
    test_cases: [
      { input: 'abcabcbb', expected_output: '3' },
      { input: 'bbbbb', expected_output: '1' },
      { input: 'pwwkew', expected_output: '3' },
      { input: '', expected_output: '0' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

Example 1:
Input: ()
Output: true

Example 2:
Input: ()[]{}
Output: true

Example 3:
Input: (]
Output: false`,
    difficulty: 'Easy',
    tags: ['Stack', 'String'],
    test_cases: [
      { input: '()', expected_output: 'true' },
      { input: '()[]{}', expected_output: 'true' },
      { input: '(]', expected_output: 'false' },
      { input: '([)]', expected_output: 'false' },
      { input: '{[]}', expected_output: 'true' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

Example 1:
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4

Example 2:
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1`,
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    test_cases: [
      { input: '6\n-1 0 3 5 9 12\n9', expected_output: '4' },
      { input: '6\n-1 0 3 5 9 12\n2', expected_output: '-1' },
      { input: '1\n5\n5', expected_output: '0' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    description: `You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. Return the head of the merged linked list.

For this problem, represent each linked list as space-separated integers, and output the merged sorted list.

Example 1:
Input:
1 2 4
1 3 4
Output: 1 1 2 3 4 4

Example 2:
Input:
(empty)
(empty)
Output: (empty)`,
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    test_cases: [
      { input: '1 2 4\n1 3 4', expected_output: '1 1 2 3 4 4' },
      { input: '\n', expected_output: '' },
      { input: '\n0', expected_output: '0' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.

Example 1:
Input: -2 1 -3 4 -1 2 1 -5 4
Output: 6 (subarray [4,-1,2,1])

Example 2:
Input: 1
Output: 1

Example 3:
Input: 5 4 -1 7 8
Output: 23

Constraints:
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4`,
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
    test_cases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expected_output: '6' },
      { input: '1', expected_output: '1' },
      { input: '5 4 -1 7 8', expected_output: '23' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    description: `You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

Example 1:
Input: 2
Output: 2
(1 step + 1 step, or 2 steps)

Example 2:
Input: 3
Output: 3
(1+1+1, 1+2, 2+1)

Constraints: 1 <= n <= 45`,
    difficulty: 'Easy',
    tags: ['Dynamic Programming', 'Math', 'Memoization'],
    test_cases: [
      { input: '2', expected_output: '2' },
      { input: '3', expected_output: '3' },
      { input: '10', expected_output: '89' },
      { input: '45', expected_output: '1836311903' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
];

async function seed() {
  console.log('Seeding database...');
  try {
    const adminHash = await bcrypt.hash('admin123', 12);
    const adminResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ('admin', 'admin@codearena.dev', $1, 'admin')
       ON CONFLICT (email) DO UPDATE SET role='admin' RETURNING id`,
      [adminHash]
    );
    const adminId = adminResult.rows[0].id;
    console.log(`Admin user: admin@codearena.dev / admin123`);

    for (const p of problems) {
      await pool.query(
        `INSERT INTO problems (title, slug, description, difficulty, tags, test_cases, time_limit, memory_limit, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (slug) DO NOTHING`,
        [p.title, p.slug, p.description, p.difficulty, p.tags, JSON.stringify(p.test_cases), p.time_limit, p.memory_limit, adminId]
      );
      console.log(`  ✓ ${p.title}`);
    }

    console.log('\n✅ Seed complete!');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
