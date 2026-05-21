'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Code2, Trophy, Zap, Users, ChevronRight, Terminal, Swords, Flame } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

const features = [
  { icon: Code2, title: 'Multi-Language Editor', desc: 'Monaco Editor (VS Code engine) supporting Python, JavaScript, Java, C++, and C — the same editor millions use daily.' },
  { icon: Zap, title: 'Real-Time Judging', desc: 'Docker-sandboxed execution with sub-2s feedback. Results stream live via WebSocket as each test case runs.' },
  { icon: Trophy, title: 'Live Leaderboard', desc: 'Redis sorted-set rankings update in real time. Every accepted solution moves you up.' },
  { icon: Swords, title: '1v1 Battle Mode', desc: 'Enroll daily, get matched, choose difficulty in the lobby, then race head-to-head on the same problem at 6 PM sharp.' },
  { icon: Users, title: 'Timed Contests', desc: 'Join structured contests with countdown timers, isolated leaderboards, and problem reveals.' },
  { icon: Flame, title: 'Streaks & Badges', desc: 'Daily streaks, First Blood badges, and milestone rewards. CodeArena remembers your grind.' },
];

interface Stats { totalUsers: number; totalProblems: number; totalSolved: number; }

export default function Home() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalProblems: 0, totalSolved: 0 });

  useEffect(() => {
    api.get('/stats/public').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const statItems = [
    { label: 'Problems', value: stats.totalProblems || '100+' },
    { label: 'Languages', value: '5' },
    { label: 'Solutions Submitted', value: stats.totalSolved > 0 ? stats.totalSolved.toLocaleString() : '0' },
    { label: 'Active Users', value: stats.totalUsers > 0 ? stats.totalUsers.toLocaleString() : '0' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-6 pt-24 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            <Terminal size={14} /> Real-time competitive programming platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent leading-tight">
            Code. Compete.<br />Conquer.
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Sharpen your skills with 100+ problems, real-time Docker-judged submissions, 1v1 daily battles, and live leaderboards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link href="/problems" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 justify-center">
                  Keep Solving <ChevronRight size={20} />
                </Link>
                <Link href="/battles" className="btn-secondary text-lg px-8 py-3 flex items-center gap-2 justify-center">
                  <Swords size={20} className="text-purple-400" /> Today's Battle
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 justify-center">
                  Start for Free <ChevronRight size={20} />
                </Link>
                <Link href="/problems" className="btn-secondary text-lg px-8 py-3 flex items-center gap-2 justify-center">
                  Browse Problems
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="px-6 py-12 border-t border-gray-800">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {statItems.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-blue-400">{s.value}</div>
              <div className="text-gray-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Not just practice — competition</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-xl p-6 hover:border-blue-500/40 transition-colors">
                <f.icon className="text-blue-400 mb-3" size={28} />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — only for non-logged-in users */}
      {!user && (
        <section className="px-6 py-20 text-center">
          <div className="max-w-2xl mx-auto glass rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to compete?</h2>
            <p className="text-gray-400 mb-8">Join developers sharpening their problem-solving skills daily.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-10 py-3">Create Free Account</Link>
              <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/auth/google`}
                className="flex items-center gap-2 px-8 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm">
                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
                Continue with Google
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
