'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, Trophy, CheckCircle, Clock, Loader, Flame, Swords } from 'lucide-react';
import { authApi, submissionsApi, leaderboardApi } from '@/lib/api';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const statusColor: Record<string, string> = {
  Accepted: 'text-green-400', 'Wrong Answer': 'text-red-400',
  'Time Limit Exceeded': 'text-yellow-400', 'Runtime Error': 'text-orange-400',
};

const heatColor: Record<string, string> = {
  none: 'bg-gray-800 text-gray-600',
  weak: 'bg-red-900/60 text-red-300',
  medium: 'bg-yellow-900/60 text-yellow-300',
  strong: 'bg-green-900/60 text-green-300',
};

const badgeColors: Record<string, string> = {
  red: 'bg-red-500/20 border-red-500/40 text-red-300',
  orange: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  yellow: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  purple: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
  blue: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  green: 'bg-green-500/20 border-green-500/40 text-green-300',
  gray: 'bg-gray-700/50 border-gray-600 text-gray-300',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [rank, setRank] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const _hydrated = useAuthStore(s => s._hydrated);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hydrated) return;
    if (!user) { router.push('/login'); return; }
    Promise.all([
      authApi.me().then(r => setProfile(r.data)),
      submissionsApi.history({ limit: 10 } as any).then(r => setSubmissions(r.data)),
      leaderboardApi.myRank().then(r => setRank(r.data)).catch(() => {}),
      api.get('/skills/heatmap').then(r => setSkills(r.data)).catch(() => {}),
      api.get('/badges/my').then(r => setBadges(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user, router, _hydrated]);

  if (loading || !profile) return <div className="flex items-center justify-center min-h-screen"><Loader className="animate-spin text-blue-400" size={32} /></div>;

  const acceptanceRate = profile.total_submissions > 0
    ? Math.round((profile.total_solved / profile.total_submissions) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 pt-24 pb-12">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold">
            {profile.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {profile.role === 'admin' && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs">Admin</span>}
            </div>
            <p className="text-gray-400 text-sm">{profile.email}</p>
            <p className="text-gray-500 text-xs mt-1">Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          {profile.streak > 0 && (
            <div className="text-center">
              <div className="flex items-center gap-1 text-orange-400 text-2xl font-bold"><Flame size={24} />{profile.streak}</div>
              <div className="text-xs text-gray-400">day streak</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { icon: CheckCircle, label: 'Solved', value: profile.total_solved, color: 'text-green-400' },
          { icon: Code2, label: 'Submissions', value: profile.total_submissions, color: 'text-blue-400' },
          { icon: Trophy, label: 'Rank', value: rank?.rank ? `#${rank.rank}` : 'Unranked', color: 'text-yellow-400' },
          { icon: Swords, label: 'Battle Wins', value: profile.battle_wins || 0, color: 'text-purple-400' },
          { icon: Clock, label: 'Acceptance', value: `${acceptanceRate}%`, color: 'text-cyan-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <Icon className={`mx-auto mb-1.5 ${color}`} size={22} />
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Points */}
      {profile.points > 0 && (
        <div className="glass rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Points</p>
            <p className="text-3xl font-bold text-blue-400">{profile.points} pts</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Earn points by solving problems, winning battles, and maintaining streaks</p>
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="glass rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-3">
            {badges.map(b => (
              <div key={b.id} title={b.desc}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${badgeColors[b.color] || badgeColors.gray}`}>
                <span className="text-lg">{b.icon}</span>
                <div>
                  <div className="font-medium text-xs">{b.label}</div>
                  <div className="text-xs opacity-70">{new Date(b.earned_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Heatmap */}
      {skills.length > 0 && (
        <div className="glass rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-2">Skill Heatmap</h2>
          <p className="text-xs text-gray-500 mb-4">Based on your solved problems by topic</p>
          <div className="flex flex-wrap gap-2">
            {skills.filter(s => s.total > 0).map(s => (
              <div key={s.tag} className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-transparent ${heatColor[s.level]}`}
                title={`${s.solved}/${s.total} solved`}>
                {s.tag}
                <span className="ml-1.5 opacity-60">{s.solved}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-800 inline-block" />Not started</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-900/60 inline-block" />Weak (1)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-900/60 inline-block" />Okay (2-4)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-900/60 inline-block" />Strong (5+)</span>
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800"><h2 className="font-semibold">Recent Submissions</h2></div>
        {submissions.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No submissions yet — go solve some problems!</div>
        ) : (
          <table className="w-full">
            <thead><tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <th className="px-6 py-3">Problem</th><th className="px-6 py-3">Language</th>
              <th className="px-6 py-3">Status</th><th className="px-6 py-3">Runtime</th><th className="px-6 py-3">Date</th>
            </tr></thead>
            <tbody>
              {submissions.map((s: any) => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-900/40 text-sm cursor-pointer"
                  onClick={() => router.push(`/problems/${s.slug}`)}>
                  <td className="px-6 py-3 font-medium text-blue-400">{s.title}</td>
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
