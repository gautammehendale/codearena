const axios = require('axios');
const logger = require('../utils/logger');

// Judge0 CE — community instance, no API key required
const JUDGE0_URL = process.env.JUDGE0_URL || 'https://ce.judge0.com';

const LANG_IDS = {
  python: 71,      // Python 3.8.1
  javascript: 63,  // Node.js 12.14.0
  java: 62,        // Java 13.0.1
  cpp: 54,         // C++ 17 (GCC 9.2.0)
  c: 50,           // C (GCC 9.2.0)
};

async function runWithJudge0(code, language, testCases, timeLimit, memoryLimit) {
  const langId = LANG_IDS[language];
  if (!langId) throw new Error(`Unsupported language: ${language}`);

  const results = [];
  const javaCode = language === 'java' ? code.replace(/public class \w+/, 'public class Main') : code;
  const finalCode = language === 'java' ? javaCode : code;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const startTime = Date.now();
    try {
      const res = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: finalCode,
          language_id: langId,
          stdin: tc.input || '',
          cpu_time_limit: Math.min((timeLimit || 2000) / 1000, 10),
          memory_limit: (memoryLimit || 256) * 1024,
        },
        { timeout: 20000, headers: { 'Content-Type': 'application/json' } }
      );

      const runtime = Date.now() - startTime;
      const { stdout, stderr, status, compile_output } = res.data;
      const statusId = status?.id;

      if (statusId === 6) {
        results.push({ testCase: i + 1, passed: false, status: 'Compilation Error', runtime, error: (compile_output || '').slice(0, 300) });
        continue;
      }
      if (statusId === 5) {
        results.push({ testCase: i + 1, passed: false, status: 'Time Limit Exceeded', runtime });
        continue;
      }
      if (statusId >= 7 && statusId <= 12) {
        results.push({ testCase: i + 1, passed: false, status: 'Runtime Error', runtime, error: (stderr || '').slice(0, 300) });
        continue;
      }

      const output = (stdout || '').trim();
      const expected = (tc.expected_output || tc.output || '').trim();
      const passed = output === expected;

      results.push({ testCase: i + 1, passed, status: passed ? 'passed' : 'Wrong Answer', runtime, output, expected });
    } catch (err) {
      logger.error(`Judge0 error test ${i + 1}:`, err.message);
      results.push({ testCase: i + 1, passed: false, status: 'System Error', runtime: Date.now() - startTime, error: err.message });
    }
  }
  return results;
}

module.exports = { runWithJudge0, isAvailable: () => true }; // always available — no key needed
