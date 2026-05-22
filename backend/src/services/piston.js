const axios = require('axios');
const logger = require('../utils/logger');

const PISTON_URL = 'https://emkc.org/api/v2/piston';

const LANG_MAP = {
  python: { language: 'python', version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  java: { language: 'java', version: '15.0.2' },
  cpp: { language: 'c++', version: '10.2.0' },
  c: { language: 'c', version: '10.2.0' },
};

async function runWithPiston(code, language, testCases, timeLimit) {
  const lang = LANG_MAP[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const startTime = Date.now();
    try {
      const res = await axios.post(`${PISTON_URL}/execute`, {
        language: lang.language,
        version: lang.version,
        files: [{ name: 'solution', content: language === 'java' ? code.replace(/public class \w+/, 'public class Main') : code }],
        stdin: tc.input || '',
        run_timeout: Math.min(timeLimit || 2000, 10000),
        compile_timeout: 10000,
      }, { timeout: 15000 });

      const runtime = Date.now() - startTime;
      const { run, compile } = res.data;

      if (compile?.stderr) {
        results.push({ testCase: i + 1, passed: false, status: 'Compilation Error', runtime, error: compile.stderr.slice(0, 300) });
        continue;
      }

      if (run.signal === 'SIGKILL') {
        results.push({ testCase: i + 1, passed: false, status: 'Time Limit Exceeded', runtime });
        continue;
      }

      if (run.stderr && !run.stdout) {
        results.push({ testCase: i + 1, passed: false, status: 'Runtime Error', runtime, error: run.stderr.slice(0, 300) });
        continue;
      }

      const output = run.stdout.trim();
      const expected = (tc.expected_output || tc.output || '').trim();
      const passed = output === expected;

      results.push({ testCase: i + 1, passed, status: passed ? 'passed' : 'Wrong Answer', runtime, output, expected });
    } catch (err) {
      logger.error(`Piston error test ${i + 1}:`, err.message);
      results.push({ testCase: i + 1, passed: false, status: 'System Error', runtime: Date.now() - startTime, error: err.message });
    }
  }

  return results;
}

module.exports = { runWithPiston };
