'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Play, Clock, Cpu, CheckCircle, XCircle, Loader, Lightbulb, Lock } from 'lucide-react';
import { problemsApi, submissionsApi, hintsApi } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/lib/store';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  { value: 'python', label: 'Python 3.11' },
  { value: 'javascript', label: 'JavaScript (Node 20)' },
  { value: 'java', label: 'Java 17' },
  { value: 'cpp', label: 'C++17' },
  { value: 'c', label: 'C' },
];

const STARTERS: Record<string, string> = {
  python: '# Write your solution here\n\nimport sys\ninput = sys.stdin.readline\n\n',
  javascript: '// Write your solution here\nconst lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");\n\n',
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
  Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400',
};

interface Hint { text: string; number: number; }

export default function ProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const [problem, setProblem] = useState<any>(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTERS.python);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
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

  return (
    <div className="flex h-screen pt-16 overflow-hidden">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col border-r border-gray-800 overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold">{problem.title}</h1>
            <span className={`text-sm font-medium ${diffColor[problem.difficulty] || ''}`}>{problem.difficulty}</span>
          </div>
          <div className="flex gap-4 text-sm text-gray-400 mb-3">
            <span className="flex items-center gap-1"><Clock size={14} />{problem.time_limit}ms</span>
            <span className="flex items-center gap-1"><Cpu size={14} />{problem.memory_limit}MB</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {problem.tags?.map((t: string) => (
              <span key={t} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">{t}</span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['description', 'hints'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors flex items-center gap-1.5 ${activeTab === tab ? 'border-b-2 border-blue-400 text-white' : 'text-gray-400 hover:text-white'}`}>
              {tab === 'hints' && <Lightbulb size={14} />}{tab}
              {tab === 'hints' && hintsUsed > 0 && (
                <span className="ml-1 bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">{hintsUsed}/3</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'description' ? (
            <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-sm">{problem.description}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Get up to 3 progressive hints. No full code — only logic guidance.</p>
                <span className="text-xs text-gray-500">{3 - hintsUsed} remaining</span>
              </div>

              {hints.map((h) => (
                <div key={h.number} className="glass rounded-xl p-4 border-l-4 border-yellow-500/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-400">Hint {h.number}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{h.text}</p>
                </div>
              ))}

              {/* Locked hints */}
              {Array.from({ length: 3 - hintsUsed }).map((_, i) => (
                <div key={i} className="glass rounded-xl p-4 opacity-40 border-l-4 border-gray-700">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-500">Hint {hintsUsed + i + 1} — locked</span>
                  </div>
                </div>
              ))}

              {hintError && <p className="text-red-400 text-sm">{hintError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleGetHint} disabled={loadingHint || hintsUsed >= 3}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {loadingHint ? <Loader size={14} className="animate-spin" /> : <Lightbulb size={14} />}
              {hintsUsed >= 3 ? 'No hints left' : `Hint (${3 - hintsUsed} left)`}
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2 text-sm">
              {submitting ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
              {submitting ? 'Running...' : 'Submit'}
            </button>
          </div>
        </div>

        <div className="flex-1">
          <MonacoEditor
            height="100%"
            language={language === 'cpp' || language === 'c' ? language : language === 'javascript' ? 'javascript' : language}
            value={code}
            onChange={v => setCode(v || '')}
            theme="vs-dark"
            options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 } }}
          />
        </div>

        {result && (
          <div className="border-t border-gray-800 p-4 bg-gray-900/50 max-h-52 overflow-y-auto">
            <div className={`flex items-center gap-2 font-semibold mb-2 ${statusColor[result.status] || 'text-white'}`}>
              {result.status === 'Accepted' ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {result.status}
              {result.runtime && <span className="text-gray-400 font-normal text-sm">· {result.runtime}ms</span>}
            </div>
            {result.testResults?.map((tr: any, i: number) => (
              <div key={i} className={`text-xs px-2 py-1 rounded mb-1 flex items-center gap-2 ${tr.passed ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                {tr.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                Test {tr.testCase}: {tr.passed ? 'Passed' : tr.status}{tr.runtime ? ` · ${tr.runtime}ms` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
