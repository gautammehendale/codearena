'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, CheckCircle2 } from 'lucide-react';
import { problemsApi } from '@/lib/api';

interface Problem {
  id: string; title: string; slug: string; difficulty: string;
  tags: string[]; accepted_count: number; submission_count: number;
}

const difficultyColor = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' };

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await problemsApi.list({ search, difficulty, limit: 200 } as any);
        setProblems(res.data.problems);
      } catch {}
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search, difficulty]);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Problems</h1>
        <span className="text-gray-400 text-sm">{problems.length} problems</span>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search problems..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={difficulty} onChange={e => setDifficulty(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-300"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Difficulty</th>
              <th className="px-6 py-3">Tags</th>
              <th className="px-6 py-3">Acceptance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : problems.map((p, i) => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                <td className="px-6 py-4 text-gray-500 text-sm">{i + 1}</td>
                <td className="px-6 py-4">
                  <Link href={`/problems/${p.slug}`} className="hover:text-blue-400 transition-colors font-medium">
                    {p.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${difficultyColor[p.difficulty as keyof typeof difficultyColor]}`}>
                    {p.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {p.tags?.slice(0, 3).map(t => (
                      <span key={t} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {p.submission_count > 0 ? `${Math.round((p.accepted_count / p.submission_count) * 100)}%` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && problems.length === 0 && (
          <div className="text-center py-16 text-gray-400">No problems found</div>
        )}
      </div>
    </div>
  );
}
