'use client';
import { useEffect, useState } from 'react';
import { Trophy, Medal, Loader } from 'lucide-react';
import { leaderboardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { connectSocket } from '@/lib/socket';

interface Entry { userId: string; username: string; score: number; rank: number; }

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<{ rank: number | null; score: number } | null>(null);

  useEffect(() => {
    leaderboardApi.global().then(r => { setEntries(r.data.leaderboard); setLoading(false); }).catch(() => setLoading(false));
    if (user) leaderboardApi.myRank().then(r => setMyRank(r.data)).catch(() => {});

    const socket = connectSocket(user?.id);
    socket.on('leaderboard_update', (data: Entry[]) => setEntries(data));
    return () => { socket.off('leaderboard_update'); };
  }, [user]);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={20} className="text-gray-300" />;
    if (rank === 3) return <Medal size={20} className="text-amber-600" />;
    return <span className="text-gray-400 text-sm w-5 text-center">{rank}</span>;
  };

  return (
    <div className="max-w-3xl mx-auto px-6 pt-24 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="text-yellow-400" size={32} />
        <h1 className="text-3xl font-bold">Leaderboard</h1>
      </div>

      {user && myRank && (
        <div className="glass rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-gray-400">Your Rank</span>
          <div className="flex items-center gap-6">
            <div className="text-center"><div className="text-2xl font-bold text-blue-400">#{myRank.rank || 'N/A'}</div><div className="text-xs text-gray-400">Rank</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-green-400">{myRank.score}</div><div className="text-xs text-gray-400">Points</div></div>
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-400" size={32} /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.userId}
                  className={`border-b border-gray-800/50 transition-colors ${user?.id === e.userId ? 'bg-blue-900/20' : 'hover:bg-gray-900/50'}`}>
                  <td className="px-6 py-4"><div className="flex items-center">{rankIcon(e.rank)}</div></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold">
                        {e.username?.[0]?.toUpperCase()}
                      </div>
                      <span className={`font-medium ${user?.id === e.userId ? 'text-blue-400' : ''}`}>{e.username}</span>
                      {user?.id === e.userId && <span className="text-xs bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded">You</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-green-400">{e.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && entries.length === 0 && (
          <div className="text-center py-16 text-gray-400">No entries yet. Solve problems to join the leaderboard!</div>
        )}
      </div>
    </div>
  );
}
