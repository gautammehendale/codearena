require('dotenv').config();
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({ host: 'localhost', port: 5433, database: 'codearena', user: 'postgres', password: 'postgres' });

const BATTLE_PROBLEMS = [
  {
    title: 'Rain Collector',
    slug: 'rain-collector',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Stack'],
    description: `You have a row of buildings with heights given in an array. After heavy rain, water collects in the valleys between taller buildings. Calculate total water collected.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [3, 0, 2, 0, 4]

  Buildings look like:
       █
  █    █
  █  █ █
  █  █ █
  ─────────
  3  0  2  0  4

  Water fills like:
       █
  █~~~~█
  █~~█~█
  █~~█~█
  ─────────
  Water at index 1: min(3,4)-0 = 3
  Water at index 2: min(3,4)-2 = 1
  Water at index 3: min(3,4)-0 = 3
  Total = 7

  KEY INSIGHT:
  Water at position i = min(tallest_left, tallest_right) - height[i]
  If this value is negative, no water collects (position is too tall).
──────────────────────────────────────

Input: space-separated heights

Example 1:
Input: 3 0 2 0 4
Output: 7

Example 2:
Input: 0 1 0 2 1 0 1 3 2 1 2 1
Output: 6

Example 3:
Input: 4 2 3
Output: 1

Constraints:
- 1 <= heights.length <= 2 * 10^4
- 0 <= heights[i] <= 10^5

Follow-up: Can you solve it in O(n) time and O(1) space?`,
    test_cases: [
      { input: '3 0 2 0 4', expected_output: '7' },
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expected_output: '6' },
      { input: '4 2 3', expected_output: '1' },
    ],
  },
  {
    title: 'Matrix Diagonal Sum',
    slug: 'matrix-diagonal-sum-battle',
    difficulty: 'Easy',
    tags: ['Array', 'Matrix'],
    description: `Given a square n × n matrix, return the sum of all elements on the primary diagonal and secondary diagonal. If the center element is counted twice (odd n), count it only once.

──────────────────────────────────────
VISUAL EXAMPLE  (n = 3)

  ┌───┬───┬───┐
  │ 1*│ 2 │ 3*│   * = primary diagonal
  ├───┼───┼───┤   + = secondary diagonal
  │ 4 │ 5*│ 6 │   5 is in both (center!)
  ├───┼───┼───┤
  │ 7*│ 8 │ 9*│
  └───┴───┴───┘

  Primary:   1 + 5 + 9 = 15
  Secondary: 3 + 5 + 7 = 15
  Combined (no double-count): 1+5+9+3+7 = 25

  For even n (n=4): no shared center element
  ┌───┬───┬───┬───┐
  │ 1*│ 2 │ 3 │ 4+│
  ├───┼───┼───┼───┤
  │ 5 │ 6*│ 7+│ 8 │
  ├───┼───┼───┼───┤
  │ 9 │10+│11*│12 │
  ├───┼───┼───┼───┤
  │13+│14 │15 │16*│
  └───┴───┴───┴───┘
  Primary:   1+6+11+16=34
  Secondary: 4+7+10+13=34  Total = 68
──────────────────────────────────────

Input: first line is n, then n lines each with n space-separated integers

Example 1:
Input:
3
1 2 3
4 5 6
7 8 9
Output: 25

Example 2:
Input:
4
1 2 3 4
5 6 7 8
9 10 11 12
13 14 15 16
Output: 68

Constraints:
- 1 <= n <= 100
- 1 <= matrix[i][j] <= 100`,
    test_cases: [
      { input: '3\n1 2 3\n4 5 6\n7 8 9', expected_output: '25' },
      { input: '4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16', expected_output: '68' },
      { input: '1\n7', expected_output: '7' },
    ],
  },
  {
    title: 'Decode XOR Array',
    slug: 'decode-xor-array',
    difficulty: 'Easy',
    tags: ['Array', 'Bit Manipulation'],
    description: `There is a hidden integer array arr of length n. It was encoded into another array encoded of length n-1 where encoded[i] = arr[i] XOR arr[i+1]. You are given encoded and the first element of arr (first). Reconstruct the original arr.

──────────────────────────────────────
VISUAL EXAMPLE

  encoded = [1, 2, 3],  first = 1

  XOR PROPERTY: If A XOR B = C, then C XOR B = A

  arr[0] = first = 1
  arr[1] = encoded[0] XOR arr[0] = 1 XOR 1 = 0
  arr[2] = encoded[1] XOR arr[1] = 2 XOR 0 = 2
  arr[3] = encoded[2] XOR arr[2] = 3 XOR 2 = 1

  Result: [1, 0, 2, 1]

  VERIFICATION:
  1 XOR 0 = 1 ✓  (encoded[0])
  0 XOR 2 = 2 ✓  (encoded[1])
  2 XOR 1 = 3 ✓  (encoded[2])
──────────────────────────────────────

Input: first line is first, second line is encoded array (space-separated)
Output: original array space-separated

Example 1:
Input:
1
1 2 3
Output: 1 0 2 1

Example 2:
Input:
4
6 2 7 3
Output: 4 2 0 7 4

Constraints:
- 2 <= n <= 10^4
- 0 <= encoded[i] <= 10^5
- 0 <= first <= 10^5`,
    test_cases: [
      { input: '1\n1 2 3', expected_output: '1 0 2 1' },
      { input: '4\n6 2 7 3', expected_output: '4 2 0 7 4' },
    ],
  },
  {
    title: 'Lucky Numbers in Matrix',
    slug: 'lucky-numbers-matrix',
    difficulty: 'Medium',
    tags: ['Array', 'Matrix'],
    description: `A lucky number in a matrix is an element that is the minimum of its row and the maximum of its column. Find all lucky numbers and print them in sorted order, one per line.

──────────────────────────────────────
VISUAL EXAMPLE

  Matrix:
  ┌───┬───┬───┐
  │ 3 │ 7 │ 8 │  Row 0 min = 3
  ├───┼───┼───┤
  │ 9 │ 11│ 13│  Row 1 min = 9
  ├───┼───┼───┤
  │15 │ 16│ 17│  Row 2 min = 15
  └───┴───┴───┘
   ↑        ↑
   Col0 max Col2 max
   = 15     = 17

  Col max: [15, 16, 17]

  Check each row min:
  Row 0 min = 3: Is 3 the max of its column (col 0)?
    Col 0 = [3,9,15], max = 15. 3 ≠ 15. ✗

  Row 1 min = 9: Is 9 the max of its column (col 0)?
    Col 0 max = 15. 9 ≠ 15. ✗

  Row 2 min = 15: Is 15 the max of its column (col 0)?
    Col 0 max = 15. 15 = 15. ✓ Lucky!

  Answer: 15
──────────────────────────────────────

Input: first line m n, then m rows

Example 1:
Input:
3 3
3 7 8
9 11 13
15 16 17
Output: 15

Example 2:
Input:
2 3
1 10 4
1 4 10
Output:
1
10

Constraints:
- 1 <= m, n <= 50
- 1 <= matrix[i][j] <= 10^5
- All elements are distinct`,
    test_cases: [
      { input: '3 3\n3 7 8\n9 11 13\n15 16 17', expected_output: '15' },
      { input: '2 3\n1 10 4\n1 4 10', expected_output: '1\n10' },
      { input: '1 1\n7', expected_output: '7' },
    ],
  },
  {
    title: 'Zigzag Iterator',
    slug: 'zigzag-iterator',
    difficulty: 'Medium',
    tags: ['Array', 'Design', 'Queue'],
    description: `Given two arrays, create a zigzag merged array by alternating elements from each. Start with the first element of array 1, then first of array 2, then second of array 1, etc. If one array runs out, append remaining from the other.

──────────────────────────────────────
VISUAL EXAMPLE

  v1 = [1, 2]    v2 = [3, 4, 5, 6]

  Zigzag process:
  Step 1: Take v1[0] = 1    result: [1]
  Step 2: Take v2[0] = 3    result: [1, 3]
  Step 3: Take v1[1] = 2    result: [1, 3, 2]
  Step 4: Take v2[1] = 4    result: [1, 3, 2, 4]
  Step 5: v1 exhausted!
  Step 6: Append rest of v2: [5, 6]

  Final: [1, 3, 2, 4, 5, 6]

  ┌─────────┐   ┌─────────────┐
  │ v1: 1 2 │   │ v2: 3 4 5 6│
  └─────────┘   └─────────────┘
       ↓↕↓↕↓↕↓↕  (zigzag)
  [1, 3, 2, 4, 5, 6]
──────────────────────────────────────

Input: first line is v1 (space-separated), second line is v2

Example 1:
Input:
1 2
3 4 5 6
Output: 1 3 2 4 5 6

Example 2:
Input:
1 3 5 7
2 4
Output: 1 2 3 4 5 7

Example 3:
Input:
1
2 3 4
Output: 1 2 3 4

Constraints:
- 0 <= v1.length, v2.length <= 10^4
- -10^5 <= values <= 10^5`,
    test_cases: [
      { input: '1 2\n3 4 5 6', expected_output: '1 3 2 4 5 6' },
      { input: '1 3 5 7\n2 4', expected_output: '1 2 3 4 5 7' },
      { input: '1\n2 3 4', expected_output: '1 2 3 4' },
    ],
  },
  {
    title: 'Shortest Path in Binary Matrix',
    slug: 'shortest-path-binary-matrix',
    difficulty: 'Medium',
    tags: ['Array', 'Breadth-First Search', 'Matrix'],
    description: `Given an n × n binary matrix, find the length of the shortest clear path from top-left (0,0) to bottom-right (n-1, n-1). A clear path uses only cells with value 0, moving in 8 directions. Return -1 if no path exists.

──────────────────────────────────────
VISUAL EXAMPLE

  Grid (0=clear, 1=blocked):
  ┌───┬───┬───┐
  │ 0 │ 1 │ 0 │  (0,0)=start ●
  ├───┼───┼───┤
  │ 0 │ 0 │ 1 │
  ├───┼───┼───┤
  │ 1 │ 0 │ 0 │  (2,2)=end ●
  └───┴───┴───┘

  Path (8-directional movement allowed):
  (0,0) → (1,0) → (1,1) → (2,2)
    ●         ●        ●       ●
  Length = 4 cells

  Why length 4? Each cell in path counts as 1.
  Start cell + 2 intermediate + end cell = 4.

  BFS explores in waves of equal distance.
  Wave 1: (0,0)
  Wave 2: (1,0), (0,2) unreachable via 0s
  Wave 3: (1,1)
  Wave 4: (2,2) ← found!
──────────────────────────────────────

Input: first line n, then n lines of n space-separated 0s and 1s

Example 1:
Input:
3
0 1 0
0 0 1
1 0 0
Output: 4

Example 2:
Input:
2
0 1
1 0
Output: -1

Example 3:
Input:
1
0
Output: 1

Constraints:
- n == grid.length == grid[i].length
- 1 <= n <= 100
- grid[i][j] is 0 or 1`,
    test_cases: [
      { input: '3\n0 1 0\n0 0 1\n1 0 0', expected_output: '4' },
      { input: '2\n0 1\n1 0', expected_output: '-1' },
      { input: '1\n0', expected_output: '1' },
      { input: '2\n0 0\n0 0', expected_output: '2' },
    ],
  },
  {
    title: 'Count Subarrays With Fixed Bounds',
    slug: 'count-subarrays-fixed-bounds',
    difficulty: 'Hard',
    tags: ['Array', 'Sliding Window', 'Two Pointers'],
    description: `Given an integer array nums and two integers minK and maxK, return the number of subarrays where the minimum value is minK and the maximum value is maxK.

──────────────────────────────────────
VISUAL EXAMPLE

  nums = [1, 3, 5, 2, 7, 5]  minK=1  maxK=5

  A valid subarray must:
  1. Contain at least one element = minK (1)
  2. Contain at least one element = maxK (5)
  3. All elements must be in [minK, maxK] = [1, 5]

  Check each possible subarray:
  [1]         → has 1 but no 5 ✗
  [1,3]       → has 1 but no 5 ✗
  [1,3,5]     → has both 1 and 5, all in [1,5] ✓
  [1,3,5,2]   → has both, all in [1,5] ✓
  [3,5]       → has 5 but no 1 ✗
  [3,5,2]     → has 5 but no 1 ✗
  [5]         → has 5 but no 1 ✗
  [5,2]       → has 5 but no 1 ✗
  [2]         → neither ✗
  ... 7 and anything containing 7 → 7 > maxK → invalid

  Count of valid subarrays = 2

  KEY INSIGHT: Track last positions of:
  - bad element (> maxK or < minK) → resets window
  - element equal to minK
  - element equal to maxK
──────────────────────────────────────

Input: first line = nums (space-separated), second line = minK maxK

Example 1:
Input:
1 3 5 2 7 5
1 5
Output: 2

Example 2:
Input:
1 1 1 1
1 1
Output: 10

Constraints:
- 2 <= nums.length <= 10^5
- 1 <= nums[i], minK, maxK <= 10^6`,
    test_cases: [
      { input: '1 3 5 2 7 5\n1 5', expected_output: '2' },
      { input: '1 1 1 1\n1 1', expected_output: '10' },
      { input: '1 2\n1 2', expected_output: '1' },
    ],
  },
  {
    title: 'Find the Duplicate Number',
    slug: 'find-duplicate-number',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Bit Manipulation'],
    description: `Given an array of n+1 integers where each integer is between 1 and n (inclusive), there is exactly one duplicate number. Find it without modifying the array and using O(1) extra space.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [1, 3, 4, 2, 2]  (n=4, range 1..4)

  If we treat array values as "next pointers":
  index: 0 → nums[0]=1 → nums[1]=3 → nums[3]=2 → nums[2]=4 → nums[4]=2 → cycle!

  FLOYD'S CYCLE DETECTION:
  ┌─────────────────────────────────┐
  │  Linked list: 0→1→3→2→4→2→4...│
  │                        ↑___↑   │
  │                     (cycle!)   │
  └─────────────────────────────────┘

  Phase 1: Find meeting point
  slow: 0→1→3→2→4→2
  fast: 0→3→4→4→4→4
  They meet at index 2.

  Phase 2: Find cycle entry (= duplicate)
  Reset slow to 0, keep fast at meeting point
  Both move 1 step at a time.
  They meet at the duplicate: 2 ✓
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 1 3 4 2 2
Output: 2

Example 2:
Input: 3 1 3 4 2
Output: 3

Example 3:
Input: 1 1
Output: 1

Constraints:
- 1 <= n <= 10^5
- nums.length == n + 1
- 1 <= nums[i] <= n
- Only one duplicate, but may appear more than twice

Follow-up: Can you solve it without modifying the array, in O(n) time, O(1) space?`,
    test_cases: [
      { input: '1 3 4 2 2', expected_output: '2' },
      { input: '3 1 3 4 2', expected_output: '3' },
      { input: '1 1', expected_output: '1' },
    ],
  },
  {
    title: 'Minimum Cost to Connect Sticks',
    slug: 'min-cost-connect-sticks',
    difficulty: 'Medium',
    tags: ['Array', 'Greedy', 'Heap'],
    description: `You have n sticks with lengths given in an array. Each time you combine two sticks, the cost equals their combined length. Find the minimum total cost to connect all sticks into one.

──────────────────────────────────────
VISUAL EXAMPLE

  Sticks: [2, 4, 3]

  Strategy: Always combine the TWO SHORTEST sticks first.
  (Greedy: small sticks combined early appear in fewer future costs)

  Step 1: Combine 2 and 3 → cost = 5
          Remaining: [4, 5]
  Step 2: Combine 4 and 5 → cost = 9
          Total cost = 5 + 9 = 14 ✓

  Wrong approach (larger first):
  Step 1: Combine 3 and 4 → cost = 7
          Remaining: [2, 7]
  Step 2: Combine 2 and 7 → cost = 9
          Total = 7 + 9 = 16 ✗ (worse!)

  ┌──────────────────────────────────┐
  │ Use a MIN-HEAP to always get the │
  │ two smallest sticks efficiently. │
  └──────────────────────────────────┘
──────────────────────────────────────

Input: space-separated stick lengths

Example 1:
Input: 2 4 3
Output: 14

Example 2:
Input: 1 8 3 5
Output: 30

Example 3:
Input: 5
Output: 0

Constraints:
- 1 <= sticks.length <= 10^4
- 1 <= sticks[i] <= 10^4`,
    test_cases: [
      { input: '2 4 3', expected_output: '14' },
      { input: '1 8 3 5', expected_output: '30' },
      { input: '5', expected_output: '0' },
    ],
  },
  {
    title: 'Maximum Width Ramp',
    slug: 'maximum-width-ramp',
    difficulty: 'Medium',
    tags: ['Array', 'Stack', 'Two Pointers'],
    description: `A ramp in an integer array nums is a pair (i, j) where i < j and nums[i] <= nums[j]. The width of the ramp is j - i. Return the maximum width of a ramp, or 0 if no ramp exists.

──────────────────────────────────────
VISUAL EXAMPLE

  nums = [6, 0, 8, 2, 1, 5]

  All valid ramps (nums[i] <= nums[j], i < j):
  (1,2): 0 <= 8, width = 2-1 = 1
  (1,3): 0 <= 2, width = 3-1 = 2
  (1,4): 0 <= 1, width = 4-1 = 3
  (1,5): 0 <= 5, width = 5-1 = 4  ← MAXIMUM!
  (2,5): 8... 5 < 8, invalid
  (3,5): 2 <= 5, width = 5-3 = 2
  (4,5): 1 <= 5, width = 5-4 = 1

  Max width = 4 ✓

  EFFICIENT APPROACH:
  1. Build a decreasing stack of candidates for i
     (only add to stack if nums[i] < all previous)
  2. Scan j from right to left, pop from stack when nums[stack.top] <= nums[j]
     Each pop = potential maximum ramp!
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 6 0 8 2 1 5
Output: 4

Example 2:
Input: 9 8 1 0 1 9 4 0 4 1
Output: 7

Example 3:
Input: 5 5 5
Output: 2

Constraints:
- 2 <= nums.length <= 5 * 10^4
- 0 <= nums[i] <= 5 * 10^4`,
    test_cases: [
      { input: '6 0 8 2 1 5', expected_output: '4' },
      { input: '9 8 1 0 1 9 4 0 4 1', expected_output: '7' },
      { input: '5 5 5', expected_output: '2' },
    ],
  },
];

async function seed() {
  // Add columns if not exist
  await pool.query(`
    ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_battle_exclusive BOOLEAN DEFAULT FALSE;
    ALTER TABLE problems ADD COLUMN IF NOT EXISTS battle_revealed_at TIMESTAMP;
  `);
  console.log('Columns added.');

  const admin = await pool.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
  const adminId = admin.rows[0]?.id;
  let inserted = 0;

  for (const p of BATTLE_PROBLEMS) {
    try {
      await pool.query(
        `INSERT INTO problems (title, slug, description, difficulty, tags, test_cases, time_limit, memory_limit, created_by, is_battle_exclusive)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE) ON CONFLICT (slug) DO NOTHING`,
        [p.title, p.slug, p.description, p.difficulty, p.tags, JSON.stringify(p.test_cases), 2000, 256, adminId]
      );
      console.log(`  ✓ [BATTLE] ${p.title}`);
      inserted++;
    } catch (e) { console.log(`  ✗ ${p.title}: ${e.message}`); }
  }

  const total = await pool.query('SELECT COUNT(*) FROM problems');
  const battleOnly = await pool.query('SELECT COUNT(*) FROM problems WHERE is_battle_exclusive=TRUE');
  console.log(`\n✅ Inserted ${inserted} battle-exclusive problems`);
  console.log(`   Total problems: ${total.rows[0].count}`);
  console.log(`   Battle-exclusive (hidden until played): ${battleOnly.rows[0].count}`);
  await pool.end();
}

seed().catch(console.error);
