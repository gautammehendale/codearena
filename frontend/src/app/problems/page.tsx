'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Loader, CheckCircle2 } from 'lucide-react';
import { problemsApi, submissionsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Problem {
  id: string; title: string; slug: string; difficulty: string;
  tags: string[]; accepted_count: number; submission_count: number;
}

const difficultyColor = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' };
const difficultyBg = { Easy: 'bg-green-400/10', Medium: 'bg-yellow-400/10', Hard: 'bg-red-400/10' };

export default function ProblemsPage() {
  const { user } = useAuthStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [filter, setFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);

  const fetchProblems = async (s: string, d: string) => {
    setLoading(true);
    const wakeTimer = setTimeout(() => setWaking(true), 5000);
    try {
      const res = await problemsApi.list({ search: s, difficulty: d, limit: 200 } as any);
      setProblems(res.data.problems || []);
      setWaking(false);
    } catch {
      setWaking(true);
      setTimeout(() => fetchProblems(s, d), 10000);
    } finally {
      clearTimeout(wakeTimer);
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchProblems(search, difficulty), 300);
    return () => clearTimeout(t);
  }, [search, difficulty]);

  // Fetch solved problems for logged-in user
  useEffect(() => {
    if (!user) return;
    submissionsApi.history({ limit: 500 } as any)
      .then(r => {
        const ids = new Set<string>(
          r.data.filter((s: any) => s.status === 'Accepted').map((s: any) => s.problem_id || s.id)
        );
        setSolvedIds(ids);
      })
      .catch(() => {});
  }, [user]);

  const displayed = problems.filter(p => {
    if (filter === 'solved') return solvedIds.has(p.id);
    if (filter === 'unsolved') return !solvedIds.has(p.id);
    return true;
  });

  const solvedCount = problems.filter(p => solvedIds.has(p.id)).length;

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
      {waking && (
        <div className="mb-4 px-4 py-2.5 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-center gap-2">
          <Loader size={14} className="animate-spin flex-shrink-0" />
          Server waking up (free tier) — loading shortly...
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Problems</h1>
          {user && problems.length > 0 && (
            <p className="text-gray-400 text-sm mt-1">
              <span className="text-green-400 font-medium">{solvedCount}</span> / {problems.length} solved
            </p>
          )}
        </div>
        <span className="text-gray-400 text-sm">{displayed.length} problems</span>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search problems..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-300">
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        {user && (
          <div className="flex rounded-lg border border-gray-700 overflow-hidden">
            {(['all', 'solved', 'unsolved'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Acceptance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td colSpan={6} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : displayed.map((p, i) => {
              const solved = solvedIds.has(p.id);
              return (
                <tr key={p.id} className={`border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors ${solved ? 'opacity-80' : ''}`}>
                  <td className="px-4 py-4">
                    {solved && <CheckCircle2 size={16} className="text-green-400" />}
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-sm">{i + 1}</td>
                  <td className="px-4 py-4">
                    <Link href={`/problems/${p.slug}`}
                      className={`hover:text-blue-400 transition-colors font-medium ${solved ? 'text-gray-300' : 'text-white'}`}>
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor[p.difficulty as keyof typeof difficultyColor]} ${difficultyBg[p.difficulty as keyof typeof difficultyBg]}`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {p.tags?.slice(0, 2).map(t => (
                        <span key={t} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400">
                    {p.submission_count > 0 ? `${Math.round((p.accepted_count / p.submission_count) * 100)}%` : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && displayed.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {filter !== 'all' ? `No ${filter} problems` : 'No problems found'}
          </div>
        )}
      </div>
    </div>
  );
}
