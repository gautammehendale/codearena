require('dotenv').config();
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({ host: 'localhost', port: 5433, database: 'codearena', user: 'postgres', password: 'postgres' });

const CURATED_30 = [
  // ══════════════ EASY (15) ══════════════
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    time_limit: 2000,
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You may assume exactly one solution exists and you cannot use the same element twice.

──────────────────────────────────────
VISUAL EXAMPLE

  Index:   0    1    2    3
  Array: [ 2,   7,  11,  15 ]
           ↑    ↑
           └────┘ → 2 + 7 = 9 ✓

  We need two numbers that sum to 9.
  nums[0] = 2, nums[1] = 7 → 2 + 7 = 9 ✓
  Answer: [0, 1]
──────────────────────────────────────

Input Format:
Line 1: n (size of array)
Line 2: n space-separated integers
Line 3: target

Example 1:
Input:
4
2 7 11 15
9
Output: 0 1
Explanation: nums[0] + nums[1] = 2 + 7 = 9

Example 2:
Input:
3
3 2 4
6
Output: 1 2
Explanation: nums[1] + nums[2] = 2 + 4 = 6

Example 3:
Input:
2
3 3
6
Output: 0 1

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists

Follow-up: Can you solve it in O(n) time using a hash map?`,
    test_cases: [
      { input: '4\n2 7 11 15\n9', expected_output: '0 1' },
      { input: '3\n3 2 4\n6', expected_output: '1 2' },
      { input: '2\n3 3\n6', expected_output: '0 1' },
    ],
  },
  {
    title: 'Reverse a String',
    slug: 'reverse-string',
    difficulty: 'Easy',
    tags: ['String', 'Two Pointers'],
    time_limit: 1000,
    description: `Write a function that reverses a string. Given a string s, return it reversed.

──────────────────────────────────────
VISUAL EXAMPLE

  Original:  h e l l o
  Index:     0 1 2 3 4

  Step 1: Swap index 0 ↔ 4  →  o e l l h
  Step 2: Swap index 1 ↔ 3  →  o l l e h
  Step 3: Middle stays       →  o l l e h

  Result: "olleh"

  Two Pointer Approach:
  ←─────────────────→
  h  e  l  l  o
  ↑              ↑
  left          right
  Swap, then move both inward until they meet.
──────────────────────────────────────

Example 1:
Input: hello
Output: olleh

Example 2:
Input: Hannah
Output: hannaH

Example 3:
Input: abcde
Output: edcba

Constraints:
- 1 <= s.length <= 10^5
- s consists of printable ASCII characters`,
    test_cases: [
      { input: 'hello', expected_output: 'olleh' },
      { input: 'Hannah', expected_output: 'hannaH' },
      { input: 'abcde', expected_output: 'edcba' },
    ],
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    tags: ['Stack', 'String'],
    time_limit: 1000,
    description: `Given a string s containing only '(', ')', '{', '}', '[', ']', determine if the input string is valid.

A string is valid if:
  1. Every opening bracket has a matching closing bracket of the same type.
  2. Brackets are closed in the correct order (last opened = first closed).

──────────────────────────────────────
VISUAL EXAMPLE — Stack Simulation

  Input: { [ ( ) ] }

  Process each character:
  {  → push    Stack: [ { ]
  [  → push    Stack: [ {, [ ]
  (  → push    Stack: [ {, [, ( ]
  )  → top is ( → match! pop   Stack: [ {, [ ]
  ]  → top is [ → match! pop   Stack: [ { ]
  }  → top is { → match! pop   Stack: [ ]

  Stack empty at end → VALID ✓

  Input: ( ]
  (  → push    Stack: [ ( ]
  ]  → top is ( → MISMATCH! → INVALID ✗
──────────────────────────────────────

Example 1:
Input: ()
Output: true

Example 2:
Input: ()[]{}
Output: true

Example 3:
Input: (]
Output: false

Example 4:
Input: ([)]
Output: false

Example 5:
Input: {[]}
Output: true

Constraints:
- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'`,
    test_cases: [
      { input: '()', expected_output: 'true' },
      { input: '()[]{}', expected_output: 'true' },
      { input: '(]', expected_output: 'false' },
      { input: '([)]', expected_output: 'false' },
      { input: '{[]}', expected_output: 'true' },
    ],
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    time_limit: 1000,
    description: `Given a sorted array of integers nums and a target value, return the index of target in nums. If target does not exist, return -1. You must write an O(log n) algorithm.

──────────────────────────────────────
VISUAL EXAMPLE

  nums = [-1, 0, 3, 5, 9, 12],  target = 9
  Index:   0  1  2  3  4   5

  Step 1: left=0, right=5, mid=2
          nums[2]=3 < 9  → search right half
          left = mid+1 = 3

  Step 2: left=3, right=5, mid=4
          nums[4]=9 == 9 → FOUND! ✓
          return 4

  ┌───┬───┬───┬───┬───┬───┐
  │-1 │ 0 │ 3 │ 5 │ 9 │12 │
  └───┴───┴───┴───┴───┴───┘
               └── mid     ↑
                         target found here
──────────────────────────────────────

Input Format:
Line 1: n space-separated sorted integers
Line 2: target

Example 1:
Input:
-1 0 3 5 9 12
9
Output: 4

Example 2:
Input:
-1 0 3 5 9 12
2
Output: -1

Example 3:
Input:
5
5
Output: 0

Constraints:
- 1 <= nums.length <= 10^4
- All integers in nums are unique
- nums is sorted in ascending order
- -10^4 <= nums[i], target <= 10^4`,
    test_cases: [
      { input: '-1 0 3 5 9 12\n9', expected_output: '4' },
      { input: '-1 0 3 5 9 12\n2', expected_output: '-1' },
      { input: '5\n5', expected_output: '0' },
    ],
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    tags: ['Dynamic Programming', 'Math', 'Memoization'],
    time_limit: 1000,
    description: `You are climbing a staircase with n steps. Each time you can climb either 1 or 2 steps. How many distinct ways can you reach the top?

──────────────────────────────────────
VISUAL EXAMPLE  (n = 4 stairs)

  Ways to reach step 4:
  1+1+1+1   ████
  1+1+2     ███ ██
  1+2+1     ██ ███
  2+1+1     ██████
  2+2       ████████

  Total = 5 ways

  KEY INSIGHT — Fibonacci Pattern:
  ┌───────────────────────────────┐
  │ To reach step n, you came     │
  │ from step (n-1) or step (n-2) │
  │                               │
  │ ways(n) = ways(n-1) + ways(n-2)│
  └───────────────────────────────┘

  n=1 → 1 way      n=2 → 2 ways
  n=3 → 3 ways     n=4 → 5 ways
  n=5 → 8 ways     (Fibonacci!)
──────────────────────────────────────

Example 1:
Input: 2
Output: 2
Explanation: 1+1 or 2

Example 2:
Input: 3
Output: 3
Explanation: 1+1+1, 1+2, or 2+1

Example 3:
Input: 10
Output: 89

Constraints:
- 1 <= n <= 45`,
    test_cases: [
      { input: '2', expected_output: '2' },
      { input: '3', expected_output: '3' },
      { input: '10', expected_output: '89' },
      { input: '45', expected_output: '1836311903' },
    ],
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-buy-sell-stock',
    difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming'],
    time_limit: 1000,
    description: `You are given an array prices where prices[i] is the stock price on day i. You want to maximize profit by buying on one day and selling on a later day. Return the maximum profit possible, or 0 if no profit is possible.

──────────────────────────────────────
VISUAL EXAMPLE

  prices = [7, 1, 5, 3, 6, 4]

  Price chart:
  7 │█
  6 │              █
  5 │       █
  4 │                   █
  3 │          █
  2 │
  1 │   █
    └──────────────────────
      0  1  2  3  4  5  (day)

  Buy on day 1 (price=1) ↑
  Sell on day 4 (price=6) ↑
  Profit = 6 - 1 = 5 ✓ (maximum)

  Key idea: Track the minimum price seen so far.
  For each day, profit = current price - min price so far.
──────────────────────────────────────

Input: space-separated prices

Example 1:
Input: 7 1 5 3 6 4
Output: 5
Explanation: Buy day 2 (price=1), sell day 5 (price=6). Profit = 5.

Example 2:
Input: 7 6 4 3 1
Output: 0
Explanation: Prices always fall. No profitable trade exists.

Example 3:
Input: 1 2
Output: 1

Constraints:
- 1 <= prices.length <= 10^5
- 0 <= prices[i] <= 10^4`,
    test_cases: [
      { input: '7 1 5 3 6 4', expected_output: '5' },
      { input: '7 6 4 3 1', expected_output: '0' },
      { input: '1 2', expected_output: '1' },
      { input: '2 4 1 7', expected_output: '6' },
    ],
  },
  {
    title: 'Single Number',
    slug: 'single-number',
    difficulty: 'Easy',
    tags: ['Array', 'Bit Manipulation'],
    time_limit: 1000,
    description: `Given a non-empty array of integers where every element appears exactly twice except for one, find the element that appears only once. Your solution must run in O(n) time and O(1) space.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [4, 1, 2, 1, 2]

  Sorted view:  1 1 | 2 2 | 4
                pairs    lonely!

  XOR TRICK (the elegant solution):
  4 XOR 1 XOR 2 XOR 1 XOR 2
  = 4 XOR (1 XOR 1) XOR (2 XOR 2)
  = 4 XOR 0 XOR 0
  = 4 ✓

  WHY XOR WORKS:
  • a XOR a = 0  (same numbers cancel)
  • a XOR 0 = a  (XOR with 0 keeps value)
  • XOR is commutative and associative
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 2 2 1
Output: 1

Example 2:
Input: 4 1 2 1 2
Output: 4

Example 3:
Input: 1
Output: 1

Constraints:
- 1 <= nums.length <= 3 × 10^4 (always odd)
- -3 × 10^4 <= nums[i] <= 3 × 10^4
- Each element appears exactly twice except for one

Follow-up: Can you solve it without sorting and without extra space?`,
    test_cases: [
      { input: '2 2 1', expected_output: '1' },
      { input: '4 1 2 1 2', expected_output: '4' },
      { input: '1', expected_output: '1' },
    ],
  },
  {
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    time_limit: 1000,
    description: `You are given two sorted arrays. Merge them into one sorted array and print the result.

──────────────────────────────────────
VISUAL EXAMPLE

  List 1: 1 → 2 → 4
  List 2: 1 → 3 → 4

  Merge step by step:
  Compare heads: 1 == 1 → take from list1
  Result: 1 →

  Compare: 2 vs 1 → take 1 from list2
  Result: 1 → 1 →

  Compare: 2 vs 3 → take 2
  Result: 1 → 1 → 2 →

  Continue... Final: 1 → 1 → 2 → 3 → 4 → 4

  ┌─────┐   ┌─────┐   ┌─────┐
  │  1  │──▶│  2  │──▶│  4  │  List 1
  └─────┘   └─────┘   └─────┘
     +
  ┌─────┐   ┌─────┐   ┌─────┐
  │  1  │──▶│  3  │──▶│  4  │  List 2
  └─────┘   └─────┘   └─────┘
     ↓
  1 1 2 3 4 4  (merged)
──────────────────────────────────────

Input: two lines, each with space-separated sorted integers (or empty line)

Example 1:
Input:
1 2 4
1 3 4
Output: 1 1 2 3 4 4

Example 2:
Input:
(empty)
(empty)
Output: (empty)

Example 3:
Input:

0
Output: 0

Constraints:
- 0 <= length of each list <= 50
- -100 <= values <= 100
- Both lists are sorted in non-decreasing order`,
    test_cases: [
      { input: '1 2 4\n1 3 4', expected_output: '1 1 2 3 4 4' },
      { input: '\n', expected_output: '' },
      { input: '\n0', expected_output: '0' },
    ],
  },
  {
    title: 'Missing Number',
    slug: 'missing-number',
    difficulty: 'Easy',
    tags: ['Array', 'Math', 'Bit Manipulation'],
    time_limit: 1000,
    description: `Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [9, 6, 4, 2, 3, 5, 7, 0, 1]
  n = 9,  Range should be [0..9]

  Full range:  0 1 2 3 4 5 6 7 8 9
  Given:       0 1 2 3 4 5 6 7 _ 9
                                ↑
                            8 is missing!

  MATH TRICK:
  Expected sum = n*(n+1)/2 = 9*10/2 = 45
  Actual sum   = 9+6+4+2+3+5+7+0+1 = 37
  Missing      = 45 - 37 = 8 ✓
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 3 0 1
Output: 2

Example 2:
Input: 0 1
Output: 2

Example 3:
Input: 9 6 4 2 3 5 7 0 1
Output: 8

Constraints:
- n == nums.length
- 1 <= n <= 10^4
- 0 <= nums[i] <= n
- All numbers are unique

Follow-up: Can you solve it in O(1) extra space complexity?`,
    test_cases: [
      { input: '3 0 1', expected_output: '2' },
      { input: '0 1', expected_output: '2' },
      { input: '9 6 4 2 3 5 7 0 1', expected_output: '8' },
    ],
  },
  {
    title: 'Majority Element',
    slug: 'majority-element',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table', 'Sorting'],
    time_limit: 1000,
    description: `Given an array nums of size n, return the majority element — the element that appears more than ⌊n/2⌋ times. You may assume the majority element always exists.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [2, 2, 1, 1, 1, 2, 2]
  n = 7,  majority threshold = 7/2 = 3

  Frequency count:
  1 appears: ███ (3 times)
  2 appears: ████ (4 times) ← majority!
  4 > ⌊7/2⌋ = 3  ✓

  BOYER-MOORE VOTING (O(1) space):
  Think of it as votes:

  2  2  1  1  1  2  2
  ↑
  candidate=2, count=1

  2  2  1  1  1  2  2
     ↑
  Same! count=2

  2  2  1  1  1  2  2
        ↑
  Different! count=1

  ... continues, candidate at end = majority
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 3 2 3
Output: 3

Example 2:
Input: 2 2 1 1 1 2 2
Output: 2

Example 3:
Input: 1
Output: 1

Constraints:
- n == nums.length
- 1 <= n <= 5 * 10^4
- -10^9 <= nums[i] <= 10^9
- Majority element always exists

Follow-up: Solve in O(n) time and O(1) space (Boyer-Moore Voting Algorithm).`,
    test_cases: [
      { input: '3 2 3', expected_output: '3' },
      { input: '2 2 1 1 1 2 2', expected_output: '2' },
      { input: '1', expected_output: '1' },
    ],
  },
  {
    title: 'Move Zeros to End',
    slug: 'move-zeros-end',
    difficulty: 'Easy',
    tags: ['Array', 'Two Pointers'],
    time_limit: 1000,
    description: `Given an integer array nums, move all 0s to the end while maintaining the relative order of the non-zero elements. Do it in-place.

──────────────────────────────────────
VISUAL EXAMPLE

  Input:  [0, 1, 0, 3, 12]

  TWO POINTER APPROACH:
  pos = 0  (position to place next non-zero)

  Step 1: nums[0]=0  → skip
  Step 2: nums[1]=1  → nums[pos]=1, pos=1
  Step 3: nums[2]=0  → skip
  Step 4: nums[3]=3  → nums[pos]=3, pos=2
  Step 5: nums[4]=12 → nums[pos]=12, pos=3

  Fill rest with zeros: nums[3]=0, nums[4]=0

  Output: [1, 3, 12, 0, 0]

  Before: 0  1  0  3 12
          ↑
  After:  1  3 12  0  0
                   ↑──↑
                   zeros moved here
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 0 1 0 3 12
Output: 1 3 12 0 0

Example 2:
Input: 0
Output: 0

Example 3:
Input: 0 0 1
Output: 1 0 0

Constraints:
- 1 <= nums.length <= 10^4
- -2^31 <= nums[i] <= 2^31 - 1

Note: You must do this in-place without copying the array.`,
    test_cases: [
      { input: '0 1 0 3 12', expected_output: '1 3 12 0 0' },
      { input: '0', expected_output: '0' },
      { input: '0 0 1', expected_output: '1 0 0' },
      { input: '1 2 3', expected_output: '1 2 3' },
    ],
  },
  {
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    difficulty: 'Easy',
    tags: ['Math'],
    time_limit: 1000,
    description: `Given an integer x, return true if x is a palindrome (reads the same forward and backward), and false otherwise. Negative numbers are never palindromes.

──────────────────────────────────────
VISUAL EXAMPLE

  x = 121
  Forward:  1 2 1
  Backward: 1 2 1
  Same! → true ✓

  x = -121
  Negative → automatically false ✗

  x = 10
  Forward:  1 0
  Backward: 0 1  (01 ≠ 10)
  → false ✗

  DIGIT REVERSAL APPROACH:
  121 → reverse → 121 == 121 ✓
  123 → reverse → 321 ≠ 123 ✗

  CLEVER HALF-REVERSE (avoid overflow):
  Reverse only the second half!
  1221 → first half: 12, reversed second: 12 → equal ✓
──────────────────────────────────────

Example 1:
Input: 121
Output: true

Example 2:
Input: -121
Output: false
Explanation: Reads as 121- from right to left

Example 3:
Input: 10
Output: false
Explanation: Reads as 01 from right to left

Constraints:
- -2^31 <= x <= 2^31 - 1

Follow-up: Solve it without converting the integer to a string.`,
    test_cases: [
      { input: '121', expected_output: 'true' },
      { input: '-121', expected_output: 'false' },
      { input: '10', expected_output: 'false' },
      { input: '0', expected_output: 'true' },
      { input: '1221', expected_output: 'true' },
    ],
  },
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz',
    difficulty: 'Easy',
    tags: ['Math', 'String'],
    time_limit: 1000,
    description: `Given an integer n, print numbers from 1 to n with these rules:
  • If the number is divisible by 3, print "Fizz"
  • If the number is divisible by 5, print "Buzz"
  • If divisible by both 3 and 5, print "FizzBuzz"
  • Otherwise, print the number itself

──────────────────────────────────────
VISUAL EXAMPLE  (n = 15)

  1  → 1
  2  → 2
  3  → Fizz        (3 % 3 == 0)
  4  → 4
  5  → Buzz        (5 % 5 == 0)
  6  → Fizz        (6 % 3 == 0)
  7  → 7
  8  → 8
  9  → Fizz        (9 % 3 == 0)
  10 → Buzz        (10 % 5 == 0)
  11 → 11
  12 → Fizz        (12 % 3 == 0)
  13 → 13
  14 → 14
  15 → FizzBuzz    (15 % 3 == 0 AND 15 % 5 == 0)

  KEY: Check "FizzBuzz" BEFORE "Fizz" and "Buzz"!
──────────────────────────────────────

Example 1:
Input: 3
Output:
1
2
Fizz

Example 2:
Input: 5
Output:
1
2
Fizz
4
Buzz

Constraints:
- 1 <= n <= 10^4`,
    test_cases: [
      { input: '3', expected_output: '1\n2\nFizz' },
      { input: '5', expected_output: '1\n2\nFizz\n4\nBuzz' },
      { input: '15', expected_output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
    ],
  },
  {
    title: 'Plus One',
    slug: 'plus-one',
    difficulty: 'Easy',
    tags: ['Array', 'Math'],
    time_limit: 1000,
    description: `You are given a large integer represented as an array of digits, where digits[i] is the ith digit. The digits are stored in order and do not contain leading zeros. Increment the integer by one and output the resulting digit array.

──────────────────────────────────────
VISUAL EXAMPLE

  Example A: [1, 2, 3] + 1
  ┌───┬───┬───┐
  │ 1 │ 2 │ 3 │  → 123 + 1 = 124
  └───┴───┴───┘
  Result: [1, 2, 4]  (simple, no carry)

  Example B: [1, 2, 9] + 1
  ┌───┬───┬───┐
  │ 1 │ 2 │ 9 │  → 9+1=10, carry 1
  └───┴───┴───┘       ↑
  9+1=10 → write 0, carry=1
  2+1=3  → write 3, carry=0
  Result: [1, 3, 0]

  Example C: [9, 9, 9] + 1
  ┌───┬───┬───┐
  │ 9 │ 9 │ 9 │  → 999 + 1 = 1000
  └───┴───┴───┘
  All 9s carry all the way left
  Result: [1, 0, 0, 0]  (array grows by 1!)
──────────────────────────────────────

Input: space-separated digits (representing the number)

Example 1:
Input: 1 2 3
Output: 1 2 4

Example 2:
Input: 4 3 2 1
Output: 4 3 2 2

Example 3:
Input: 9 9 9
Output: 1 0 0 0

Constraints:
- 1 <= digits.length <= 100
- 0 <= digits[i] <= 9
- digits does not contain leading zeros`,
    test_cases: [
      { input: '1 2 3', expected_output: '1 2 4' },
      { input: '4 3 2 1', expected_output: '4 3 2 2' },
      { input: '9 9 9', expected_output: '1 0 0 0' },
      { input: '9', expected_output: '1 0' },
    ],
  },
  {
    title: 'Pascal Triangle Row',
    slug: 'pascal-triangle-row',
    difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming'],
    time_limit: 1000,
    description: `Given an integer rowIndex, return the rowIndex-th (0-indexed) row of Pascal's triangle.

──────────────────────────────────────
PASCAL'S TRIANGLE

  Row 0:         1
  Row 1:        1 1
  Row 2:       1 2 1
  Row 3:      1 3 3 1
  Row 4:     1 4 6 4 1
  Row 5:    1 5 10 10 5 1

  PATTERN: Each number = sum of two numbers above it
  ┌───┬───┬───┬───┬───┐
  │ 1 │ 3 │ 3 │ 1 │   │  Row 3
  └───┴───┴───┴───┴───┘
       ↘ + ↙
  ┌───┬───┬───┬───┬───┐
  │ 1 │ 4 │ 6 │ 4 │ 1 │  Row 4
  └───┴───┴───┴───┴───┘
       3+1=4  3+3=6  3+1=4

  FORMULA: C(n,k) = n! / (k! * (n-k)!)
  Row 4: C(4,0)=1, C(4,1)=4, C(4,2)=6, C(4,3)=4, C(4,4)=1
──────────────────────────────────────

Example 1:
Input: 3
Output: 1 3 3 1

Example 2:
Input: 0
Output: 1

Example 3:
Input: 4
Output: 1 4 6 4 1

Constraints:
- 0 <= rowIndex <= 33`,
    test_cases: [
      { input: '3', expected_output: '1 3 3 1' },
      { input: '0', expected_output: '1' },
      { input: '4', expected_output: '1 4 6 4 1' },
      { input: '1', expected_output: '1 1' },
    ],
  },

  // ══════════════ MEDIUM (12) ══════════════
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating',
    difficulty: 'Medium',
    tags: ['String', 'Sliding Window', 'Hash Table'],
    time_limit: 2000,
    description: `Given a string s, find the length of the longest substring without repeating characters.

──────────────────────────────────────
VISUAL EXAMPLE — Sliding Window

  Input: "abcabcbb"

  Use a window [left, right] that expands right.
  When a duplicate is found, shrink from left.

  a b c a b c b b
  └─┘         right=0, window="a", len=1
  └───┘       right=1, window="ab", len=2
  └─────┘     right=2, window="abc", len=3
    └─────┘   right=3, 'a' seen! move left past 'a'
              window="bca", len=3
      └─────┘ right=4, 'b' seen! move left
              window="cab", len=3
        └─────┘right=5, 'c' seen! move left
              window="abc", len=3
          └─┘  right=6, 'b' seen! move left
              window="cb", len=2
            └┘  right=7, 'b' seen! move left
              window="b", len=1

  Maximum length seen = 3 (window "abc")
──────────────────────────────────────

Example 1:
Input: abcabcbb
Output: 3
Explanation: "abc" is the longest, length = 3

Example 2:
Input: bbbbb
Output: 1
Explanation: "b" is the longest, length = 1

Example 3:
Input: pwwkew
Output: 3
Explanation: "wke" is the longest, length = 3

Example 4:
Input: (empty)
Output: 0

Constraints:
- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces`,
    test_cases: [
      { input: 'abcabcbb', expected_output: '3' },
      { input: 'bbbbb', expected_output: '1' },
      { input: 'pwwkew', expected_output: '3' },
      { input: '', expected_output: '0' },
    ],
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
    time_limit: 2000,
    description: `Given an integer array nums, find the contiguous subarray with the largest sum and return that sum.

──────────────────────────────────────
VISUAL EXAMPLE — Kadane's Algorithm

  Input: [-2, 1, -3, 4, -1, 2, 1, -5, 4]

  Track: currentSum and maxSum

  i=0: num=-2  curr=max(-2, 0+(-2))=-2   max=-2
  i=1: num=1   curr=max(1,  -2+1)  =1    max=1
  i=2: num=-3  curr=max(-3, 1+(-3))=-2   max=1
  i=3: num=4   curr=max(4,  -2+4)  =4    max=4
  i=4: num=-1  curr=max(-1, 4+(-1))=3    max=4
  i=5: num=2   curr=max(2,  3+2)   =5    max=5
  i=6: num=1   curr=max(1,  5+1)   =6    max=6 ✓
  i=7: num=-5  curr=max(-5, 6-5)   =1    max=6
  i=8: num=4   curr=max(4,  1+4)   =5    max=6

  Answer: 6  (subarray: [4, -1, 2, 1])

  RULE: At each step, either extend current subarray
        or start fresh from this element.
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: -2 1 -3 4 -1 2 1 -5 4
Output: 6
Explanation: Subarray [4, -1, 2, 1] has sum 6

Example 2:
Input: 1
Output: 1

Example 3:
Input: 5 4 -1 7 8
Output: 23

Constraints:
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4

Follow-up: If you solved it in O(n), can you use Divide and Conquer (O(n log n))?`,
    test_cases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expected_output: '6' },
      { input: '1', expected_output: '1' },
      { input: '5 4 -1 7 8', expected_output: '23' },
      { input: '-1 -2 -3', expected_output: '-1' },
    ],
  },
  {
    title: '3Sum',
    slug: 'three-sum',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    time_limit: 2000,
    description: `Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i, j, k are distinct indices and nums[i] + nums[j] + nums[k] == 0.

──────────────────────────────────────
VISUAL EXAMPLE — Sort + Two Pointers

  Input: [-1, 0, 1, 2, -1, -4]
  Sort:  [-4, -1, -1, 0, 1, 2]

  Fix nums[i], then two-pointer on remaining:

  i=0 (nums[i]=-4): need two summing to 4
    L=1(-1), R=5(2): -1+2=1 < 4 → L++
    L=2(-1), R=5(2): -1+2=1 < 4 → L++
    ... no match

  i=1 (nums[i]=-1): need two summing to 1
    L=2(-1), R=5(2): -1+2=1 == 1 → FOUND! [-1,-1,2]
    L++ R-- → L=3(0), R=4(1): 0+1=1 == 1 → FOUND! [-1,0,1]
    L++ R-- → L >= R, stop

  i=2 (nums[i]=-1): skip (duplicate of i=1)

  i=3 (nums[i]=0): need two summing to 0
    L=4(1), R=5(2): 1+2=3 > 0 → R--
    L >= R, stop

  Answer: [[-1,-1,2], [-1,0,1]]
──────────────────────────────────────

Input: space-separated integers
Output: each triplet on a new line (sorted), triplets sorted by first element

Example 1:
Input: -1 0 1 2 -1 -4
Output:
-1 -1 2
-1 0 1

Example 2:
Input: 0 1 1
Output: (empty)

Example 3:
Input: 0 0 0
Output: 0 0 0

Constraints:
- 3 <= nums.length <= 3000
- -10^5 <= nums[i] <= 10^5`,
    test_cases: [
      { input: '-1 0 1 2 -1 -4', expected_output: '-1 -1 2\n-1 0 1' },
      { input: '0 1 1', expected_output: '' },
      { input: '0 0 0', expected_output: '0 0 0' },
    ],
  },
  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Greedy'],
    time_limit: 2000,
    description: `You have n vertical lines on a coordinate plane. The endpoints of the ith line are (i, 0) and (i, heights[i]). Find two lines that form a container holding the maximum amount of water.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [1, 8, 6, 2, 5, 4, 8, 3, 7]

  │
  8 │  █           █
  7 │  █           █     █
  6 │  █  █        █     █
  5 │  █  █  █     █     █
  4 │  █  █  █  █  █     █
  3 │  █  █  █  █  █  █  █
  2 │  █  █  █  █  █  █  █  █
  1 │█ █  █  █  █  █  █  █  █
    └─────────────────────────────
      0  1  2  3  4  5  6  7  8

  Best container: lines at index 1 (h=8) and 8 (h=7)
  Width = 8-1 = 7,  Height = min(8,7) = 7
  Water = 7 × 7 = 49 ✓

  TWO POINTER STRATEGY:
  Start at both ends. Always move the shorter line inward
  (moving the taller line can never increase water).
──────────────────────────────────────

Input: space-separated heights

Example 1:
Input: 1 8 6 2 5 4 8 3 7
Output: 49

Example 2:
Input: 1 1
Output: 1

Example 3:
Input: 4 3 2 1 4
Output: 16

Constraints:
- n == heights.length
- 2 <= n <= 10^5
- 0 <= heights[i] <= 10^4`,
    test_cases: [
      { input: '1 8 6 2 5 4 8 3 7', expected_output: '49' },
      { input: '1 1', expected_output: '1' },
      { input: '4 3 2 1 4', expected_output: '16' },
    ],
  },
  {
    title: 'Product of Array Except Self',
    slug: 'product-except-self',
    difficulty: 'Medium',
    tags: ['Array', 'Prefix Sum'],
    time_limit: 2000,
    description: `Given an array nums, return an array answer where answer[i] equals the product of all elements except nums[i]. Solve in O(n) without using division.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [1, 2, 3, 4]

  IDEA: For each position, multiply everything LEFT × everything RIGHT

  Build LEFT prefix products:
  Position:   0  1  2  3
  Left[i]:    1  1  2  6   (product of everything before i)
  left[0]=1 (nothing before)
  left[1]=1
  left[2]=1×2=2
  left[3]=1×2×3=6

  Build RIGHT suffix products:
  Right[i]:  24 12  4  1   (product of everything after i)
  right[3]=1 (nothing after)
  right[2]=4
  right[1]=4×3=12
  right[0]=4×3×2=24

  Answer[i] = Left[i] × Right[i]:
  [1×24, 1×12, 2×4, 6×1] = [24, 12, 8, 6] ✓
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 1 2 3 4
Output: 24 12 8 6

Example 2:
Input: -1 1 0 -3 3
Output: 0 0 9 0 0

Constraints:
- 2 <= nums.length <= 10^5
- -30 <= nums[i] <= 30
- Guaranteed answer fits in 32-bit integer

Follow-up: Can you solve it O(1) extra space (excluding the output array)?`,
    test_cases: [
      { input: '1 2 3 4', expected_output: '24 12 8 6' },
      { input: '-1 1 0 -3 3', expected_output: '0 0 9 0 0' },
    ],
  },
  {
    title: 'House Robber',
    slug: 'house-robber',
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming'],
    time_limit: 2000,
    description: `You are a robber planning to rob houses along a street. Each house has a certain amount of money. Adjacent houses have security systems — robbing two adjacent houses will alert the police. Given an array of non-negative integers representing the amount of money in each house, return the maximum amount you can rob without alerting the police.

──────────────────────────────────────
VISUAL EXAMPLE

  Houses: [2, 7, 9, 3, 1]
          H0  H1  H2  H3  H4

  You can't rob consecutive houses.

  Option 1: H0+H2+H4 = 2+9+1 = 12
  Option 2: H0+H2    = 2+9   = 11
  Option 3: H1+H3    = 7+3   = 10
  Option 4: H1+H4    = 7+1   = 8
  Option 5: H0+H3    = 2+3   = 5
  ...
  Best = 12 ✓

  DP APPROACH:
  dp[i] = max money robbing up to house i

  dp[0] = 2
  dp[1] = max(2, 7) = 7
  dp[2] = max(dp[1], dp[0]+9) = max(7, 11) = 11
  dp[3] = max(dp[2], dp[1]+3) = max(11, 10) = 11
  dp[4] = max(dp[3], dp[2]+1) = max(11, 12) = 12 ✓

  Recurrence: dp[i] = max(dp[i-1], dp[i-2] + nums[i])
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 1 2 3 1
Output: 4
Explanation: Rob house 1 (1) then house 3 (3). 1+3=4.

Example 2:
Input: 2 7 9 3 1
Output: 12
Explanation: Rob houses 1, 3, 5. 2+9+1=12.

Constraints:
- 1 <= nums.length <= 100
- 0 <= nums[i] <= 400`,
    test_cases: [
      { input: '1 2 3 1', expected_output: '4' },
      { input: '2 7 9 3 1', expected_output: '12' },
      { input: '0', expected_output: '0' },
      { input: '5 1 1 5', expected_output: '10' },
    ],
  },
  {
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'Array', 'Breadth-First Search'],
    time_limit: 2000,
    description: `You are given an array of coin denominations and a total amount. Find the fewest number of coins needed to make up that amount. If it is impossible, return -1. You have an infinite supply of each coin.

──────────────────────────────────────
VISUAL EXAMPLE

  Coins: [1, 5, 6, 9],  Amount: 11

  Greedy fails here: 9+1+1=3 coins, but 5+6=2 coins ✓

  DP TABLE (minimum coins to reach each amount):

  Amount: 0  1  2  3  4  5  6  7  8  9  10  11
  dp[0]:  0
  Coin 1: 0  1  2  3  4  5  6  7  8  9  10   11
  Coin 5: 0  1  2  3  4  1  2  3  4  5   2    3
  Coin 6: 0  1  2  3  4  1  1  2  3  4   2    2  ← answer!
  Coin 9: 0  1  2  3  4  1  1  2  3  1   2    2

  dp[11] = 2  (coins: 5+6) ✓

  For each amount a, for each coin c:
    dp[a] = min(dp[a], 1 + dp[a-c])
──────────────────────────────────────

Input: first line = coin denominations, second line = amount

Example 1:
Input:
1 5 6 9
11
Output: 2

Example 2:
Input:
2
3
Output: -1
Explanation: Cannot make 3 from only coin of value 2

Example 3:
Input:
1 2 5
11
Output: 3
Explanation: 5+5+1=11

Constraints:
- 1 <= coins.length <= 12
- 1 <= coins[i] <= 2^31 - 1
- 0 <= amount <= 10^4`,
    test_cases: [
      { input: '1 5 6 9\n11', expected_output: '2' },
      { input: '2\n3', expected_output: '-1' },
      { input: '1 2 5\n11', expected_output: '3' },
      { input: '1\n0', expected_output: '0' },
    ],
  },
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Medium',
    tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Graph'],
    time_limit: 2000,
    description: `Given an m × n grid of '1's (land) and '0's (water), count the number of islands. An island is surrounded by water and formed by connecting adjacent land cells horizontally or vertically.

──────────────────────────────────────
VISUAL EXAMPLE

  Grid:
  1 1 1 1 0
  1 1 0 1 0
  1 1 0 0 0
  0 0 0 0 0

  The '1's all connect into ONE island:
  █ █ █ █ ·
  █ █ · █ ·
  █ █ · · ·
  · · · · ·

  Answer: 1

  Second Example:
  1 1 0 0 0
  1 1 0 0 0
  0 0 1 0 0
  0 0 0 1 1

  Island 1: top-left group ██
                             ██
  Island 2: single cell  █
  Island 3: bottom-right ██

  Answer: 3

  ALGORITHM (DFS/BFS):
  Whenever you find a '1', increment count,
  then flood-fill (mark as visited) all connected '1's.
──────────────────────────────────────

Input: first line = m n, then m lines of 1s and 0s (space-separated)

Example 1:
Input:
4 5
1 1 1 1 0
1 1 0 1 0
1 1 0 0 0
0 0 0 0 0
Output: 1

Example 2:
Input:
4 5
1 1 0 0 0
1 1 0 0 0
0 0 1 0 0
0 0 0 1 1
Output: 3

Constraints:
- m == grid.length,  n == grid[i].length
- 1 <= m, n <= 300
- grid[i][j] is '0' or '1'`,
    test_cases: [
      { input: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0', expected_output: '1' },
      { input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', expected_output: '3' },
    ],
  },
  {
    title: 'Jump Game',
    slug: 'jump-game',
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'Greedy'],
    time_limit: 2000,
    description: `You are given an integer array nums. You are at index 0, and each element nums[i] represents the maximum jump length from position i. Return "true" if you can reach the last index, or "false" otherwise.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [2, 3, 1, 1, 4]  → CAN reach end ✓

  Position 0: can jump 2 → can reach index 2
  Position 1: can jump 3 → can reach index 4 (last!)
  Position 2: can jump 1 → can reach index 3

  ┌───┬───┬───┬───┬───┐
  │ 2 │ 3 │ 1 │ 1 │ 4 │
  └───┴───┴───┴───┴───┘
    ↑───────────────→   (jump from 0 to 2)
        ↑──────────→   (jump from 1 to 4!) ✓

  Input: [3, 2, 1, 0, 4]  → CANNOT reach end ✗
  ┌───┬───┬───┬───┬───┐
  │ 3 │ 2 │ 1 │ 0 │ 4 │
  └───┴───┴───┴───┴───┘
  Max reach from 0: index 3
  From index 3: jump=0 → stuck at 3! Cannot reach 4. ✗

  GREEDY STRATEGY:
  Track maxReach. If ever i > maxReach → return false.
  Update maxReach = max(maxReach, i + nums[i]).
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 2 3 1 1 4
Output: true

Example 2:
Input: 3 2 1 0 4
Output: false

Example 3:
Input: 0
Output: true

Constraints:
- 1 <= nums.length <= 10^4
- 0 <= nums[i] <= 10^5`,
    test_cases: [
      { input: '2 3 1 1 4', expected_output: 'true' },
      { input: '3 2 1 0 4', expected_output: 'false' },
      { input: '0', expected_output: 'true' },
      { input: '1 0 0', expected_output: 'false' },
    ],
  },
  {
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence',
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'Binary Search'],
    time_limit: 2000,
    description: `Given an integer array nums, return the length of the longest strictly increasing subsequence. A subsequence maintains relative order but doesn't need to be contiguous.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [10, 9, 2, 5, 3, 7, 101, 18]

  All subsequences of length 4:
  2 → 5 → 7 → 101   ✓
  2 → 5 → 7 → 18    ✓
  2 → 3 → 7 → 101   ✓
  2 → 3 → 7 → 18    ✓

  Visualized on the array:
  10  9  [2]  [5]  3  [7]  [101]  18
              ↑    ↑       ↑      ↑
              └─── + ───── + ─────┘
              length = 4 ✓

  DP APPROACH:
  dp[i] = length of LIS ending at index i

  10  9  2  5  3  7  101  18
  1   1  1  2  2  3   4    4  ← dp values
                         ↑
                         LIS = 4
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 10 9 2 5 3 7 101 18
Output: 4

Example 2:
Input: 0 1 0 3 2 3
Output: 4

Example 3:
Input: 7 7 7 7 7
Output: 1

Constraints:
- 1 <= nums.length <= 2500
- -10^4 <= nums[i] <= 10^4

Follow-up: Can you solve it in O(n log n) using Binary Search?`,
    test_cases: [
      { input: '10 9 2 5 3 7 101 18', expected_output: '4' },
      { input: '0 1 0 3 2 3', expected_output: '4' },
      { input: '7 7 7 7 7', expected_output: '1' },
      { input: '1 2 3 4 5', expected_output: '5' },
    ],
  },
  {
    title: 'Unique Paths',
    slug: 'unique-paths',
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'Math', 'Combinatorics'],
    time_limit: 2000,
    description: `A robot is on an m × n grid at the top-left corner (0,0). It can only move right or down. Count the number of distinct paths to reach the bottom-right corner (m-1, n-1).

──────────────────────────────────────
VISUAL EXAMPLE  (m=3, n=7)

  S → → → → → →
  ↓   ↓   ↓   ↓
  ↓ → ↓ → ↓ → →
  ↓   ↓   ↓   ↓
  → → → → → → E

  Answer: 28

  DP TABLE (m=3, n=3):

  1  1  1
  1  2  3
  1  3  6

  Each cell = cell above + cell to the left
  (Since you can only come from above or from left)

  Top row: all 1s (only one way — go right)
  Left col: all 1s (only one way — go down)
  dp[i][j] = dp[i-1][j] + dp[i][j-1]

  Answer = dp[m-1][n-1] = 6
──────────────────────────────────────

Input: m n on one line

Example 1:
Input: 3 7
Output: 28

Example 2:
Input: 3 2
Output: 3
Explanation: RDD, DRD, DDR

Example 3:
Input: 1 1
Output: 1

Constraints:
- 1 <= m, n <= 100`,
    test_cases: [
      { input: '3 7', expected_output: '28' },
      { input: '3 2', expected_output: '3' },
      { input: '1 1', expected_output: '1' },
      { input: '7 3', expected_output: '28' },
    ],
  },

  // ══════════════ HARD (3) ══════════════
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    tags: ['Array', 'Two Pointers', 'Stack', 'Dynamic Programming'],
    time_limit: 2000,
    description: `Given n non-negative integers representing an elevation map where each bar has width 1, compute how much water can be trapped after raining.

──────────────────────────────────────
VISUAL EXAMPLE

  Input: [0,1,0,2,1,0,1,3,2,1,2,1]

       │
  3    │               █
  2    │      █       ██ █
  1    │ █   ██ █   █ ██ ██ █
  0    │─────────────────────────
       0 1 2 3 4 5 6 7 8 9 10 11

  Water trapped (shown as ~):
       │
  3    │               █
  2    │      █  ~ ~ ~ ██ █
  1    │ █ ~  ██ █ ~ █ ██ ██ █
  0    │─────────────────────────

  Water units: 6 ✓

  KEY INSIGHT for each position i:
  Water at i = min(maxLeft[i], maxRight[i]) - height[i]
  (Water level = lower of the two surrounding walls)

  TWO POINTER APPROACH:
  Left wall determines water when left_max < right_max.
  Process from the shorter side each time.
──────────────────────────────────────

Input: space-separated integers

Example 1:
Input: 0 1 0 2 1 0 1 3 2 1 2 1
Output: 6

Example 2:
Input: 4 2 0 3 2 5
Output: 9

Example 3:
Input: 1 0 1
Output: 1

Constraints:
- n == height.length
- 1 <= n <= 2 * 10^4
- 0 <= height[i] <= 10^5`,
    test_cases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expected_output: '6' },
      { input: '4 2 0 3 2 5', expected_output: '9' },
      { input: '1 0 1', expected_output: '1' },
    ],
  },
  {
    title: 'Edit Distance',
    slug: 'edit-distance',
    difficulty: 'Hard',
    tags: ['String', 'Dynamic Programming'],
    time_limit: 2000,
    description: `Given two strings word1 and word2, return the minimum number of operations to convert word1 to word2. Allowed operations: Insert a character, Delete a character, Replace a character.

──────────────────────────────────────
VISUAL EXAMPLE

  word1 = "horse",  word2 = "ros"

  Operations:
  horse → rorse  (replace 'h' with 'r')
  rorse → rose   (delete 'r')
  rose  → ros    (delete 'e')
  Total: 3 operations ✓

  DP TABLE:
        ""  r  o  s
  ""  [  0  1  2  3 ]
  h   [  1  1  2  3 ]
  o   [  2  2  1  2 ]
  r   [  3  2  2  2 ]
  s   [  4  3  3  2 ]
  e   [  5  4  4  3 ] ← answer = 3

  RECURRENCE:
  If chars match: dp[i][j] = dp[i-1][j-1]
  Else: dp[i][j] = 1 + min(
    dp[i-1][j],   ← delete from word1
    dp[i][j-1],   ← insert into word1
    dp[i-1][j-1]  ← replace
  )
──────────────────────────────────────

Input: two lines (word1, word2)

Example 1:
Input:
horse
ros
Output: 3

Example 2:
Input:
intention
execution
Output: 5

Example 3:
Input:
a
a
Output: 0

Constraints:
- 0 <= word1.length, word2.length <= 500
- word1 and word2 consist of lowercase English letters`,
    test_cases: [
      { input: 'horse\nros', expected_output: '3' },
      { input: 'intention\nexecution', expected_output: '5' },
      { input: 'a\na', expected_output: '0' },
      { input: '\na', expected_output: '1' },
    ],
  },
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-two-sorted-arrays',
    difficulty: 'Hard',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    time_limit: 2000,
    description: `Given two sorted arrays nums1 and nums2, return the median of the combined sorted array. The overall time complexity must be O(log(m+n)).

──────────────────────────────────────
VISUAL EXAMPLE A — Odd total length

  nums1 = [1, 3]
  nums2 = [2]

  Merged: [1, 2, 3]
               ↑
           Median = 2.00000

──────────────────────────────────────
VISUAL EXAMPLE B — Even total length

  nums1 = [1, 2]
  nums2 = [3, 4]

  Merged: [1, 2, 3, 4]
                ↑ ↑
           Median = (2+3)/2 = 2.50000

──────────────────────────────────────
BINARY SEARCH APPROACH

  Binary search on the smaller array to find
  the correct partition such that:
  • Left half of partition ≤ Right half

  For nums1=[1,2], nums2=[3,4]:
  Partition nums1 after index 1: [1,2 | ]
  Partition nums2 after index 0: [3 | 4]

  Left max = max(2,3)=3, Right min = min(∞,4)=4
  Left max ≤ Right min? 3 ≤ 4 ✓ Valid partition!
  Median = (3+4)/2 = 3.5... keep trying.
──────────────────────────────────────

Input: first line = nums1, second line = nums2
(empty line means empty array)
Output: median rounded to 5 decimal places

Example 1:
Input:
1 3
2
Output: 2.00000

Example 2:
Input:
1 2
3 4
Output: 2.50000

Example 3:
Input:
0 0
0 0
Output: 0.00000

Constraints:
- nums1.length + nums2.length >= 1
- Both arrays are sorted in non-decreasing order`,
    test_cases: [
      { input: '1 3\n2', expected_output: '2.00000' },
      { input: '1 2\n3 4', expected_output: '2.50000' },
      { input: '0 0\n0 0', expected_output: '0.00000' },
    ],
  },
];

async function curate() {
  console.log('Replacing problems with 30 beautifully curated ones...\n');
  const admin = await pool.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
  const adminId = admin.rows[0]?.id;

  // Clear existing problems (cascades to submissions)
  await pool.query('DELETE FROM submissions');
  await pool.query('DELETE FROM battle_progress');
  await pool.query('DELETE FROM problems');
  console.log('Cleared existing problems.\n');

  let inserted = 0;
  for (const p of CURATED_30) {
    await pool.query(
      `INSERT INTO problems (title, slug, description, difficulty, tags, test_cases, time_limit, memory_limit, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [p.title, p.slug, p.description, p.difficulty, p.tags, JSON.stringify(p.test_cases), p.time_limit || 2000, 256, adminId]
    );
    console.log(`  ✓ [${p.difficulty.padEnd(6)}] ${p.title}`);
    inserted++;
  }

  console.log(`\n✅ Done! ${inserted} beautifully curated problems inserted.`);
  await pool.end();
}

curate().catch(console.error);
