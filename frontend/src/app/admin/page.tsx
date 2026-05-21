'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Code2, Swords, Loader, Search } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface AdminUser {
  id: string; username: string; email: string; role: string;
  total_solved: number; total_submissions: number; points: number;
  streak: number; battle_wins: number; created_at: string;
  last_solved_date: string | null; submissions_this_week: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const _hydrated = useAuthStore(s => s._hydrated);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    if (!_hydrated) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    Promise.all([
      api.get('/stats/admin/users').then(r => setUsers(r.data)),
      api.get('/stats/public').then(r => setStats(r.data)),
    ]).catch(() => router.push('/')).finally(() => setLoading(false));
  }, [user, _hydrated]);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center pt-40"><Loader className="animate-spin text-blue-400" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Platform overview — visible only to admins</p>
        </div>
        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs">Admin Only</span>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'text-blue-400' },
          { icon: Code2, label: 'Problems', value: stats.totalProblems, color: 'text-green-400' },
          { icon: CheckCircle, label: 'Accepted Submissions', value: stats.totalSolved, color: 'text-yellow-400' },
          { icon: Swords, label: 'Registered Today', value: users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length, color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass rounded-xl p-5 text-center">
            <Icon className={`mx-auto mb-2 ${color}`} size={22} />
            <div className={`text-2xl font-bold ${color}`}>{value ?? '—'}</div>
            <div className="text-gray-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-4">
          <h2 className="font-semibold flex-1">All Users</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-56" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Solved</th>
              <th className="px-4 py-3">Submissions</th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Streak</th>
              <th className="px-4 py-3">Battle W</th>
              <th className="px-4 py-3">This Week</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last Active</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{u.username}</div>
                        {u.role === 'admin' && <div className="text-xs text-purple-400">admin</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-green-400 font-bold">{u.total_solved}</td>
                  <td className="px-4 py-3 text-gray-400">{u.total_submissions}</td>
                  <td className="px-4 py-3 text-blue-400 font-medium">{u.points}</td>
                  <td className="px-4 py-3 text-orange-400">{u.streak > 0 ? `🔥 ${u.streak}` : '—'}</td>
                  <td className="px-4 py-3 text-purple-400">{u.battle_wins || 0}</td>
                  <td className="px-4 py-3 text-gray-400">{u.submissions_this_week || 0}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.last_solved_date ? new Date(u.last_solved_date).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-gray-400">No users found</div>}
        </div>
      </div>
    </div>
  );
}
