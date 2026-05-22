'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Play, Clock, Cpu, CheckCircle, XCircle, Loader, Lightbulb, Lock, ChevronRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import { problemsApi, submissionsApi, hintsApi } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/lib/store';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function RunResultPanel({ result, onClose }: { result: any; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const allPassed = result.testResults?.every((t: any) => t.passed);

  return (
    <div className="border-t border-gray-800 bg-gray-950">
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 ${allPassed ? 'bg-green-950/40' : 'bg-red-950/30'}`}>
        {allPassed ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
        <span className={`text-sm font-semibold ${allPassed ? 'text-green-400' : 'text-red-400'}`}>
          {allPassed ? 'Sample Tests Passed' : result.status || 'Failed'}
        </span>
        <span className="text-xs text-gray-500 ml-1">— 2 sample cases</span>
        <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white"><X size={14} /></button>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {result.testResults?.map((tr: any, i: number) => (
          <div key={i} className="border-b border-gray-800/50 last:border-0">
            <button onClick={() => setExpanded(expanded === i ? null : i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-900/40 transition-colors ${tr.passed ? 'text-green-400' : 'text-red-400'}`}>
              {tr.passed ? <CheckCircle size={14} /> : <XCircle size={14} />}
              <span className="font-medium">Case {tr.testCase}: {tr.passed ? 'Passed' : tr.status}</span>
              {tr.runtime && <span className="text-gray-500 text-xs ml-1">{tr.runtime}ms</span>}
              <span className="ml-auto text-gray-600">{expanded === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
            </button>
            {expanded === i && !tr.passed && (
              <div className="px-4 pb-3 space-y-2 bg-gray-900/20">
                {tr.output !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your Output</p>
                    <pre className="bg-gray-900 border border-red-800/30 rounded px-3 py-2 text-xs text-red-300 font-mono overflow-x-auto">{tr.output || '(empty)'}</pre>
                  </div>
                )}
                {tr.expected !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expected</p>
                    <pre className="bg-gray-900 border border-green-800/30 rounded px-3 py-2 text-xs text-green-300 font-mono overflow-x-auto">{tr.expected}</pre>
                  </div>
                )}
                {tr.error && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Error</p>
                    <pre className="bg-gray-900 border border-yellow-800/30 rounded px-3 py-2 text-xs text-yellow-300 font-mono overflow-x-auto">{tr.error}</pre>
                  </div>
                )}
              </div>
            )}
            {expanded === i && tr.passed && (
              <div className="px-4 pb-3 bg-gray-900/20">
                <pre className="bg-gray-900 border border-green-800/30 rounded px-3 py-2 text-xs text-green-300 font-mono overflow-x-auto">{tr.output}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const LANGUAGES = [
  { value: 'python', label: 'Python 3.11' },
  { value: 'javascript', label: 'JavaScript (Node 20)' },
  { value: 'java', label: 'Java 17' },
  { value: 'cpp', label: 'C++ 17' },
  { value: 'c', label: 'C' },
];

const STARTERS: Record<string, string> = {
  python: 'import sys\ninput = sys.stdin.readline\n\n# Write your solution here\n\n',
  javascript: 'const lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");\n\n// Write your solution here\n\n',
  java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n    }\n}',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Your solution here\n    return 0;\n}',
  c: '#include <stdio.h>\n\nint main() {\n    // Your solution here\n    return 0;\n}',
};

const statusColor: Record<string, string> = {
  Accepted: 'text-green-400', 'Wrong Answer': 'text-red-400',
  'Time Limit Exceeded': 'text-yellow-400', 'Runtime Error': 'text-orange-400',
  Pending: 'text-gray-400', 'System Error': 'text-red-500',
};

const diffColor: Record<string, string> = {
  Easy: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  Hard: 'text-red-400 bg-red-400/10',
};

interface Hint { text: string; number: number; }

// Parse description into structured sections
function parseDescription(desc: string) {
  if (!desc) return { main: '', examples: [], constraints: '' };
  const lines = desc.split('\n');
  const examples: { input: string; output: string; explanation?: string }[] = [];
  let main = '';
  let constraints = '';
  let inExample = false;
  let inConstraints = false;
  let currentExample: any = {};
  let exampleLines: string[] = [];

  for (const line of lines) {
    if (line.match(/^Example\s*\d*:/i)) {
      if (currentExample.input !== undefined) examples.push({ ...currentExample });
      currentExample = {}; inExample = true; exampleLines = [];
    } else if (line.match(/^Constraints?:/i)) {
      if (currentExample.input !== undefined) { examples.push({ ...currentExample }); currentExample = {}; }
      inExample = false; inConstraints = true;
    } else if (inExample) {
      if (line.match(/^Input:/i)) currentExample.input = line.replace(/^Input:/i, '').trim();
      else if (line.match(/^Output:/i)) currentExample.output = line.replace(/^Output:/i, '').trim();
      else if (line.match(/^Explanation:/i)) currentExample.explanation = line.replace(/^Explanation:/i, '').trim();
      else if (currentExample.input === undefined) main += line + '\n';
      else if (currentExample.output === undefined && currentExample.input !== undefined) currentExample.input += '\n' + line;
      else if (currentExample.output !== undefined) currentExample.output += '\n' + line;
    } else if (inConstraints) {
      constraints += line + '\n';
    } else {
      if (!line.match(/^Example\s*\d*:/i)) main += line + '\n';
    }
  }
  if (currentExample.input !== undefined) examples.push(currentExample);

  return { main: main.trim(), examples, constraints: constraints.trim() };
}

export default function ProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const [problem, setProblem] = useState<any>(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTERS.python);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [runResult, setRunResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'hints'>('description');
  const [hints, setHints] = useState<Hint[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [loadingHint, setLoadingHint] = useState(false);
  const [hintError, setHintError] = useState('');

  useEffect(() => {
    problemsApi.get(slug).then(r => {
      setProblem(r.data);
      if (user) hintsApi.getStatus(r.data.id).then(s => setHintsUsed(s.data.hintsUsed)).catch(() => {});
    }).catch(() => {});
  }, [slug, user]);

  useEffect(() => { setCode(STARTERS[language] || ''); }, [language]);

  useEffect(() => {
    if (!submissionId || !user) return;
    const socket = connectSocket(user.id);
    socket.emit('join_submission', submissionId);
    const handler = (data: any) => {
      if (data.submissionId === submissionId) { setResult(data); setSubmitting(false); }
    };
    socket.on('submission_update', handler);
    return () => { socket.off('submission_update', handler); };
  }, [submissionId, user]);

  const handleRun = async () => {
    if (!user) { window.location.href = '/login'; return; }
    setRunning(true); setRunResult(null);
    try {
      const res = await submissionsApi.run({ problemId: problem.id, language, code });
      setRunResult(res.data);
    } catch (err: any) {
      setRunResult({ status: 'Error', testResults: [], error: err.response?.data?.error || 'Run failed' });
    } finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    if (!user) { window.location.href = '/login'; return; }
    setSubmitting(true); setResult(null);
    try {
      const res = await submissionsApi.submit({ problemId: problem.id, language, code });
      setSubmissionId(res.data.id);
    } catch (err: any) {
      setSubmitting(false);
      setResult({ status: 'Error', error: err.response?.data?.error || 'Submission failed' });
    }
  };

  const handleGetHint = async () => {
    if (!user) { window.location.href = '/login'; return; }
    if (hintsUsed >= 3) return;
    setLoadingHint(true); setHintError('');
    try {
      const res = await hintsApi.getHint({ problemId: problem.id, code, language });
      const { hint, hintNumber, hintsRemaining } = res.data;
      setHints(prev => [...prev, { text: hint, number: hintNumber }]);
      setHintsUsed(3 - hintsRemaining);
      setActiveTab('hints');
    } catch (err: any) {
      setHintError(err.response?.data?.message || 'Failed to get hint');
    } finally { setLoadingHint(false); }
  };

  if (!problem) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="animate-spin text-blue-400" size={32} />
    </div>
  );

  const parsed = parseDescription(problem.description);

  return (
    <div className="flex h-screen pt-16 overflow-hidden bg-gray-950">
      {/* Left Panel */}
      <div className="w-[45%] flex flex-col border-r border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800 bg-gray-900/40">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-xl font-bold text-white">{problem.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${diffColor[problem.difficulty] || ''}`}>
              {problem.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1.5"><Clock size={13} /> {problem.time_limit}ms</span>
            <span className="flex items-center gap-1.5"><Cpu size={13} /> {problem.memory_limit}MB</span>
            {problem.accepted_count > 0 && (
              <span className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-green-400" />
                {problem.submission_count > 0 ? `${Math.round((problem.accepted_count / problem.submission_count) * 100)}% accepted` : ''}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {problem.tags?.map((t: string) => (
              <span key={t} className="px-2.5 py-0.5 bg-gray-800 rounded-full text-xs text-gray-400 border border-gray-700">{t}</span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900/20">
          {(['description', 'hints'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize flex items-center gap-1.5 transition-all ${activeTab === tab ? 'border-b-2 border-blue-400 text-white bg-gray-900/40' : 'text-gray-400 hover:text-gray-200'}`}>
              {tab === 'hints' && <Lightbulb size={14} />}
              {tab}
              {tab === 'hints' && hintsUsed > 0 && (
                <span className="ml-0.5 bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">{hintsUsed}/3</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'description' ? (
            <div className="p-6 space-y-6">
              {/* Main description */}
              <div className="text-gray-200 text-[15px] leading-7 whitespace-pre-wrap">{parsed.main}</div>

              {/* Examples */}
              {parsed.examples.length > 0 && (
                <div className="space-y-4">
                  {parsed.examples.map((ex, i) => (
                    <div key={i} className="rounded-xl border border-gray-700 overflow-hidden">
                      <div className="bg-gray-800/60 px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Example {i + 1}
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Input</span>
                          <pre className="mt-1.5 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-green-300 font-mono overflow-x-auto">{ex.input}</pre>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Output</span>
                          <pre className="mt-1.5 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-blue-300 font-mono overflow-x-auto">{ex.output}</pre>
                        </div>
                        {ex.explanation && (
                          <div className="text-sm text-gray-400 bg-gray-800/40 rounded-lg px-4 py-2.5 border border-gray-700/50">
                            <span className="font-medium text-gray-300">Explanation: </span>{ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {parsed.constraints && (
                <div className="rounded-xl border border-gray-700 overflow-hidden">
                  <div className="bg-gray-800/60 px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">Constraints</div>
                  <div className="p-4">
                    {parsed.constraints.split('\n').filter(Boolean).map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-300 py-0.5">
                        <ChevronRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <code className="font-mono text-blue-200">{c.replace(/^[-•]\s*/, '')}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Progressive hints — no code, logic only.</p>
                <span className="text-xs text-gray-500">{3 - hintsUsed} remaining</span>
              </div>
              {hints.map((h) => (
                <div key={h.number} className="rounded-xl p-4 border-l-4 border-yellow-500/60 bg-yellow-500/5 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={15} className="text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-400">Hint {h.number}</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{h.text}</p>
                </div>
              ))}
              {Array.from({ length: 3 - hintsUsed }).map((_, i) => (
                <div key={i} className="rounded-xl p-4 opacity-30 border border-gray-700 flex items-center gap-2">
                  <Lock size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-500">Hint {hintsUsed + i + 1} — locked</span>
                </div>
              ))}
              {hintError && <p className="text-red-400 text-sm">{hintError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/50">
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-gray-200">
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleGetHint} disabled={loadingHint || hintsUsed >= 3}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {loadingHint ? <Loader size={14} className="animate-spin" /> : <Lightbulb size={14} />}
              {hintsUsed >= 3 ? 'No hints' : `Hint (${3 - hintsUsed})`}
            </button>
            <button onClick={handleRun} disabled={running || submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 transition-colors disabled:opacity-40">
              {running ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
              {running ? 'Running...' : 'Run'}
            </button>
            <button onClick={handleSubmit} disabled={submitting || running}
              className="btn-primary flex items-center gap-2 text-sm">
              {submitting ? <Loader size={15} className="animate-spin" /> : <Play size={15} />}
              {submitting ? 'Judging...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={language === 'cpp' || language === 'c' ? language : language}
            value={code}
            onChange={v => setCode(v || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
            }}
          />
        </div>

        {/* Run Results */}
        {runResult && (
          <RunResultPanel result={runResult} onClose={() => setRunResult(null)} />
        )}

        {/* Submit Results (all test cases) */}
        {result && (
          <div className="border-t border-gray-800 bg-gray-900/60 max-h-52 overflow-y-auto">
            <div className={`flex items-center gap-2.5 px-4 py-3 font-semibold border-b border-gray-800 ${statusColor[result.status] || 'text-white'}`}>
              {result.status === 'Accepted' ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {result.status}
              {result.runtime && <span className="text-gray-400 font-normal text-sm ml-1">· {result.runtime}ms</span>}
              {result.status === 'Accepted' && <span className="ml-auto text-sm bg-green-500/10 text-green-400 px-3 py-0.5 rounded-full">All tests passed ✓</span>}
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {result.testResults?.map((tr: any, i: number) => (
                <div key={i} className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${tr.passed ? 'bg-green-900/20 text-green-300 border border-green-800/40' : 'bg-red-900/20 text-red-300 border border-red-800/40'}`}>
                  {tr.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  <span>Test {tr.testCase}: {tr.passed ? 'Passed' : tr.status}</span>
                  {tr.runtime && <span className="ml-auto text-gray-400">{tr.runtime}ms</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
