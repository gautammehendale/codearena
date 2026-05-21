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
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz',
    description: `Given an integer n, return a string where:
- For multiples of 3, output "Fizz"
- For multiples of 5, output "Buzz"
- For multiples of both 3 and 5, output "FizzBuzz"
- Otherwise, output the number itself

Print one result per line from 1 to n.

Example:
Input: 5
Output:
1
2
Fizz
4
Buzz

Constraints: 1 <= n <= 10^4`,
    difficulty: 'Easy',
    tags: ['Math', 'String'],
    test_cases: [
      { input: '5', expected_output: '1\n2\nFizz\n4\nBuzz' },
      { input: '3', expected_output: '1\n2\nFizz' },
      { input: '15', expected_output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    description: `Given an integer x, return true if x is a palindrome, and false otherwise.

An integer is a palindrome when it reads the same forward and backward.

Example 1:
Input: 121
Output: true

Example 2:
Input: -121
Output: false (reads as 121- from right to left)

Example 3:
Input: 10
Output: false

Constraints: -2^31 <= x <= 2^31 - 1`,
    difficulty: 'Easy',
    tags: ['Math'],
    test_cases: [
      { input: '121', expected_output: 'true' },
      { input: '-121', expected_output: 'false' },
      { input: '10', expected_output: 'false' },
      { input: '0', expected_output: 'true' },
      { input: '1221', expected_output: 'true' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Count Vowels',
    slug: 'count-vowels',
    description: `Given a string s, return the number of vowels (a, e, i, o, u) in the string. Both uppercase and lowercase vowels count.

Example 1:
Input: hello
Output: 2

Example 2:
Input: AEIOU
Output: 5

Example 3:
Input: rhythm
Output: 0

Constraints: 1 <= s.length <= 10^5`,
    difficulty: 'Easy',
    tags: ['String'],
    test_cases: [
      { input: 'hello', expected_output: '2' },
      { input: 'AEIOU', expected_output: '5' },
      { input: 'rhythm', expected_output: '0' },
      { input: 'OpenAI', expected_output: '4' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Fibonacci Number',
    slug: 'fibonacci-number',
    description: `The Fibonacci numbers form a sequence where each number is the sum of the two preceding ones, starting from 0 and 1.

F(0) = 0, F(1) = 1
F(n) = F(n-1) + F(n-2) for n > 1

Given n, calculate F(n).

Example 1:
Input: 2
Output: 1

Example 2:
Input: 10
Output: 55

Constraints: 0 <= n <= 30`,
    difficulty: 'Easy',
    tags: ['Math', 'Dynamic Programming', 'Recursion', 'Memoization'],
    test_cases: [
      { input: '2', expected_output: '1' },
      { input: '10', expected_output: '55' },
      { input: '0', expected_output: '0' },
      { input: '1', expected_output: '1' },
      { input: '30', expected_output: '832040' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Single Number',
    slug: 'single-number',
    description: `Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.

You must implement a solution with linear runtime complexity and use only constant extra space.

Example 1:
Input: 2 2 1
Output: 1

Example 2:
Input: 4 1 2 1 2
Output: 4

Example 3:
Input: 1
Output: 1`,
    difficulty: 'Easy',
    tags: ['Array', 'Bit Manipulation'],
    test_cases: [
      { input: '2 2 1', expected_output: '1' },
      { input: '4 1 2 1 2', expected_output: '4' },
      { input: '1', expected_output: '1' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Missing Number',
    slug: 'missing-number',
    description: `Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.

Example 1:
Input: 3 0 1
Output: 2

Example 2:
Input: 0 1
Output: 2

Example 3:
Input: 9 6 4 2 3 5 7 0 1
Output: 8

Constraints: n == nums.length, 1 <= n <= 10^4`,
    difficulty: 'Easy',
    tags: ['Array', 'Math', 'Bit Manipulation'],
    test_cases: [
      { input: '3 0 1', expected_output: '2' },
      { input: '0 1', expected_output: '2' },
      { input: '9 6 4 2 3 5 7 0 1', expected_output: '8' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: '3Sum',
    slug: 'three-sum',
    description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0.

The solution set must not contain duplicate triplets. Print each triplet on a new line, sorted in ascending order, space-separated.

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
Output: 0 0 0`,
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    test_cases: [
      { input: '-1 0 1 2 -1 -4', expected_output: '-1 -1 2\n-1 0 1' },
      { input: '0 1 1', expected_output: '' },
      { input: '0 0 0', expected_output: '0 0 0' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    description: `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.

Example 1:
Input: 1 8 6 2 5 4 8 3 7
Output: 49

Example 2:
Input: 1 1
Output: 1`,
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Greedy'],
    test_cases: [
      { input: '1 8 6 2 5 4 8 3 7', expected_output: '49' },
      { input: '1 1', expected_output: '1' },
      { input: '4 3 2 1 4', expected_output: '16' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
  {
    title: 'Product of Array Except Self',
    slug: 'product-except-self',
    description: `Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer. You must write an algorithm that runs in O(n) time without using division.

Print the result as space-separated integers.

Example 1:
Input: 1 2 3 4
Output: 24 12 8 6

Example 2:
Input: -1 1 0 -3 3
Output: 0 0 9 0 0`,
    difficulty: 'Medium',
    tags: ['Array', 'Prefix Sum'],
    test_cases: [
      { input: '1 2 3 4', expected_output: '24 12 8 6' },
      { input: '-1 1 0 -3 3', expected_output: '0 0 9 0 0' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
  {
    title: 'Majority Element',
    slug: 'majority-element',
    description: `Given an array nums of size n, return the majority element. The majority element is the element that appears more than ⌊n/2⌋ times. You may assume that the majority element always exists in the array.

Example 1:
Input: 3 2 3
Output: 3

Example 2:
Input: 2 2 1 1 1 2 2
Output: 2

Constraints: n == nums.length, 1 <= n <= 5 * 10^4`,
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table', 'Sorting'],
    test_cases: [
      { input: '3 2 3', expected_output: '3' },
      { input: '2 2 1 1 1 2 2', expected_output: '2' },
      { input: '1', expected_output: '1' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Number of 1 Bits',
    slug: 'number-of-1-bits',
    description: `Given a positive integer n, write a function that returns the number of set bits (1s) in its binary representation (also known as the Hamming weight).

Example 1:
Input: 11
Output: 3
Explanation: 11 in binary is 1011, which has 3 set bits.

Example 2:
Input: 128
Output: 1
Explanation: 128 in binary is 10000000.

Example 3:
Input: 2147483645
Output: 30`,
    difficulty: 'Easy',
    tags: ['Bit Manipulation'],
    test_cases: [
      { input: '11', expected_output: '3' },
      { input: '128', expected_output: '1' },
      { input: '2147483645', expected_output: '30' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-buy-sell-stock',
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve. If you cannot achieve any profit, return 0.

Example 1:
Input: 7 1 5 3 6 4
Output: 5
Explanation: Buy on day 2 (price=1) and sell on day 5 (price=6), profit = 5.

Example 2:
Input: 7 6 4 3 1
Output: 0
Explanation: No profit possible.`,
    difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming'],
    test_cases: [
      { input: '7 1 5 3 6 4', expected_output: '5' },
      { input: '7 6 4 3 1', expected_output: '0' },
      { input: '1 2', expected_output: '1' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Word Count',
    slug: 'word-count',
    description: `Given a string sentence, return the number of words in it. Words are separated by single spaces and the string has no leading or trailing spaces.

Example 1:
Input: Hello World
Output: 2

Example 2:
Input: the quick brown fox
Output: 4

Example 3:
Input: CodeArena
Output: 1`,
    difficulty: 'Easy',
    tags: ['String'],
    test_cases: [
      { input: 'Hello World', expected_output: '2' },
      { input: 'the quick brown fox', expected_output: '4' },
      { input: 'CodeArena', expected_output: '1' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    description: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

Example 1:
Input: 0 1 0 2 1 0 1 3 2 1 2 1
Output: 6

Example 2:
Input: 4 2 0 3 2 5
Output: 9

Constraints: n == height.length, 1 <= n <= 2 * 10^4`,
    difficulty: 'Hard',
    tags: ['Array', 'Two Pointers', 'Stack', 'Dynamic Programming'],
    test_cases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expected_output: '6' },
      { input: '4 2 0 3 2 5', expected_output: '9' },
      { input: '1 0 1', expected_output: '1' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
  {
    title: 'Longest Common Prefix',
    slug: 'longest-common-prefix',
    description: `Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string "".

Input: first line is n (number of strings), then n strings each on a new line.

Example 1:
Input:
3
flower
flow
flight
Output: fl

Example 2:
Input:
3
dog
racecar
car
Output: (empty)`,
    difficulty: 'Easy',
    tags: ['String'],
    test_cases: [
      { input: '3\nflower\nflow\nflight', expected_output: 'fl' },
      { input: '3\ndog\nracecar\ncar', expected_output: '' },
      { input: '1\nalone', expected_output: 'alone' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    description: `Given an array of strings strs, group the anagrams together. You can return the answer in any order.

Input: first line is n, then n strings.
Output: each group on one line, words sorted alphabetically within the group, groups sorted by first word.

Example:
Input:
6
eat tea tan ate nat bat
Output:
ate eat tea
bat
nat tan`,
    difficulty: 'Medium',
    tags: ['Array', 'Hash Table', 'String', 'Sorting'],
    test_cases: [
      { input: '6\neat tea tan ate nat bat', expected_output: 'ate eat tea\nbat\nnat tan' },
      { input: '1\na', expected_output: 'a' },
      { input: '2\nab ba', expected_output: 'ab ba' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
  {
    title: 'Power of Two',
    slug: 'power-of-two',
    description: `Given an integer n, return true if it is a power of two. Otherwise, return false.

An integer n is a power of two if there exists an integer x such that n == 2^x.

Example 1:
Input: 1
Output: true (2^0 = 1)

Example 2:
Input: 16
Output: true (2^4 = 16)

Example 3:
Input: 3
Output: false

Constraints: -2^31 <= n <= 2^31 - 1`,
    difficulty: 'Easy',
    tags: ['Math', 'Bit Manipulation'],
    test_cases: [
      { input: '1', expected_output: 'true' },
      { input: '16', expected_output: 'true' },
      { input: '3', expected_output: 'false' },
      { input: '0', expected_output: 'false' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Rotate Array',
    slug: 'rotate-array',
    description: `Given an integer array nums, rotate the array to the right by k steps, where k is non-negative. Print the result as space-separated integers.

Example 1:
Input:
7
1 2 3 4 5 6 7
3
Output: 5 6 7 1 2 3 4

Example 2:
Input:
3
-1 -100 3 99
2
Output: 3 99 -1 -100`,
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers'],
    test_cases: [
      { input: '7\n1 2 3 4 5 6 7\n3', expected_output: '5 6 7 1 2 3 4' },
      { input: '4\n-1 -100 3 99\n2', expected_output: '3 99 -1 -100' },
    ],
    time_limit: 1000,
    memory_limit: 128,
  },
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-two-sorted-arrays',
    description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).

Input: first line has m numbers (nums1), second line has n numbers (nums2). If array is empty, the line will be "empty".

Example 1:
Input:
1 3
2
Output: 2.00000

Example 2:
Input:
1 2
3 4
Output: 2.50000`,
    difficulty: 'Hard',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    test_cases: [
      { input: '1 3\n2', expected_output: '2.00000' },
      { input: '1 2\n3 4', expected_output: '2.50000' },
      { input: '0 0\n0 0', expected_output: '0.00000' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    description: `Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

Input: first line is m n, then m lines of the grid (space-separated 1s and 0s).

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
Output: 3`,
    difficulty: 'Medium',
    tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Graph'],
    test_cases: [
      { input: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0', expected_output: '1' },
      { input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', expected_output: '3' },
    ],
    time_limit: 2000,
    memory_limit: 256,
  },
];

async function initTables() {
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
    `);
    console.log('Tables created.');
  } finally {
    client.release();
  }
}

async function seed() {
  console.log('Seeding database...');
  await initTables();
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
