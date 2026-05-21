'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Play, ChevronDown, Clock, Cpu, CheckCircle, XCircle, Loader } from 'lucide-react';
import { problemsApi, submissionsApi } from '@/lib/api';
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
  python: '# Write your solution here\n\ndef solution():\n    pass\n\nsolution()',
  javascript: '// Write your solution here\n\nfunction solution() {\n    \n}\n\nsolution();',
  java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n    }\n}',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your solution here\n    return 0;\n}',
  c: '#include <stdio.h>\n\nint main() {\n    // Your solution here\n    return 0;\n}',
};

const statusColor: Record<string, string> = {
  Accepted: 'text-green-400', 'Wrong Answer': 'text-red-400',
  'Time Limit Exceeded': 'text-yellow-400', 'Runtime Error': 'text-orange-400',
  Pending: 'text-gray-400', 'System Error': 'text-red-500',
};

export default function ProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const [problem, setProblem] = useState<any>(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTERS.python);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');

  useEffect(() => {
    problemsApi.get(slug).then(r => setProblem(r.data)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    setCode(STARTERS[language] || '');
  }, [language]);

  useEffect(() => {
    if (!submissionId || !user) return;
    const socket = connectSocket(user.id);
    socket.emit('join_submission', submissionId);
    const handler = (data: any) => {
      if (data.submissionId === submissionId) {
        setResult(data);
        setSubmitting(false);
      }
    };
    socket.on('submission_update', handler);
    return () => { socket.off('submission_update', handler); };
  }, [submissionId, user]);

  const handleSubmit = async () => {
    if (!user) { window.location.href = '/login'; return; }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await submissionsApi.submit({ problemId: problem.id, language, code });
      setSubmissionId(res.data.id);
    } catch (err: any) {
      setSubmitting(false);
      setResult({ status: 'Error', error: err.response?.data?.error || 'Submission failed' });
    }
  };

  if (!problem) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="animate-spin text-blue-400" size={32} />
    </div>
  );

  return (
    <div className="flex h-screen pt-16 overflow-hidden">
      <div className="w-1/2 flex flex-col border-r border-gray-800 overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-xl font-bold">{problem.title}</h1>
            <span className={`text-sm font-medium ${statusColor[problem.difficulty] || ''} difficulty-${problem.difficulty?.toLowerCase()}`}>
              {problem.difficulty}
            </span>
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Clock size={14} /> {problem.time_limit}ms</span>
            <span className="flex items-center gap-1"><Cpu size={14} /> {problem.memory_limit}MB</span>
          </div>
          <div className="flex gap-1.5 mt-3">
            {problem.tags?.map((t: string) => (
              <span key={t} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">{t}</span>
            ))}
          </div>
        </div>

        <div className="flex border-b border-gray-800">
          {(['description', 'submissions'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-blue-400 text-white' : 'text-gray-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 prose prose-invert prose-sm max-w-none">
          {activeTab === 'description' ? (
            <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">{problem.description}</div>
          ) : (
            <p className="text-gray-400">Login to view your submissions</p>
          )}
        </div>
      </div>

      <div className="w-1/2 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <button onClick={handleSubmit} disabled={submitting}
            className="btn-primary flex items-center gap-2 text-sm">
            {submitting ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
            {submitting ? 'Running...' : 'Submit'}
          </button>
        </div>

        <div className="flex-1">
          <MonacoEditor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language}
            value={code}
            onChange={(v) => setCode(v || '')}
            theme="vs-dark"
            options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 } }}
          />
        </div>

        {result && (
          <div className="border-t border-gray-800 p-4 bg-gray-900/50 max-h-48 overflow-y-auto">
            <div className={`flex items-center gap-2 font-semibold mb-2 ${statusColor[result.status] || 'text-white'}`}>
              {result.status === 'Accepted' ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {result.status}
              {result.runtime && <span className="text-gray-400 font-normal text-sm">· {result.runtime}ms</span>}
            </div>
            {result.testResults?.map((tr: any, i: number) => (
              <div key={i} className={`text-xs px-2 py-1 rounded mb-1 flex items-center gap-2 ${tr.passed ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                {tr.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                Test {tr.testCase}: {tr.passed ? 'Passed' : tr.status}
                {tr.runtime && ` · ${tr.runtime}ms`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
