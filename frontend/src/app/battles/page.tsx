'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, Clock, Users, Trophy, Loader, CheckCircle, Calendar, Bot } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { connectSocket } from '@/lib/socket';

interface Schedule {
  enrollmentOpen: boolean; enrollmentOpens: string; nextBattleTime: string;
  matchingTime: string; lobbyTime: string; isLobbyOpen: boolean; isBattleActive: boolean;
  minutesUntilBattle: number;
}

function Countdown({ target }: { target: string }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const update = () => setDiff(Math.max(0, new Date(target).getTime() - Date.now()));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [target]);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <span className="font-mono text-2xl font-bold text-blue-400">
      {h > 0 && `${h}h `}{String(m).padStart(2, '0')}m {String(s).padStart(2, '0')}s
    </span>
  );
}

export default function BattlesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [enrollment, setEnrollment] = useState<{ enrolled: boolean; totalEnrolled: number; status: string | null; loaded: boolean }>({ enrolled: false, totalEnrolled: 0, status: null, loaded: false });
  const [loading, setLoading] = useState(false);
  const [activeBattle, setActiveBattle] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const fetchAll = async () => {
    const [sched, lb] = await Promise.all([
      api.get('/battles/schedule').then(r => r.data),
      api.get('/battles/leaderboard').then(r => r.data).catch(() => []),
    ]);
    setSchedule(sched);
    setLeaderboard(lb);
    if (user) {
      const [enroll, active] = await Promise.all([
        api.get('/battles/enrollment').then(r => r.data).catch(() => ({ enrolled: false, totalEnrolled: 0, status: null })),
        api.get('/battles/active').then(r => r.data).catch(() => ({ battle: null })),
      ]);
      setEnrollment({ ...enroll, loaded: true });
      if (active.battle) setActiveBattle(active.battle);
    }
  };

  useEffect(() => {
    fetchAll();
    // NO polling — rely on socket events only to avoid hammering Render free tier
    const socket = connectSocket(user?.id);
    socket.emit('join_battles');
    socket.on('matchmaking_complete', fetchAll);
    socket.on('enrollment_update', (data: any) => {
      setEnrollment(p => ({ ...p, totalEnrolled: data.totalEnrolled }));
    });
    socket.on('battle_matched', (data: any) => {
      fetchAll();
      if (data.battleId) router.push(`/battles/${data.battleId}`);
    });
    socket.on('battle_lobby_open', (data: any) => {
      fetchAll();
      if (data.battleId) router.push(`/battles/${data.battleId}`);
    });
    socket.on('battle_start', (data: any) => {
      if (data.battleId) router.push(`/battles/${data.battleId}`);
    });
    return () => {
      socket.off('matchmaking_complete');
      socket.off('enrollment_update');
      socket.off('battle_matched');
      socket.off('battle_lobby_open');
      socket.off('battle_start');
    };
  }, [user]);

  const handleEnroll = async () => {
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    try {
      if (enrollment.enrolled) {
        await api.delete('/battles/enroll');
        setEnrollment(p => ({ ...p, enrolled: false, totalEnrolled: p.totalEnrolled - 1 }));
      } else {
        const res = await api.post('/battles/enroll');
        setEnrollment({ enrolled: true, totalEnrolled: res.data.totalEnrolled, status: 'enrolled', loaded: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed';
      // Show inline instead of browser alert
      setEnrollment(p => ({ ...p, _error: msg } as any));
      setTimeout(() => setEnrollment(p => ({ ...p, _error: undefined } as any)), 4000);
    } finally { setLoading(false); }
  };

  if (!schedule) return <div className="flex justify-center pt-40"><Loader className="animate-spin text-blue-400" size={32} /></div>;

  return (
    <div className="max-w-5xl mx-auto px-6 pt-24 pb-12">
      <div className="flex items-center gap-3 mb-2">
        <Swords className="text-purple-400" size={32} />
        <h1 className="text-3xl font-bold">1v1 Battles</h1>
        <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs">Every Hour</span>
      </div>
      <p className="text-gray-400 mb-8">Battles every 30 mins. Enroll up to 30 mins before. Matching at 5 mins before. Battle starts on time.</p>

      {/* Active Battle Banner */}
      {activeBattle && (
        <div className="glass border-purple-500/40 rounded-xl p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <Swords size={20} />
            </div>
            <div>
              <p className="font-semibold">Active battle vs {activeBattle.opponentName}</p>
              <p className="text-sm text-gray-400">Status: <span className="text-purple-400 capitalize">{activeBattle.status}</span></p>
            </div>
          </div>
          <button onClick={() => router.push(`/battles/${activeBattle.id}`)} className="btn-primary">Go to Arena</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Today's Schedule */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Calendar size={18} className="text-blue-400" /> Today's Schedule</h2>
          <div className="space-y-3">
            {[
              { label: 'Enrollment opens', time: schedule.enrollmentOpens, done: schedule.enrollmentOpen || schedule.isBattleActive },
              { label: 'Matching', time: schedule.matchingTime, done: schedule.isLobbyOpen || schedule.isBattleActive },
              { label: 'Battle starts', time: schedule.nextBattleTime, done: schedule.isBattleActive },
            ].map(({ label, time, done }) => (
              <div key={label} className={`flex items-center justify-between py-2 border-b border-gray-800/60 ${done ? 'opacity-50' : ''}`}>
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  {done && <CheckCircle size={14} className="text-green-400" />}{label}
                </span>
                <span className="text-sm font-medium">{new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            {schedule.enrollmentOpen && !schedule.isBattleActive && (
              <>
                <p className="text-xs text-gray-500 mb-1">Enrollment closes in</p>
                <Countdown target={schedule.matchingTime} />
              </>
            )}
            {!schedule.enrollmentOpen && !schedule.isBattleActive && (
              <>
                <p className="text-xs text-gray-500 mb-1">Battle starts in</p>
                <Countdown target={schedule.nextBattleTime} />
              </>
            )}
            {schedule.isBattleActive && <p className="text-green-400 font-semibold">⚔️ Battle is LIVE</p>}
          </div>
        </div>

        {/* Enrollment Card */}
        <div className="glass rounded-xl p-6 flex flex-col">
          <h2 className="font-semibold mb-2 flex items-center gap-2"><Users size={18} className="text-purple-400" /> Enrollment</h2>
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
            <div className="text-5xl font-bold text-purple-400 mb-1">
              {enrollment.loaded ? enrollment.totalEnrolled : '—'}
            </div>
            <div className="text-gray-400 text-sm mb-6">players enrolled today</div>
            {enrollment.totalEnrolled % 2 === 1 && enrollment.totalEnrolled > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-gray-800/50 px-3 py-1.5 rounded-full">
                <Bot size={14} /> Odd number — 1 player gets a bot opponent
              </div>
            )}
            {!enrollment.loaded ? (
              <div className="w-full py-3 rounded-xl text-center text-sm bg-gray-800/50 text-gray-600 animate-pulse">Loading...</div>
            ) : schedule.enrollmentOpen ? (
              <button onClick={handleEnroll} disabled={loading || !!activeBattle}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${enrollment.enrolled ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                {loading ? <Loader size={16} className="animate-spin mx-auto" /> : enrollment.enrolled ? '✓ Enrolled — Click to withdraw' : 'Enroll for Today\'s Battle'}
              </button>
            ) : (
              <div className={`w-full py-3 rounded-xl text-center text-sm ${enrollment.enrolled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500'}`}>
                {enrollment.enrolled ? `✓ You're enrolled — ${enrollment.status}` : 'Enrollment closed for today'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="glass rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-4">How 1v1 Battles Work</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: '1', icon: '📋', title: 'Enroll', desc: 'Open 30 mins before each battle (:30 and :00)' },
            { step: '2', icon: '🎯', title: 'Get Matched', desc: '5 mins before start. Odd player gets a bot' },
            { step: '3', icon: '⚙️', title: 'Choose Difficulty', desc: '2 min lobby — both agree on Easy/Medium/Hard' },
            { step: '4', icon: '⚔️', title: 'Battle!', desc: 'Exclusive problem revealed at start. First to solve wins 50 pts' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-sm font-semibold mb-1">{s.title}</div>
              <div className="text-xs text-gray-400">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Battle Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" />
            <h2 className="font-semibold">Battle Leaderboard</h2>
          </div>
          <table className="w-full">
            <thead><tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <th className="px-6 py-3">Rank</th><th className="px-6 py-3">Player</th>
              <th className="px-6 py-3">Wins</th><th className="px-6 py-3">Win Rate</th>
            </tr></thead>
            <tbody>
              {leaderboard.slice(0, 10).map((p, i) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-900/40 text-sm">
                  <td className="px-6 py-3 text-gray-400">#{i + 1}</td>
                  <td className="px-6 py-3 font-medium">{p.username}</td>
                  <td className="px-6 py-3 text-green-400 font-bold">{p.battle_wins}</td>
                  <td className="px-6 py-3 text-blue-400">{p.win_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
