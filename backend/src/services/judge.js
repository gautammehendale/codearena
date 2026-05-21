const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

const LANGUAGE_CONFIG = {
  python: { image: 'python:3.11-alpine', ext: 'py', cmd: (f) => `python3 /code/${f}` },
  javascript: { image: 'node:20-alpine', ext: 'js', cmd: (f) => `node /code/${f}` },
  java: { image: 'openjdk:17-alpine', ext: 'java', cmd: (f) => `sh -c "cd /code && javac ${f} && java ${f.replace('.java', '')}"` },
  cpp: { image: 'gcc:latest', ext: 'cpp', cmd: (f) => `sh -c "g++ -o /code/sol /code/${f} && /code/sol"` },
  c: { image: 'gcc:latest', ext: 'c', cmd: (f) => `sh -c "gcc -o /code/sol /code/${f} && /code/sol"` },
};

async function runCode(code, language, testCases, timeLimit = 2000, memoryLimit = 256) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  const results = [];
  const tmpDir = `/tmp/codearena-${uuidv4()}`;
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    const filename = language === 'java' ? 'Main.java' : `solution.${config.ext}`;
    const codeContent = language === 'java' ? code.replace(/public class \w+/, 'public class Main') : code;
    await fs.writeFile(path.join(tmpDir, filename), codeContent);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const inputFile = path.join(tmpDir, `input_${i}.txt`);
      await fs.writeFile(inputFile, tc.input || '');

      const startTime = Date.now();
      try {
        const timeSecs = Math.ceil(timeLimit / 1000);
        const dockerCmd = [
          'docker run --rm',
          `--memory="${memoryLimit}m"`,
          '--cpus="0.5"',
          '--network=none',
          '--read-only',
          `--tmpfs /tmp:size=10m`,
          `-v ${tmpDir}:/code:ro`,
          `-v ${inputFile}:/input.txt:ro`,
          `--ulimit nproc=50:50`,
          `-i ${config.image}`,
          `sh -c "${config.cmd(filename)} < /input.txt"`,
        ].join(' ');

        const { stdout, stderr } = await Promise.race([
          execAsync(dockerCmd, { timeout: timeLimit + 2000 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Time Limit Exceeded')), timeLimit + 1000))
        ]);

        const runtime = Date.now() - startTime;
        const output = stdout.trim();
        const expected = (tc.expected_output || tc.output || '').trim();
        const passed = output === expected;

        results.push({ testCase: i + 1, passed, status: passed ? 'passed' : 'Wrong Answer', runtime, output, expected, stderr: stderr?.slice(0, 200) });
      } catch (err) {
        const runtime = Date.now() - startTime;
        const status = err.message.includes('Time Limit') ? 'Time Limit Exceeded' : err.message.includes('memory') ? 'Memory Limit Exceeded' : 'Runtime Error';
        results.push({ testCase: i + 1, passed: false, status, runtime, error: err.message.slice(0, 200) });
      }
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return results;
}

module.exports = { runCode };
