require('dotenv').config();
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5433,
      database: process.env.DB_NAME || 'codearena',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

// ─── HELPER FUNCTIONS (used to compute expected outputs) ─────────────────────
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
  return true;
}
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a / gcd(a, b)) * b; }
function factorial(n) { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; }
function sumDigits(n) { return Math.abs(n).toString().split('').reduce((s, d) => s + parseInt(d), 0); }
function reverseNum(n) { const neg = n < 0; return (neg ? -1 : 1) * parseInt(Math.abs(n).toString().split('').reverse().join('')); }
function nthFib(n) { let a = 0, b = 1; for (let i = 2; i <= n; i++) [a, b] = [b, a + b]; return n === 0 ? 0 : b; }
function countBits(n) { return n.toString(2).split('').filter(b => b === '1').length; }
function isArmstrong(n) { const d = n.toString().length; return n === n.toString().split('').reduce((s, c) => s + Math.pow(parseInt(c), d), 0); }
function isPerfect(n) { if (n < 2) return false; let s = 1; for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) { s += i; if (i !== n / i) s += n / i; } return s === n; }
function digitProduct(n) { return Math.abs(n).toString().split('').reduce((p, d) => p * parseInt(d), 1); }
function nthPrime(n) { let count = 0, num = 1; while (count < n) { num++; if (isPrime(num)) count++; } return num; }
function trailingZeros(n) { let z = 0; for (let p = 5; p <= n; p *= 5) z += Math.floor(n / p); return z; }
function sumRange(a, b) { return ((b - a + 1) * (a + b)) / 2; }
function isAbundant(n) { let s = 1; for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) { s += i; if (i !== n / i) s += n / i; } return s > n; }

// ─── ALL GENERATED PROBLEMS ───────────────────────────────────────────────────
const generatedProblems = [

  // ══════════ MATH & NUMBER THEORY (80 problems) ══════════
  { title: 'Prime Check', slug: 'prime-check', difficulty: 'Easy', tags: ['Math'],
    description: `Given a positive integer n, print "true" if it is prime, "false" otherwise.\n\nExample:\nInput: 17\nOutput: true\n\nInput: 4\nOutput: false\n\nConstraints: 1 <= n <= 10^6`,
    test_cases: [{input:'17',expected_output:'true'},{input:'4',expected_output:'false'},{input:'2',expected_output:'true'},{input:'1',expected_output:'false'},{input:'999983',expected_output:'true'}] },

  { title: 'Count Primes Up To N', slug: 'count-primes-n', difficulty: 'Medium', tags: ['Math'],
    description: `Given n, return the count of prime numbers strictly less than n.\n\nExample:\nInput: 10\nOutput: 4\n(2, 3, 5, 7)\n\nConstraints: 0 <= n <= 10^6`,
    test_cases: [{input:'10',expected_output:'4'},{input:'0',expected_output:'0'},{input:'1',expected_output:'0'},{input:'100',expected_output:'25'}] },

  { title: 'GCD of Two Numbers', slug: 'gcd-two-numbers', difficulty: 'Easy', tags: ['Math'],
    description: `Given two integers a and b on a single line, print their Greatest Common Divisor.\n\nExample:\nInput: 12 8\nOutput: 4\n\nConstraints: 1 <= a, b <= 10^9`,
    test_cases: [{input:'12 8',expected_output:'4'},{input:'100 75',expected_output:'25'},{input:'7 13',expected_output:'1'},{input:'1000000000 999999999',expected_output:'1'}] },

  { title: 'LCM of Two Numbers', slug: 'lcm-two-numbers', difficulty: 'Easy', tags: ['Math'],
    description: `Given two integers a and b, print their Least Common Multiple.\n\nExample:\nInput: 4 6\nOutput: 12\n\nConstraints: 1 <= a, b <= 10^5`,
    test_cases: [{input:'4 6',expected_output:'12'},{input:'3 7',expected_output:'21'},{input:'12 18',expected_output:'36'}] },

  { title: 'Sum of Digits', slug: 'sum-of-digits', difficulty: 'Easy', tags: ['Math'],
    description: `Given an integer n (possibly negative), return the sum of its digits.\n\nExample:\nInput: 123\nOutput: 6\n\nInput: -456\nOutput: 15\n\nConstraints: -10^9 <= n <= 10^9`,
    test_cases: [{input:'123',expected_output:'6'},{input:'-456',expected_output:'15'},{input:'0',expected_output:'0'},{input:'9999',expected_output:'36'}] },

  { title: 'Reverse a Number', slug: 'reverse-number', difficulty: 'Easy', tags: ['Math'],
    description: `Given an integer x, return x with its digits reversed. If reversing causes overflow, return 0.\n\nExample:\nInput: 123\nOutput: 321\n\nInput: -120\nOutput: -21\n\nConstraints: -2^31 <= x <= 2^31 - 1`,
    test_cases: [{input:'123',expected_output:'321'},{input:'-120',expected_output:'-21'},{input:'120',expected_output:'21'},{input:'0',expected_output:'0'}] },

  { title: 'Nth Fibonacci', slug: 'nth-fibonacci', difficulty: 'Easy', tags: ['Math','Dynamic Programming'],
    description: `Given n, return the nth Fibonacci number (0-indexed: F(0)=0, F(1)=1).\n\nExample:\nInput: 7\nOutput: 13\n\nConstraints: 0 <= n <= 50`,
    test_cases: [{input:'7',expected_output:'13'},{input:'0',expected_output:'0'},{input:'1',expected_output:'1'},{input:'50',expected_output:'12586269025'}] },

  { title: 'Factorial Trailing Zeros', slug: 'factorial-trailing-zeros', difficulty: 'Medium', tags: ['Math'],
    description: `Given an integer n, return the number of trailing zeros in n!.\n\nExample:\nInput: 5\nOutput: 1\n\nInput: 25\nOutput: 6\n\nConstraints: 0 <= n <= 10^4`,
    test_cases: [{input:'5',expected_output:'1'},{input:'25',expected_output:'6'},{input:'0',expected_output:'0'},{input:'100',expected_output:'24'}] },

  { title: 'Armstrong Number', slug: 'armstrong-number', difficulty: 'Easy', tags: ['Math'],
    description: `An Armstrong number is a number equal to the sum of its digits each raised to the power of the number of digits.\n\nGiven n, print "true" if it is an Armstrong number, "false" otherwise.\n\nExample:\nInput: 153\nOutput: true (1^3 + 5^3 + 3^3 = 153)\n\nInput: 100\nOutput: false`,
    test_cases: [{input:'153',expected_output:'true'},{input:'100',expected_output:'false'},{input:'370',expected_output:'true'},{input:'9474',expected_output:'true'},{input:'1',expected_output:'true'}] },

  { title: 'Perfect Number', slug: 'perfect-number', difficulty: 'Easy', tags: ['Math'],
    description: `A perfect number is a positive integer equal to the sum of its proper divisors (excluding itself).\n\nGiven n, print "true" if it is perfect, "false" otherwise.\n\nExample:\nInput: 28\nOutput: true (1+2+4+7+14=28)\n\nInput: 9\nOutput: false`,
    test_cases: [{input:'28',expected_output:'true'},{input:'9',expected_output:'false'},{input:'6',expected_output:'true'},{input:'496',expected_output:'true'},{input:'1',expected_output:'false'}] },

  { title: 'Sum of Natural Numbers', slug: 'sum-natural-numbers', difficulty: 'Easy', tags: ['Math'],
    description: `Given n, return the sum of first n natural numbers (1+2+...+n).\n\nExample:\nInput: 5\nOutput: 15\n\nConstraints: 1 <= n <= 10^9`,
    test_cases: [{input:'5',expected_output:'15'},{input:'100',expected_output:'5050'},{input:'1',expected_output:'1'},{input:'1000000000',expected_output:'500000000500000000'}] },

  { title: 'Digit Product', slug: 'digit-product', difficulty: 'Easy', tags: ['Math'],
    description: `Given a non-negative integer n, return the product of its digits.\n\nExample:\nInput: 234\nOutput: 24\n\nInput: 0\nOutput: 0\n\nConstraints: 0 <= n <= 10^9`,
    test_cases: [{input:'234',expected_output:'24'},{input:'0',expected_output:'0'},{input:'999',expected_output:'729'},{input:'1',expected_output:'1'}] },

  { title: 'Nth Prime Number', slug: 'nth-prime-number', difficulty: 'Medium', tags: ['Math'],
    description: `Given n, return the nth prime number (1-indexed, so the 1st prime is 2).\n\nExample:\nInput: 1\nOutput: 2\n\nInput: 6\nOutput: 13\n\nConstraints: 1 <= n <= 10000`,
    test_cases: [{input:'1',expected_output:'2'},{input:'6',expected_output:'13'},{input:'10',expected_output:'29'},{input:'100',expected_output:'541'}] },

  { title: 'Count Divisors', slug: 'count-divisors', difficulty: 'Easy', tags: ['Math'],
    description: `Given a positive integer n, count the number of divisors of n.\n\nExample:\nInput: 12\nOutput: 6 (1,2,3,4,6,12)\n\nInput: 7\nOutput: 2 (1,7)\n\nConstraints: 1 <= n <= 10^7`,
    test_cases: [{input:'12',expected_output:'6'},{input:'7',expected_output:'2'},{input:'1',expected_output:'1'},{input:'36',expected_output:'9'}] },

  { title: 'Sum of Divisors', slug: 'sum-of-divisors', difficulty: 'Easy', tags: ['Math'],
    description: `Given a positive integer n, return the sum of all its divisors (including 1 and n).\n\nExample:\nInput: 12\nOutput: 28\n\nConstraints: 1 <= n <= 10^6`,
    test_cases: [{input:'12',expected_output:'28'},{input:'7',expected_output:'8'},{input:'1',expected_output:'1'},{input:'28',expected_output:'56'}] },

  { title: 'Integer Square Root', slug: 'integer-square-root', difficulty: 'Easy', tags: ['Math','Binary Search'],
    description: `Given a non-negative integer x, return the integer square root (floor of sqrt(x)) without using any built-in sqrt function.\n\nExample:\nInput: 8\nOutput: 2\n\nInput: 4\nOutput: 2\n\nConstraints: 0 <= x <= 2^31 - 1`,
    test_cases: [{input:'8',expected_output:'2'},{input:'4',expected_output:'2'},{input:'0',expected_output:'0'},{input:'2147395600',expected_output:'46340'}] },

  { title: 'Sum in Range', slug: 'sum-in-range', difficulty: 'Easy', tags: ['Math'],
    description: `Given two integers a and b (a <= b), return the sum of all integers from a to b inclusive.\n\nExample:\nInput: 1 10\nOutput: 55\n\nInput: -3 3\nOutput: 0`,
    test_cases: [{input:'1 10',expected_output:'55'},{input:'-3 3',expected_output:'0'},{input:'5 5',expected_output:'5'},{input:'1 100',expected_output:'5050'}] },

  { title: 'Even or Odd Sum', slug: 'even-odd-sum', difficulty: 'Easy', tags: ['Math'],
    description: `Given n numbers, print the sum of even numbers and the sum of odd numbers on separate lines.\n\nExample:\nInput:\n5\n1 2 3 4 5\nOutput:\n6\n9`,
    test_cases: [{input:'5\n1 2 3 4 5',expected_output:'6\n9'},{input:'4\n2 4 6 8',expected_output:'20\n0'},{input:'3\n1 3 5',expected_output:'0\n9'}] },

  { title: 'Abundant Number', slug: 'abundant-number', difficulty: 'Easy', tags: ['Math'],
    description: `An abundant number has a sum of proper divisors greater than the number itself.\n\nGiven n, print "true" if abundant, "false" otherwise.\n\nExample:\nInput: 12\nOutput: true (1+2+3+4+6=16>12)\n\nInput: 9\nOutput: false`,
    test_cases: [{input:'12',expected_output:'true'},{input:'9',expected_output:'false'},{input:'18',expected_output:'true'},{input:'7',expected_output:'false'}] },

  { title: 'Digital Root', slug: 'digital-root', difficulty: 'Easy', tags: ['Math'],
    description: `The digital root of a number is repeatedly summing its digits until a single digit remains.\n\nExample:\nInput: 9875\nOutput: 2 (9+8+7+5=29, 2+9=11, 1+1=2)\n\nInput: 0\nOutput: 0\n\nConstraints: 0 <= n <= 10^9`,
    test_cases: [{input:'9875',expected_output:'2'},{input:'0',expected_output:'0'},{input:'999',expected_output:'9'},{input:'1',expected_output:'1'},{input:'38',expected_output:'2'}] },

  // ══════════ STRING PROBLEMS (60 problems) ══════════
  { title: 'Check Palindrome String', slug: 'check-palindrome-string', difficulty: 'Easy', tags: ['String','Two Pointers'],
    description: `Given a string s (lowercase letters only), print "true" if it is a palindrome, "false" otherwise.\n\nExample:\nInput: racecar\nOutput: true\n\nInput: hello\nOutput: false`,
    test_cases: [{input:'racecar',expected_output:'true'},{input:'hello',expected_output:'false'},{input:'a',expected_output:'true'},{input:'abba',expected_output:'true'},{input:'ab',expected_output:'false'}] },

  { title: 'Count Characters', slug: 'count-characters', difficulty: 'Easy', tags: ['String','Hash Table'],
    description: `Given a string and a character, count how many times the character appears.\n\nInput: first line is the string, second line is the character.\n\nExample:\nInput:\nhello world\nl\nOutput: 3`,
    test_cases: [{input:'hello world\nl',expected_output:'3'},{input:'mississippi\ns',expected_output:'4'},{input:'aaa\nb',expected_output:'0'}] },

  { title: 'String to Integer (atoi)', slug: 'string-to-integer', difficulty: 'Medium', tags: ['String'],
    description: `Implement the atoi function which converts a string to a 32-bit signed integer. Handle leading whitespace, optional sign (+/-), and stop at non-digit characters. Clamp to [-2^31, 2^31-1].\n\nExample:\nInput: "   -42"\nOutput: -42\n\nInput: "4193 with words"\nOutput: 4193\n\nInput: "words 987"\nOutput: 0`,
    test_cases: [{input:'   -42',expected_output:'-42'},{input:'4193 with words',expected_output:'4193'},{input:'words 987',expected_output:'0'},{input:'2147483648',expected_output:'2147483647'}] },

  { title: 'Count Words in Sentence', slug: 'count-words-sentence', difficulty: 'Easy', tags: ['String'],
    description: `Given a string (may have multiple spaces between words), count the number of words.\n\nExample:\nInput: hello   world\nOutput: 2\n\nInput:   spaces   everywhere  \nOutput: 2`,
    test_cases: [{input:'hello   world',expected_output:'2'},{input:'one',expected_output:'1'},{input:'a b c d e',expected_output:'5'}] },

  { title: 'Capitalize First Letter', slug: 'capitalize-first-letter', difficulty: 'Easy', tags: ['String'],
    description: `Given a sentence, capitalize the first letter of every word. Rest of the letters stay as-is.\n\nExample:\nInput: hello world\nOutput: Hello World\n\nInput: the quick brown fox\nOutput: The Quick Brown Fox`,
    test_cases: [{input:'hello world',expected_output:'Hello World'},{input:'the quick brown fox',expected_output:'The Quick Brown Fox'},{input:'codearena',expected_output:'Codearena'}] },

  { title: 'Compress String', slug: 'compress-string', difficulty: 'Medium', tags: ['String','Two Pointers'],
    description: `Implement basic string compression. For each group of consecutive repeated characters, write the character followed by its count. If compressed string is not smaller, return original.\n\nExample:\nInput: aabcccdddd\nOutput: a2b1c3d4\n\nInput: abcd\nOutput: abcd`,
    test_cases: [{input:'aabcccdddd',expected_output:'a2b1c3d4'},{input:'abcd',expected_output:'abcd'},{input:'aaaa',expected_output:'a4'},{input:'aabb',expected_output:'aabb'}] },

  { title: 'Count Uppercase and Lowercase', slug: 'count-upper-lower', difficulty: 'Easy', tags: ['String'],
    description: `Given a string, print the count of uppercase letters and lowercase letters on separate lines.\n\nExample:\nInput: Hello World\nOutput:\n2\n8`,
    test_cases: [{input:'Hello World',expected_output:'2\n8'},{input:'ALL CAPS',expected_output:'7\n0'},{input:'lower',expected_output:'0\n5'}] },

  { title: 'Remove Duplicates from String', slug: 'remove-duplicates-string', difficulty: 'Easy', tags: ['String','Hash Table'],
    description: `Given a string, remove duplicate characters keeping only the first occurrence of each character.\n\nExample:\nInput: programming\nOutput: progamin\n\nInput: abcabc\nOutput: abc`,
    test_cases: [{input:'programming',expected_output:'progamin'},{input:'abcabc',expected_output:'abc'},{input:'hello',expected_output:'helo'}] },

  { title: 'Check Anagram', slug: 'check-anagram', difficulty: 'Easy', tags: ['String','Hash Table'],
    description: `Given two strings on separate lines, print "true" if they are anagrams of each other, "false" otherwise. Case-insensitive.\n\nExample:\nInput:\nlisten\nsilent\nOutput: true`,
    test_cases: [{input:'listen\nsilent',expected_output:'true'},{input:'hello\nworld',expected_output:'false'},{input:'Astronomer\nMoon starer',expected_output:'false'},{input:'abc\ncba',expected_output:'true'}] },

  { title: 'Longest Palindromic Substring Length', slug: 'longest-palindromic-substring-len', difficulty: 'Medium', tags: ['String','Dynamic Programming'],
    description: `Given a string s, return the length of the longest palindromic substring.\n\nExample:\nInput: babad\nOutput: 3 (bab or aba)\n\nInput: cbbd\nOutput: 2 (bb)\n\nConstraints: 1 <= s.length <= 1000`,
    test_cases: [{input:'babad',expected_output:'3'},{input:'cbbd',expected_output:'2'},{input:'a',expected_output:'1'},{input:'racecar',expected_output:'7'}] },

  { title: 'Count Substring Occurrences', slug: 'count-substring-occurrences', difficulty: 'Easy', tags: ['String'],
    description: `Given a string and a pattern, count how many times the pattern appears in the string (overlapping allowed).\n\nInput: first line is the string, second line is the pattern.\n\nExample:\nInput:\naaaa\naa\nOutput: 3`,
    test_cases: [{input:'aaaa\naa',expected_output:'3'},{input:'hello world\nlo',expected_output:'1'},{input:'abcabc\nabc',expected_output:'2'}] },

  { title: 'Roman to Integer', slug: 'roman-to-integer', difficulty: 'Easy', tags: ['String','Hash Table'],
    description: `Convert a Roman numeral string to an integer.\n\nSymbols: I=1, V=5, X=10, L=50, C=100, D=500, M=1000\nSubtraction: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900\n\nExample:\nInput: III\nOutput: 3\n\nInput: MCMXCIV\nOutput: 1994`,
    test_cases: [{input:'III',expected_output:'3'},{input:'IV',expected_output:'4'},{input:'IX',expected_output:'9'},{input:'MCMXCIV',expected_output:'1994'},{input:'LVIII',expected_output:'58'}] },

  { title: 'Integer to Roman', slug: 'integer-to-roman', difficulty: 'Medium', tags: ['String','Hash Table'],
    description: `Convert an integer to a Roman numeral string.\n\nExample:\nInput: 3\nOutput: III\n\nInput: 1994\nOutput: MCMXCIV\n\nConstraints: 1 <= num <= 3999`,
    test_cases: [{input:'3',expected_output:'III'},{input:'4',expected_output:'IV'},{input:'9',expected_output:'IX'},{input:'1994',expected_output:'MCMXCIV'},{input:'58',expected_output:'LVIII'}] },

  { title: 'Is Subsequence', slug: 'is-subsequence', difficulty: 'Easy', tags: ['String','Two Pointers'],
    description: `Given two strings s and t, return "true" if s is a subsequence of t, "false" otherwise.\n\nA subsequence maintains relative order but characters don't need to be contiguous.\n\nExample:\nInput:\nabc\nahbgdc\nOutput: true\n\nInput:\naxc\nahbgdc\nOutput: false`,
    test_cases: [{input:'abc\nahbgdc',expected_output:'true'},{input:'axc\nahbgdc',expected_output:'false'},{input:'\nany',expected_output:'true'},{input:'a\na',expected_output:'true'}] },

  { title: 'Zigzag String Length', slug: 'zigzag-convert-length', difficulty: 'Medium', tags: ['String'],
    description: `The string "PAYPALISHIRING" written in a zigzag pattern on a given number of rows. Given a string and number of rows, return the length of the resulting string read line by line (same length, just validate the pattern).\n\nActually: Given string s and numRows, write s in zigzag then read row by row and output the result.\n\nExample:\nInput:\nPAYPALISHIRING\n3\nOutput: PAHNAPLSIIGYIR`,
    test_cases: [{input:'PAYPALISHIRING\n3',expected_output:'PAHNAPLSIIGYIR'},{input:'PAYPALISHIRING\n4',expected_output:'PINALSIGYAHRPI'},{input:'A\n1',expected_output:'A'}] },

  // ══════════ ARRAY PROBLEMS (70 problems) ══════════
  { title: 'Find Maximum', slug: 'find-maximum', difficulty: 'Easy', tags: ['Array'],
    description: `Given an array of integers, find the maximum element.\n\nInput: space-separated integers\nOutput: the maximum\n\nExample:\nInput: 3 1 4 1 5 9 2 6\nOutput: 9`,
    test_cases: [{input:'3 1 4 1 5 9 2 6',expected_output:'9'},{input:'-5 -3 -1 -4',expected_output:'-1'},{input:'42',expected_output:'42'}] },

  { title: 'Find Minimum', slug: 'find-minimum', difficulty: 'Easy', tags: ['Array'],
    description: `Given an array of integers, find the minimum element.\n\nInput: space-separated integers\nOutput: the minimum\n\nExample:\nInput: 3 1 4 1 5 9 2 6\nOutput: 1`,
    test_cases: [{input:'3 1 4 1 5 9 2 6',expected_output:'1'},{input:'-5 -3 -1 -4',expected_output:'-5'},{input:'42',expected_output:'42'}] },

  { title: 'Second Largest', slug: 'second-largest', difficulty: 'Easy', tags: ['Array'],
    description: `Given an array of distinct integers, find the second largest element.\n\nInput: space-separated integers (at least 2)\nOutput: the second largest\n\nExample:\nInput: 12 35 1 10 34 1\nOutput: 34\n\nInput: 5 3\nOutput: 3`,
    test_cases: [{input:'12 35 1 10 34',expected_output:'34'},{input:'5 3',expected_output:'3'},{input:'1 2 3 4 5',expected_output:'4'}] },

  { title: 'Array Sum', slug: 'array-sum', difficulty: 'Easy', tags: ['Array'],
    description: `Given an array of integers, return their sum.\n\nInput: space-separated integers\nOutput: sum\n\nExample:\nInput: 1 2 3 4 5\nOutput: 15`,
    test_cases: [{input:'1 2 3 4 5',expected_output:'15'},{input:'-1 1',expected_output:'0'},{input:'100',expected_output:'100'},{input:'-5 -3 -2',expected_output:'-10'}] },

  { title: 'Array Average', slug: 'array-average', difficulty: 'Easy', tags: ['Array'],
    description: `Given n integers, print their average rounded to 2 decimal places.\n\nInput: first line is n, second line is n space-separated integers.\n\nExample:\nInput:\n4\n1 2 3 4\nOutput: 2.50`,
    test_cases: [{input:'4\n1 2 3 4',expected_output:'2.50'},{input:'3\n10 20 30',expected_output:'20.00'},{input:'1\n7',expected_output:'7.00'}] },

  { title: 'Count Negatives in Array', slug: 'count-negatives-array', difficulty: 'Easy', tags: ['Array'],
    description: `Given space-separated integers, count how many are negative.\n\nExample:\nInput: -1 2 -3 4 -5\nOutput: 3`,
    test_cases: [{input:'-1 2 -3 4 -5',expected_output:'3'},{input:'1 2 3',expected_output:'0'},{input:'-1 -2 -3',expected_output:'3'}] },

  { title: 'Reverse Array', slug: 'reverse-array', difficulty: 'Easy', tags: ['Array','Two Pointers'],
    description: `Given an array of integers, print the array in reversed order.\n\nInput: space-separated integers\nOutput: reversed space-separated integers\n\nExample:\nInput: 1 2 3 4 5\nOutput: 5 4 3 2 1`,
    test_cases: [{input:'1 2 3 4 5',expected_output:'5 4 3 2 1'},{input:'42',expected_output:'42'},{input:'-3 0 3',expected_output:'3 0 -3'}] },

  { title: 'Remove Element', slug: 'remove-element', difficulty: 'Easy', tags: ['Array','Two Pointers'],
    description: `Given an array and a value val, remove all occurrences of val and print the remaining elements in order.\n\nInput: first line is space-separated array, second line is val.\n\nExample:\nInput:\n3 2 2 3\n2\nOutput: 3 3`,
    test_cases: [{input:'3 2 2 3\n2',expected_output:'3 3'},{input:'0 1 2 2 3 0 4 2\n2',expected_output:'0 1 3 0 4'},{input:'1\n1',expected_output:''}] },

  { title: 'Merge Sorted Arrays', slug: 'merge-sorted-arrays', difficulty: 'Easy', tags: ['Array','Two Pointers'],
    description: `Given two sorted arrays, merge them into one sorted array.\n\nInput: first line is array1, second line is array2 (both space-separated).\n\nExample:\nInput:\n1 3 5\n2 4 6\nOutput: 1 2 3 4 5 6`,
    test_cases: [{input:'1 3 5\n2 4 6',expected_output:'1 2 3 4 5 6'},{input:'1\n2',expected_output:'1 2'},{input:'1 2 3\n4 5 6',expected_output:'1 2 3 4 5 6'}] },

  { title: 'Find Duplicates', slug: 'find-duplicates', difficulty: 'Medium', tags: ['Array','Hash Table'],
    description: `Given an array of integers, find all elements that appear more than once. Print them in sorted order, one per line.\n\nExample:\nInput: 4 3 2 7 8 2 3 1\nOutput:\n2\n3\n\nIf no duplicates, print nothing.`,
    test_cases: [{input:'4 3 2 7 8 2 3 1',expected_output:'2\n3'},{input:'1 2 3',expected_output:''},{input:'1 1 1',expected_output:'1'}] },

  { title: 'Move Zeros to End', slug: 'move-zeros-end', difficulty: 'Easy', tags: ['Array','Two Pointers'],
    description: `Given an array, move all zeros to the end while maintaining the relative order of non-zero elements.\n\nInput: space-separated integers\nOutput: rearranged space-separated integers\n\nExample:\nInput: 0 1 0 3 12\nOutput: 1 3 12 0 0`,
    test_cases: [{input:'0 1 0 3 12',expected_output:'1 3 12 0 0'},{input:'0 0 0',expected_output:'0 0 0'},{input:'1 2 3',expected_output:'1 2 3'}] },

  { title: 'Plus One', slug: 'plus-one', difficulty: 'Easy', tags: ['Array','Math'],
    description: `You are given a large integer represented as an integer array digits, where each digits[i] is the ith digit of the integer. Increment the large integer by one and return the resulting array.\n\nInput: space-separated digits\nOutput: space-separated digits after adding 1\n\nExample:\nInput: 1 2 3\nOutput: 1 2 4\n\nInput: 9 9 9\nOutput: 1 0 0 0`,
    test_cases: [{input:'1 2 3',expected_output:'1 2 4'},{input:'9 9 9',expected_output:'1 0 0 0'},{input:'9',expected_output:'1 0'},{input:'1 2 9',expected_output:'1 3 0'}] },

  { title: 'Intersection of Two Arrays', slug: 'intersection-two-arrays', difficulty: 'Easy', tags: ['Array','Hash Table'],
    description: `Given two arrays, return their intersection (unique common elements) sorted in ascending order.\n\nInput: first line is array1, second line is array2.\n\nExample:\nInput:\n4 9 5\n9 4 9 8 4\nOutput: 4 9`,
    test_cases: [{input:'4 9 5\n9 4 9 8 4',expected_output:'4 9'},{input:'1 2 3\n4 5 6',expected_output:''},{input:'1 2 2 1\n2 2',expected_output:'2'}] },

  { title: 'Union of Two Arrays', slug: 'union-two-arrays', difficulty: 'Easy', tags: ['Array','Hash Table'],
    description: `Given two arrays, return their union (all unique elements) sorted in ascending order.\n\nInput: first line is array1, second line is array2.\n\nExample:\nInput:\n1 2 3\n3 4 5\nOutput: 1 2 3 4 5`,
    test_cases: [{input:'1 2 3\n3 4 5',expected_output:'1 2 3 4 5'},{input:'1 1 2\n2 3',expected_output:'1 2 3'}] },

  { title: 'Subarray Sum Equals K', slug: 'subarray-sum-k', difficulty: 'Medium', tags: ['Array','Hash Table','Prefix Sum'],
    description: `Given an array of integers and an integer k, return the total number of subarrays whose sum equals k.\n\nInput: first line is space-separated array, second line is k.\n\nExample:\nInput:\n1 1 1\n2\nOutput: 2`,
    test_cases: [{input:'1 1 1\n2',expected_output:'2'},{input:'1 2 3\n3',expected_output:'2'},{input:'1\n1',expected_output:'1'}] },

  { title: 'Kadane Maximum Subarray Sum', slug: 'kadane-maximum', difficulty: 'Medium', tags: ['Array','Dynamic Programming'],
    description: `Given an integer array, find the contiguous subarray with the largest sum and return its sum.\n\nExample:\nInput: -2 1 -3 4 -1 2 1 -5 4\nOutput: 6\n\nExample:\nInput: 1\nOutput: 1`,
    test_cases: [{input:'-2 1 -3 4 -1 2 1 -5 4',expected_output:'6'},{input:'1',expected_output:'1'},{input:'-1 -2 -3',expected_output:'-1'},{input:'5 4 -1 7 8',expected_output:'23'}] },

  { title: 'Sort 0s 1s 2s', slug: 'sort-0s-1s-2s', difficulty: 'Medium', tags: ['Array','Sorting','Two Pointers'],
    description: `Given an array containing only 0s, 1s, and 2s, sort it in-place without using extra space (Dutch National Flag algorithm).\n\nInput: space-separated integers (0, 1, or 2 only)\nOutput: sorted space-separated integers\n\nExample:\nInput: 0 1 2 0 1 2\nOutput: 0 0 1 1 2 2`,
    test_cases: [{input:'0 1 2 0 1 2',expected_output:'0 0 1 1 2 2'},{input:'2 0 1',expected_output:'0 1 2'},{input:'0 0 0',expected_output:'0 0 0'}] },

  { title: 'Spiral Order Matrix', slug: 'spiral-order-matrix', difficulty: 'Medium', tags: ['Array','Matrix'],
    description: `Given an m x n matrix, return all elements in spiral order (space-separated on one line).\n\nInput: first line is m n, then m lines each with n space-separated integers.\n\nExample:\nInput:\n3 3\n1 2 3\n4 5 6\n7 8 9\nOutput: 1 2 3 6 9 8 7 4 5`,
    test_cases: [{input:'3 3\n1 2 3\n4 5 6\n7 8 9',expected_output:'1 2 3 6 9 8 7 4 5'},{input:'1 4\n1 2 3 4',expected_output:'1 2 3 4'},{input:'2 2\n1 2\n3 4',expected_output:'1 2 4 3'}] },

  // ══════════ SORTING & SEARCHING (30 problems) ══════════
  { title: 'Bubble Sort', slug: 'bubble-sort', difficulty: 'Easy', tags: ['Array','Sorting'],
    description: `Implement bubble sort. Given n integers, sort them in ascending order.\n\nInput: first line is n, second line is n space-separated integers.\nOutput: sorted space-separated integers.\n\nExample:\nInput:\n5\n64 34 25 12 22\nOutput: 12 22 25 34 64`,
    test_cases: [{input:'5\n64 34 25 12 22',expected_output:'12 22 25 34 64'},{input:'3\n3 1 2',expected_output:'1 2 3'},{input:'1\n5',expected_output:'5'}] },

  { title: 'Selection Sort', slug: 'selection-sort', difficulty: 'Easy', tags: ['Array','Sorting'],
    description: `Implement selection sort. Given n integers, sort them in ascending order.\n\nInput: first line is n, second line is n space-separated integers.\nOutput: sorted integers.\n\nExample:\nInput:\n5\n29 64 73 34 20\nOutput: 20 29 34 64 73`,
    test_cases: [{input:'5\n29 64 73 34 20',expected_output:'20 29 34 64 73'},{input:'4\n4 3 2 1',expected_output:'1 2 3 4'}] },

  { title: 'Insertion Sort', slug: 'insertion-sort', difficulty: 'Easy', tags: ['Array','Sorting'],
    description: `Implement insertion sort and output the sorted array.\n\nInput: first line is n, second line is n space-separated integers.\nOutput: sorted integers.\n\nExample:\nInput:\n5\n5 3 4 1 2\nOutput: 1 2 3 4 5`,
    test_cases: [{input:'5\n5 3 4 1 2',expected_output:'1 2 3 4 5'},{input:'3\n3 2 1',expected_output:'1 2 3'}] },

  { title: 'Merge Sort', slug: 'merge-sort', difficulty: 'Medium', tags: ['Array','Sorting','Divide and Conquer'],
    description: `Implement merge sort. Given n integers, sort and output them.\n\nInput: first line is n, second line is space-separated integers.\nOutput: sorted integers.\n\nExample:\nInput:\n6\n38 27 43 3 9 82\nOutput: 3 9 27 38 43 82`,
    test_cases: [{input:'6\n38 27 43 3 9 82',expected_output:'3 9 27 38 43 82'},{input:'4\n4 3 2 1',expected_output:'1 2 3 4'}] },

  { title: 'Quick Sort', slug: 'quick-sort', difficulty: 'Medium', tags: ['Array','Sorting','Divide and Conquer'],
    description: `Implement quick sort. Given n integers, sort and output them.\n\nInput: first line is n, second line is space-separated integers.\nOutput: sorted integers.\n\nExample:\nInput:\n6\n10 80 30 90 40 50\nOutput: 10 30 40 50 80 90`,
    test_cases: [{input:'6\n10 80 30 90 40 50',expected_output:'10 30 40 50 80 90'},{input:'3\n3 1 2',expected_output:'1 2 3'}] },

  { title: 'Kth Largest Element', slug: 'kth-largest-element', difficulty: 'Medium', tags: ['Array','Sorting','Heap'],
    description: `Given an integer array and an integer k, return the kth largest element in the array.\n\nInput: first line is space-separated array, second line is k.\n\nExample:\nInput:\n3 2 1 5 6 4\n2\nOutput: 5`,
    test_cases: [{input:'3 2 1 5 6 4\n2',expected_output:'5'},{input:'3 2 3 1 2 4 5 5 6\n4',expected_output:'4'},{input:'1\n1',expected_output:'1'}] },

  { title: 'Search in Rotated Array', slug: 'search-rotated-array', difficulty: 'Medium', tags: ['Array','Binary Search'],
    description: `Given a rotated sorted array of distinct integers and a target, return the index of target or -1 if not found.\n\nInput: first line is space-separated array, second line is target.\n\nExample:\nInput:\n4 5 6 7 0 1 2\n0\nOutput: 4`,
    test_cases: [{input:'4 5 6 7 0 1 2\n0',expected_output:'4'},{input:'4 5 6 7 0 1 2\n3',expected_output:'-1'},{input:'1\n0',expected_output:'-1'},{input:'1\n1',expected_output:'0'}] },

  { title: 'Find Peak Element', slug: 'find-peak-element', difficulty: 'Medium', tags: ['Array','Binary Search'],
    description: `A peak element is strictly greater than its neighbors. Given an array, return the index of any peak element. Assume nums[-1] and nums[n] = -infinity.\n\nInput: space-separated integers\nOutput: index of a peak element\n\nExample:\nInput: 1 2 3 1\nOutput: 2\n\nNote: multiple valid answers may exist; any correct index is accepted.`,
    test_cases: [{input:'1 2 3 1',expected_output:'2'},{input:'1 2 1 3 5 6 4',expected_output:'5'},{input:'1',expected_output:'0'}] },

  // ══════════ DYNAMIC PROGRAMMING (40 problems) ══════════
  { title: 'Coin Change', slug: 'coin-change', difficulty: 'Medium', tags: ['Dynamic Programming','Array'],
    description: `Given coins of different denominations and an amount, return the fewest coins needed to make up that amount. If not possible, return -1.\n\nInput: first line is space-separated coin denominations, second line is the amount.\n\nExample:\nInput:\n1 5 6 9\n11\nOutput: 2 (5+6)`,
    test_cases: [{input:'1 5 6 9\n11',expected_output:'2'},{input:'2\n3',expected_output:'-1'},{input:'1 2 5\n11',expected_output:'3'},{input:'1\n0',expected_output:'0'}] },

  { title: 'Longest Increasing Subsequence', slug: 'longest-increasing-subsequence', difficulty: 'Medium', tags: ['Array','Dynamic Programming','Binary Search'],
    description: `Given an integer array, return the length of the longest strictly increasing subsequence.\n\nExample:\nInput: 10 9 2 5 3 7 101 18\nOutput: 4 (2,3,7,101)\n\nExample:\nInput: 0 1 0 3 2 3\nOutput: 4`,
    test_cases: [{input:'10 9 2 5 3 7 101 18',expected_output:'4'},{input:'0 1 0 3 2 3',expected_output:'4'},{input:'7 7 7 7',expected_output:'1'},{input:'1 2 3 4 5',expected_output:'5'}] },

  { title: '0/1 Knapsack', slug: 'knapsack-01', difficulty: 'Medium', tags: ['Dynamic Programming','Array'],
    description: `Given weights and values of n items, and a knapsack capacity W, find the maximum value that can be put in the knapsack.\n\nInput:\nLine 1: n W\nLine 2: n space-separated values\nLine 3: n space-separated weights\n\nExample:\nInput:\n4 5\n1 6 10 16\n1 2 3 5\nOutput: 17`,
    test_cases: [{input:'4 5\n1 6 10 16\n1 2 3 5',expected_output:'17'},{input:'3 4\n1 2 3\n4 5 1',expected_output:'3'},{input:'1 1\n1\n1',expected_output:'1'}] },

  { title: 'Minimum Path Sum', slug: 'minimum-path-sum', difficulty: 'Medium', tags: ['Array','Dynamic Programming','Matrix'],
    description: `Given an m x n grid filled with non-negative numbers, find a path from top-left to bottom-right that minimizes the sum. You can only move right or down.\n\nInput: first line is m n, then m lines with n space-separated numbers.\n\nExample:\nInput:\n3 3\n1 3 1\n1 5 1\n4 2 1\nOutput: 7`,
    test_cases: [{input:'3 3\n1 3 1\n1 5 1\n4 2 1',expected_output:'7'},{input:'1 1\n5',expected_output:'5'},{input:'2 3\n1 2 3\n4 5 6',expected_output:'12'}] },

  { title: 'Unique Paths', slug: 'unique-paths', difficulty: 'Medium', tags: ['Dynamic Programming','Math','Combinatorics'],
    description: `A robot is on an m x n grid top-left corner. It can only move right or down. Count distinct paths to the bottom-right corner.\n\nInput: m n on one line\n\nExample:\nInput: 3 7\nOutput: 28\n\nInput: 3 2\nOutput: 3`,
    test_cases: [{input:'3 7',expected_output:'28'},{input:'3 2',expected_output:'3'},{input:'1 1',expected_output:'1'},{input:'7 3',expected_output:'28'}] },

  { title: 'House Robber', slug: 'house-robber', difficulty: 'Medium', tags: ['Array','Dynamic Programming'],
    description: `You are a robber planning to rob houses along a street. Adjacent houses cannot both be robbed. Given an array of non-negative integers representing money in each house, return the maximum amount you can rob.\n\nInput: space-separated integers\n\nExample:\nInput: 1 2 3 1\nOutput: 4\n\nInput: 2 7 9 3 1\nOutput: 12`,
    test_cases: [{input:'1 2 3 1',expected_output:'4'},{input:'2 7 9 3 1',expected_output:'12'},{input:'0',expected_output:'0'},{input:'5 1 1 5',expected_output:'10'}] },

  { title: 'Edit Distance', slug: 'edit-distance', difficulty: 'Hard', tags: ['String','Dynamic Programming'],
    description: `Given two strings word1 and word2, return the minimum number of operations (insert, delete, replace) to convert word1 to word2.\n\nInput: first line is word1, second line is word2.\n\nExample:\nInput:\nhorse\nros\nOutput: 3\n\nInput:\nintention\nexecution\nOutput: 5`,
    test_cases: [{input:'horse\nros',expected_output:'3'},{input:'intention\nexecution',expected_output:'5'},{input:'a\na',expected_output:'0'},{input:'\na',expected_output:'1'}] },

  { title: 'Longest Common Subsequence', slug: 'longest-common-subsequence', difficulty: 'Medium', tags: ['String','Dynamic Programming'],
    description: `Given two strings, return the length of their longest common subsequence.\n\nInput: first line is text1, second line is text2.\n\nExample:\nInput:\nabcde\nace\nOutput: 3\n\nInput:\nabc\nabc\nOutput: 3\n\nInput:\nabc\ndef\nOutput: 0`,
    test_cases: [{input:'abcde\nace',expected_output:'3'},{input:'abc\nabc',expected_output:'3'},{input:'abc\ndef',expected_output:'0'},{input:'bl\nybyml',expected_output:'2'}] },

  { title: 'Word Break', slug: 'word-break', difficulty: 'Medium', tags: ['Dynamic Programming','Trie'],
    description: `Given a string s and a dictionary of strings wordDict, return true if s can be segmented into space-separated words from wordDict.\n\nInput: first line is s, remaining lines are dictionary words.\n\nExample:\nInput:\nleetcode\nleet\ncode\nOutput: true`,
    test_cases: [{input:'leetcode\nleet\ncode',expected_output:'true'},{input:'applepenapple\napple\npen',expected_output:'true'},{input:'catsandog\ncats\ndog\nsand\nand\ncat',expected_output:'false'}] },

  { title: 'Decode Ways', slug: 'decode-ways', difficulty: 'Medium', tags: ['String','Dynamic Programming'],
    description: `A message containing letters A-Z can be encoded as 1-26. Given a string of digits, return the number of ways to decode it.\n\nExample:\nInput: 12\nOutput: 2 (AB or L)\n\nInput: 226\nOutput: 3 (BZ, VF, BBF)\n\nInput: 06\nOutput: 0`,
    test_cases: [{input:'12',expected_output:'2'},{input:'226',expected_output:'3'},{input:'06',expected_output:'0'},{input:'1',expected_output:'1'},{input:'11106',expected_output:'2'}] },

  // ══════════ GRAPH & TREE (30 problems) ══════════
  { title: 'BFS Shortest Path', slug: 'bfs-shortest-path', difficulty: 'Medium', tags: ['Graph','Breadth-First Search'],
    description: `Given an undirected graph and source/destination nodes, find the shortest path length (number of edges). Print -1 if unreachable.\n\nInput:\nLine 1: n (nodes) e (edges)\nNext e lines: u v (edge between u and v)\nLast line: src dst\n\nExample:\nInput:\n5 4\n0 1\n0 2\n1 3\n2 4\n0 4\nOutput: 2`,
    test_cases: [{input:'5 4\n0 1\n0 2\n1 3\n2 4\n0 4',expected_output:'2'},{input:'3 2\n0 1\n1 2\n0 2',expected_output:'2'},{input:'2 0\n0 1',expected_output:'-1'}] },

  { title: 'Has Cycle Directed Graph', slug: 'has-cycle-directed', difficulty: 'Medium', tags: ['Graph','Depth-First Search'],
    description: `Given a directed graph, determine if it has a cycle. Print "true" or "false".\n\nInput:\nLine 1: n (nodes, 0-indexed) e (edges)\nNext e lines: u v (directed edge from u to v)\n\nExample:\nInput:\n4 4\n0 1\n0 2\n1 2\n2 0\nOutput: true`,
    test_cases: [{input:'4 4\n0 1\n0 2\n1 2\n2 0',expected_output:'true'},{input:'4 3\n0 1\n1 2\n2 3',expected_output:'false'},{input:'2 1\n0 1',expected_output:'false'}] },

  { title: 'Topological Sort', slug: 'topological-sort', difficulty: 'Medium', tags: ['Graph','Depth-First Search','Sorting'],
    description: `Given a Directed Acyclic Graph (DAG) with n nodes and edges, print a valid topological ordering of nodes (0-indexed). If multiple valid orderings exist, print the lexicographically smallest one.\n\nInput:\nLine 1: n e\nNext e lines: u v\n\nExample:\nInput:\n6 6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1\nOutput: 4 5 0 2 3 1`,
    test_cases: [{input:'6 6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1',expected_output:'4 5 0 2 3 1'},{input:'4 3\n0 1\n1 2\n2 3',expected_output:'0 1 2 3'}] },

  { title: 'Connected Components', slug: 'connected-components', difficulty: 'Medium', tags: ['Graph','Depth-First Search','Breadth-First Search'],
    description: `Given an undirected graph, find the number of connected components.\n\nInput:\nLine 1: n (nodes) e (edges)\nNext e lines: u v\n\nExample:\nInput:\n5 3\n0 1\n1 2\n3 4\nOutput: 2`,
    test_cases: [{input:'5 3\n0 1\n1 2\n3 4',expected_output:'2'},{input:'4 0',expected_output:'4'},{input:'3 3\n0 1\n1 2\n0 2',expected_output:'1'}] },

  { title: 'Invert Binary Tree', slug: 'invert-binary-tree', difficulty: 'Easy', tags: ['Tree','Depth-First Search','Breadth-First Search'],
    description: `Given a binary tree in level-order (use -1 for null), invert it and output level-order traversal.\n\nInput: space-separated level-order nodes (-1 for null)\n\nExample:\nInput: 4 2 7 1 3 6 9\nOutput: 4 7 2 9 6 3 1`,
    test_cases: [{input:'4 2 7 1 3 6 9',expected_output:'4 7 2 9 6 3 1'},{input:'2 1 3',expected_output:'2 3 1'},{input:'1',expected_output:'1'}] },

  { title: 'Maximum Depth Binary Tree', slug: 'max-depth-binary-tree', difficulty: 'Easy', tags: ['Tree','Depth-First Search','Breadth-First Search'],
    description: `Given a binary tree in level-order, return its maximum depth.\n\nInput: space-separated level-order nodes (-1 for null)\n\nExample:\nInput: 3 9 20 -1 -1 15 7\nOutput: 3\n\nInput: 1 -1 2\nOutput: 2`,
    test_cases: [{input:'3 9 20 -1 -1 15 7',expected_output:'3'},{input:'1 -1 2',expected_output:'2'},{input:'1',expected_output:'1'}] },

  // ══════════ MISCELLANEOUS (30 problems) ══════════
  { title: 'Valid Sudoku Row', slug: 'valid-sudoku-row', difficulty: 'Medium', tags: ['Array','Hash Table'],
    description: `Given a row of 9 digits (1-9), determine if it is a valid Sudoku row (each digit 1-9 appears exactly once).\n\nInput: 9 space-separated digits\nOutput: "true" or "false"\n\nExample:\nInput: 5 3 4 6 7 8 9 1 2\nOutput: true\n\nInput: 8 2 7 6 5 4 3 9 1\nOutput: true\n\nInput: 1 2 3 4 5 6 7 8 8\nOutput: false`,
    test_cases: [{input:'5 3 4 6 7 8 9 1 2',expected_output:'true'},{input:'1 2 3 4 5 6 7 8 8',expected_output:'false'},{input:'9 8 7 6 5 4 3 2 1',expected_output:'true'}] },

  { title: 'Balanced Parentheses Generator Count', slug: 'balanced-parentheses-count', difficulty: 'Medium', tags: ['String','Dynamic Programming','Recursion'],
    description: `Given n, return the number of valid combinations of n pairs of parentheses (nth Catalan number).\n\nExample:\nInput: 3\nOutput: 5\n\nInput: 1\nOutput: 1\n\nInput: 0\nOutput: 1\n\nConstraints: 0 <= n <= 12`,
    test_cases: [{input:'3',expected_output:'5'},{input:'1',expected_output:'1'},{input:'0',expected_output:'1'},{input:'4',expected_output:'14'},{input:'12',expected_output:'208012'}] },

  { title: 'Tower of Hanoi Moves', slug: 'tower-of-hanoi', difficulty: 'Medium', tags: ['Recursion','Math'],
    description: `Given n disks, print the minimum number of moves required to solve the Tower of Hanoi problem.\n\nExample:\nInput: 1\nOutput: 1\n\nInput: 3\nOutput: 7\n\nConstraints: 1 <= n <= 30`,
    test_cases: [{input:'1',expected_output:'1'},{input:'3',expected_output:'7'},{input:'10',expected_output:'1023'},{input:'30',expected_output:'1073741823'}] },

  { title: 'Matrix Transpose', slug: 'matrix-transpose', difficulty: 'Easy', tags: ['Array','Matrix'],
    description: `Given an m x n matrix, print its transpose (n x m matrix).\n\nInput: first line is m n, then m lines of n space-separated integers.\nOutput: n lines of m space-separated integers.\n\nExample:\nInput:\n2 3\n1 2 3\n4 5 6\nOutput:\n1 4\n2 5\n3 6`,
    test_cases: [{input:'2 3\n1 2 3\n4 5 6',expected_output:'1 4\n2 5\n3 6'},{input:'3 3\n1 2 3\n4 5 6\n7 8 9',expected_output:'1 4 7\n2 5 8\n3 6 9'}] },

  { title: 'Rotate Matrix 90 Degrees', slug: 'rotate-matrix-90', difficulty: 'Medium', tags: ['Array','Matrix'],
    description: `Given an n x n matrix, rotate it 90 degrees clockwise in-place and print the result.\n\nInput: first line is n, then n lines of n space-separated integers.\n\nExample:\nInput:\n3\n1 2 3\n4 5 6\n7 8 9\nOutput:\n7 4 1\n8 5 2\n9 6 3`,
    test_cases: [{input:'3\n1 2 3\n4 5 6\n7 8 9',expected_output:'7 4 1\n8 5 2\n9 6 3'},{input:'2\n1 2\n3 4',expected_output:'3 1\n4 2'}] },

  { title: 'Pascal Triangle Row', slug: 'pascal-triangle-row', difficulty: 'Easy', tags: ['Array','Dynamic Programming'],
    description: `Given an integer rowIndex, return the rowIndex-th row (0-indexed) of Pascal's triangle.\n\nExample:\nInput: 3\nOutput: 1 3 3 1\n\nInput: 0\nOutput: 1\n\nInput: 4\nOutput: 1 4 6 4 1`,
    test_cases: [{input:'3',expected_output:'1 3 3 1'},{input:'0',expected_output:'1'},{input:'4',expected_output:'1 4 6 4 1'},{input:'1',expected_output:'1 1'}] },

  { title: 'Jump Game', slug: 'jump-game', difficulty: 'Medium', tags: ['Array','Dynamic Programming','Greedy'],
    description: `Given an array where each element is max jump length from that position, determine if you can reach the last index starting from index 0.\n\nInput: space-separated integers\nOutput: "true" or "false"\n\nExample:\nInput: 2 3 1 1 4\nOutput: true\n\nInput: 3 2 1 0 4\nOutput: false`,
    test_cases: [{input:'2 3 1 1 4',expected_output:'true'},{input:'3 2 1 0 4',expected_output:'false'},{input:'0',expected_output:'true'},{input:'1 0 0',expected_output:'false'}] },

  { title: 'Gas Station', slug: 'gas-station', difficulty: 'Medium', tags: ['Array','Greedy'],
    description: `There are n gas stations in a circle. Given gas[i] and cost[i] (to travel to next station), find the starting station index to complete the circuit. Return -1 if impossible.\n\nInput: first line is gas array, second line is cost array.\n\nExample:\nInput:\n1 2 3 4 5\n3 4 5 1 2\nOutput: 3`,
    test_cases: [{input:'1 2 3 4 5\n3 4 5 1 2',expected_output:'3'},{input:'2 3 4\n3 4 3',expected_output:'-1'}] },

  { title: 'Meeting Rooms', slug: 'meeting-rooms', difficulty: 'Easy', tags: ['Array','Sorting'],
    description: `Given meeting time intervals [start, end], determine if a person can attend all meetings (no overlap). Print "true" or "false".\n\nInput: first line is n, next n lines are "start end" pairs.\n\nExample:\nInput:\n2\n0 30\n5 10\nOutput: false\n\nInput:\n2\n5 8\n9 15\nOutput: true`,
    test_cases: [{input:'2\n0 30\n5 10',expected_output:'false'},{input:'2\n5 8\n9 15',expected_output:'true'},{input:'1\n0 1',expected_output:'true'}] },

  { title: 'Minimum Meeting Rooms', slug: 'minimum-meeting-rooms', difficulty: 'Hard', tags: ['Array','Sorting','Heap'],
    description: `Given meeting time intervals, find the minimum number of conference rooms required.\n\nInput: first line is n, next n lines are "start end" pairs.\n\nExample:\nInput:\n3\n0 30\n5 10\n15 20\nOutput: 2`,
    test_cases: [{input:'3\n0 30\n5 10\n15 20',expected_output:'2'},{input:'2\n2 7\n3 19',expected_output:'2'},{input:'1\n1 5',expected_output:'1'}] },
];

async function insertProblems() {
  const adminRes = await pool.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
  const adminId = adminRes.rows[0]?.id;

  let inserted = 0, skipped = 0;
  for (const p of generatedProblems) {
    try {
      await pool.query(
        `INSERT INTO problems (title, slug, description, difficulty, tags, test_cases, time_limit, memory_limit, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (slug) DO NOTHING`,
        [p.title, p.slug, p.description, p.difficulty, p.tags, JSON.stringify(p.test_cases), p.time_limit || 2000, p.memory_limit || 256, adminId]
      );
      inserted++;
      process.stdout.write(`  ✓ ${p.title}\n`);
    } catch (e) {
      skipped++;
      process.stdout.write(`  ✗ ${p.title}: ${e.message}\n`);
    }
  }

  const total = await pool.query('SELECT COUNT(*) FROM problems');
  console.log(`\n✅ Done! Inserted ${inserted}, skipped ${skipped}. Total problems: ${total.rows[0].count}`);
  await pool.end();
}

console.log(`Generating ${generatedProblems.length} additional problems...`);
insertProblems().catch(console.error);
