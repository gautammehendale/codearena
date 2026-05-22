const axios = require('axios');
const logger = require('../utils/logger');

// Judge0 language IDs
const LANG_IDS = {
  python: 71,      // Python 3.8
  javascript: 63,  // Node.js 12
  java: 62,        // Java 13
  cpp: 54,         // C++ 17
  c: 50,           // C (GCC 9.2)
};

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY;

async function runWithJudge0(code, language, testCases, timeLimit, memoryLimit) {
  const langId = LANG_IDS[language];
  if (!langId) throw new Error(`Unsupported language: ${language}`);

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      // Submit
      const submitRes = await axios.post(
        `${JUDGE0_URL}/submissions`,
        {
          source_code: Buffer.from(code).toString('base64'),
          language_id: langId,
          stdin: Buffer.from(tc.input || '').toString('base64'),
          expected_output: Buffer.from((tc.expected_output || tc.output || '').trim()).toString('base64'),
          cpu_time_limit: timeLimit / 1000,
          memory_limit: memoryLimit * 1024,
          base64_encoded: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': JUDGE0_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
          params: { base64_encoded: true, wait: false },
        }
      );

      const token = submitRes.data.token;

      // Poll for result
      let result;
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(r => setTimeout(r, 1000));
        const res = await axios.get(`${JUDGE0_URL}/submissions/${token}`, {
          headers: {
            'X-RapidAPI-Key': JUDGE0_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
          params: { base64_encoded: true, fields: 'status,stdout,stderr,time,memory,compile_output' },
        });
        if (res.data.status?.id > 2) { result = res.data; break; }
      }

      if (!result) throw new Error('Judge timeout');

      const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString().trim() : '';
      const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : '';
      const expected = (tc.expected_output || tc.output || '').trim();
      const statusId = result.status?.id;

      let status, passed;
      if (statusId === 3) { passed = stdout === expected; status = passed ? 'passed' : 'Wrong Answer'; }
      else if (statusId === 4) { passed = false; status = 'Wrong Answer'; }
      else if (statusId === 5) { passed = false; status = 'Time Limit Exceeded'; }
      else if (statusId === 6) { passed = false; status = 'Compilation Error'; }
      else { passed = false; status = result.status?.description || 'Runtime Error'; }

      results.push({
        testCase: i + 1, passed, status,
        runtime: Math.round((parseFloat(result.time) || 0) * 1000),
        memory: Math.round((result.memory || 0) / 1024),
        output: stdout, expected,
        stderr: stderr.slice(0, 200),
      });
    } catch (err) {
      logger.error(`Judge0 error for test ${i + 1}:`, err.message);
      results.push({ testCase: i + 1, passed: false, status: 'System Error', error: err.message });
    }
  }

  return results;
}

module.exports = { runWithJudge0, isAvailable: () => !!JUDGE0_KEY };
