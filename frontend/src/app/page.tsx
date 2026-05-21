'use client';
import Link from 'next/link';
import { Code2, Trophy, Zap, Users, ChevronRight, Terminal } from 'lucide-react';

const features = [
  { icon: Code2, title: 'Multi-Language Support', desc: 'Code in Python, JavaScript, Java, C++, and C with Monaco Editor — the same engine powering VS Code.' },
  { icon: Zap, title: 'Real-Time Judging', desc: 'Sandboxed Docker execution with sub-2s feedback. See test case results as they run via WebSocket updates.' },
  { icon: Trophy, title: 'Live Leaderboard', desc: 'Redis-powered rankings update in real time. Compete globally or within a contest.' },
  { icon: Users, title: 'Timed Contests', desc: 'Join live contests with countdown timers, isolated leaderboards, and problem unlocking.' },
];

const stats = [
  { label: 'Problems', value: '100+' },
  { label: 'Languages', value: '5' },
  { label: 'Submissions', value: '10K+' },
  { label: 'Active Users', value: '500+' },
];

export default function Home() {
  return (
    <div className="min-h-screen">
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
            Sharpen your skills with 100+ problems, real-time judging powered by Docker sandboxing, and live leaderboards updated via Redis and WebSockets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/problems" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 justify-center">
              Start Coding <ChevronRight size={20} />
            </Link>
            <Link href="/leaderboard" className="btn-secondary text-lg px-8 py-3 flex items-center gap-2 justify-center">
              <Trophy size={20} /> Leaderboard
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 border-t border-gray-800">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-blue-400">{s.value}</div>
              <div className="text-gray-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Built for serious coders</h2>
          <div className="grid md:grid-cols-2 gap-6">
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

      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto glass rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to compete?</h2>
          <p className="text-gray-400 mb-8">Join thousands of developers sharpening their problem-solving skills.</p>
          <Link href="/register" className="btn-primary text-lg px-10 py-3">Create Free Account</Link>
        </div>
      </section>
    </div>
  );
}
