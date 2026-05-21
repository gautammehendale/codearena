'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, Trophy, CheckCircle, Clock, Loader } from 'lucide-react';
import { authApi, submissionsApi, leaderboardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const statusColor: Record<string, string> = {
  Accepted: 'text-green-400', 'Wrong Answer': 'text-red-400',
  'Time Limit Exceeded': 'text-yellow-400', 'Runtime Error': 'text-orange-400',
  Pending: 'text-gray-400',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [rank, setRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    Promise.all([
      authApi.me().then(r => setProfile(r.data)),
      submissionsApi.history({ limit: 10 } as any).then(r => setSubmissions(r.data)),
      leaderboardApi.myRank().then(r => setRank(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user, router]);

  if (loading || !profile) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="animate-spin text-blue-400" size={32} />
    </div>
  );

  const acceptanceRate = profile.total_submissions > 0
    ? Math.round((profile.total_solved / profile.total_submissions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-24 pb-12">
      <div className="glass rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold">
            {profile.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
            <p className="text-gray-500 text-xs mt-1">Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          {profile.role === 'admin' && (
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">Admin</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: CheckCircle, label: 'Problems Solved', value: profile.total_solved, color: 'text-green-400' },
          { icon: Code2, label: 'Total Submissions', value: profile.total_submissions, color: 'text-blue-400' },
          { icon: Trophy, label: 'Global Rank', value: rank?.rank ? `#${rank.rank}` : 'Unranked', color: 'text-yellow-400' },
          { icon: Clock, label: 'Acceptance Rate', value: `${acceptanceRate}%`, color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass rounded-xl p-5 text-center">
            <Icon className={`mx-auto mb-2 ${color}`} size={24} />
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-gray-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold">Recent Submissions</h2>
        </div>
        {submissions.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No submissions yet — go solve some problems!</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="px-6 py-3">Problem</th>
                <th className="px-6 py-3">Language</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Runtime</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s: any) => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors text-sm">
                  <td className="px-6 py-3 font-medium text-blue-400 hover:underline cursor-pointer" onClick={() => router.push(`/problems/${s.slug}`)}>{s.title}</td>
                  <td className="px-6 py-3 text-gray-400 capitalize">{s.language}</td>
                  <td className={`px-6 py-3 font-medium ${statusColor[s.status] || 'text-white'}`}>{s.status}</td>
                  <td className="px-6 py-3 text-gray-400">{s.runtime ? `${s.runtime}ms` : '—'}</td>
                  <td className="px-6 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
