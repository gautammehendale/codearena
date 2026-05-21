'use client';
import { useEffect, useState } from 'react';
import { Swords, Clock, Trophy, Calendar, Loader } from 'lucide-react';
import { contestsApi } from '@/lib/api';

interface Contest {
  id: string; title: string; description: string;
  start_time: string; end_time: string; status: string; problem_count: number;
}

const statusStyle = {
  Live: 'bg-green-500/20 text-green-400 border-green-500/30',
  Upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Ended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getDuration(start: string, end: string) {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contestsApi.list().then(r => { setContests(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const grouped = {
    Live: contests.filter(c => c.status === 'Live'),
    Upcoming: contests.filter(c => c.status === 'Upcoming'),
    Ended: contests.filter(c => c.status === 'Ended'),
  };

  return (
    <div className="max-w-5xl mx-auto px-6 pt-24 pb-12">
      <div className="flex items-center gap-3 mb-2">
        <Swords className="text-blue-400" size={32} />
        <h1 className="text-3xl font-bold">Contests</h1>
      </div>
      <p className="text-gray-400 mb-10">Compete in timed programming contests and climb the rankings.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-400" size={32} /></div>
      ) : contests.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Swords className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold mb-2">No contests yet</h3>
          <p className="text-gray-400">Check back soon — contests are coming!</p>
        </div>
      ) : (
        Object.entries(grouped).filter(([, list]) => list.length > 0).map(([status, list]) => (
          <div key={status} className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs border ${statusStyle[status as keyof typeof statusStyle]}`}>{status}</span>
              {status} Contests
            </h2>
            <div className="space-y-4">
              {list.map(c => (
                <div key={c.id} className="glass rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{c.title}</h3>
                      {c.description && <p className="text-gray-400 text-sm mb-3">{c.description}</p>}
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(c.start_time)}</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} />{getDuration(c.start_time, c.end_time)}</span>
                        <span className="flex items-center gap-1.5"><Trophy size={14} />{c.problem_count || 0} problems</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs border ${statusStyle[c.status as keyof typeof statusStyle]}`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
