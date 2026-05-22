'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Swords, Play, Loader, CheckCircle, XCircle, Send, Trophy, Clock } from 'lucide-react';
import api, { submissionsApi } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/lib/store';

// Simple confetti
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 2,
    color: ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD'][Math.floor(Math.random() * 7)],
    size: 8 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute animate-bounce"
          style={{ left: `${p.x}%`, top: '-20px', width: p.size, height: p.size,
            backgroundColor: p.color, borderRadius: '2px', transform: `rotate(${Math.random()*360}deg)`,
            animation: `fall ${1.5 + Math.random()}s ${p.delay}s linear forwards` }} />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

const STARTERS: Record<string, string> = {
  python: 'import sys\ninput = sys.stdin.readline\n\n# Write your solution here\n',
  javascript: 'const lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");\n\n',
  java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}',
};

interface ChatMessage { id: string; username: string; message: string; created_at: string; user_id: string; }

export default function BattleArenaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [battle, setBattle] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTERS.python);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [myProgress, setMyProgress] = useState({ testsPassed: 0, totalTests: 0, solved: false });
  const [oppProgress, setOppProgress] = useState({ testsPassed: 0, totalTests: 0, solved: false });
  const [winner, setWinner] = useState<string | null>(null);
  const [preference, setPreference] = useState('');
  const [prefSet, setPrefSet] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatMsg, setChatMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [quitModal, setQuitModal] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [tieWindow, setTieWindow] = useState<{ winnerId: string; timeLeft: number } | null>(null);
  const [tieCountdown, setTieCountdown] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  const loadBattleAndProblem = async () => {
    try {
      const r = await api.get('/battles/active');
      if (r.data.battle) {
        const b = r.data.battle;
        setBattle(b);
        setMyProgress(b.myProgress || { testsPassed: 0, totalTests: 0, solved: false });
        setOppProgress(b.opponentProgress || { testsPassed: 0, totalTests: 0, solved: false });
        if (b.problem_slug) {
          const pr = await api.get(`/problems/${b.problem_slug}`);
          setProblem(pr.data);
        } else if (b.problem_id) {
          const pr = await api.get(`/problems/${b.problem_id}`);
          setProblem(pr.data);
        }
      }
    } catch (err) { console.error('Battle load error:', err); }
  };

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadBattleAndProblem();
    const retryInterval = setInterval(() => {
      // Retry loading problem if not loaded yet (battle might start after page load)
      if (!problem) loadBattleAndProblem();
    }, 3000);
    return () => clearInterval(retryInterval);
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api.get(`/chat/battle-${id}`).then(r => setChat(r.data)).catch(() => {});
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket(user.id);
    socket.emit('join_battle', id);
    socket.emit('join_chat', `battle-${id}`);

    socket.on('battle_start', (data: any) => {
      fetchBattle();
      if (data.problemId) api.get(`/problems/${data.problemId}`).then(r => setProblem(r.data)).catch(() => {});
    });

    socket.on('battle_progress', (data: any) => {
      if (data.userId === user.id) setMyProgress({ testsPassed: data.testsPassed, totalTests: data.totalTests, solved: data.solved });
      else setOppProgress({ testsPassed: data.testsPassed, totalTests: data.totalTests, solved: data.solved });
    });

    socket.on('submission_update', (data: any) => {
      setResult(data); setSubmitting(false);
    });

    socket.on('battle_end', (data: any) => { setWinner(data.winnerId); setTieWindow(null); });
    socket.on('battle_tie', () => { setWinner('draw'); setTieWindow(null); });
    socket.on('battle_tie_window', (data: any) => {
      setTieWindow(data);
      setTieCountdown(data.timeLeft);
      const interval = setInterval(() => {
        setTieCountdown(p => { if (p <= 1) { clearInterval(interval); return 0; } return p - 1; });
      }, 1000);
    });
    socket.on('new_message', (msg: ChatMessage) => {
      setChat(prev => [...prev, msg]);
      setTimeout(() => chatRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50);
    });

    return () => {
      socket.off('battle_start'); socket.off('battle_progress');
      socket.off('submission_update'); socket.off('battle_end'); socket.off('new_message');
    };
  }, [id, user]);

  // Timer
  useEffect(() => {
    if (!battle?.started_at || battle?.status !== 'active') return;
    const startMs = new Date(battle.started_at).getTime();
    const t = setInterval(() => {
      const e = Math.floor((Date.now() - startMs) / 1000);
      setElapsed(Math.max(0, e));
    }, 1000);
    return () => clearInterval(t);
  }, [battle?.started_at, battle?.status]);

  const fetchBattle = async () => {
    const r = await api.get('/battles/active');
    if (r.data.battle) setBattle(r.data.battle);
  };

  const handleSetPref = async (diff: string) => {
    setPreference(diff);
    await api.post(`/battles/${id}/preference`, { difficulty: diff });
    setPrefSet(true);
  };

  const handleSubmit = async () => {
    if (!problem || !user) return;
    setSubmitting(true); setResult(null);
    try {
      const res = await submissionsApi.submit({ problemId: problem.id, language, code });
      const socket = connectSocket(user.id);
      socket.emit('join_submission', res.data.id);
    } catch (err: any) {
      setSubmitting(false);
      setResult({ status: 'Error' });
    }
  };

  const handleRun = async () => {
    if (!problem || !user) return;
    setRunning(true); setRunResult(null);
    try {
      const res = await submissionsApi.run({ problemId: problem.id, language, code });
      setRunResult(res.data);
    } catch { setRunResult({ status: 'Error', testResults: [] }); }
    finally { setRunning(false); }
  };

  const handleQuit = async () => {
    try {
      await api.post(`/battles/${id}/quit`);
      setWinner('opponent');
      setQuitModal(false);
      // Ask if they want to keep practicing
      setTimeout(() => {
        const keepPracticing = confirm('You quit. Your opponent wins.\n\nWant to keep solving this problem for practice? (No ranking impact)');
        if (keepPracticing) {
          setPracticeMode(true);
        } else {
          router.push('/battles');
        }
      }, 500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to quit');
    }
  };

  const sendChat = async () => {
    if (!chatMsg.trim() || !user) return;
    const socket = connectSocket(user.id);
    socket.emit('chat_message', { roomId: `battle-${id}`, message: chatMsg, userId: user.id, username: user.username });
    setChatMsg('');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const ProgressBar = ({ label, progress, solved, isMe }: { label: string; progress: { testsPassed: number; totalTests: number; solved: boolean }; solved: boolean; isMe: boolean }) => (
    <div className={`glass rounded-xl p-4 ${solved ? 'border-green-500/40' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${isMe ? 'text-blue-400' : 'text-purple-400'}`}>{label}</span>
        {solved ? <CheckCircle size={16} className="text-green-400" /> : <span className="text-xs text-gray-400">{progress.testsPassed}/{progress.totalTests || '?'} tests</span>}
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${solved ? 'bg-green-500' : isMe ? 'bg-blue-500' : 'bg-purple-500'}`}
          style={{ width: progress.totalTests ? `${(progress.testsPassed / progress.totalTests) * 100}%` : '0%' }} />
      </div>
      {solved && <p className="text-xs text-green-400 mt-1">✓ Solved!</p>}
    </div>
  );

  if (!battle) return <div className="flex justify-center pt-40"><Loader className="animate-spin text-blue-400" size={32} /></div>;

  return (
    <div className="h-screen pt-16 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-950">
        <div className="flex items-center gap-3">
          <Swords className="text-purple-400" size={20} />
          <span className="font-semibold">You vs {battle.opponentName}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${battle.status === 'active' ? 'bg-green-500/20 text-green-400' : battle.status === 'lobby' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
            {battle.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {battle.started_at && <div className="flex items-center gap-2 font-mono text-yellow-400"><Clock size={16} />{formatTime(elapsed)}</div>}
          {battle.status === 'active' && !winner && !practiceMode && (
            <button onClick={() => setQuitModal(true)} className="px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">
              Quit Battle
            </button>
          )}
          {practiceMode && <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">Practice Mode</span>}
        </div>
      </div>

      {/* Tie Window Banner */}
      {tieWindow && !winner && (
        <div className={`px-6 py-3 text-center font-semibold text-sm ${tieWindow.winnerId === user?.id ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
          {tieWindow.winnerId === user?.id
            ? `🎉 You solved it! Waiting ${tieCountdown}s for opponent to tie...`
            : `⚡ Opponent solved it! You have ${tieCountdown}s to tie — submit now!`}
        </div>
      )}

      {/* Confetti + Winner Screen */}
      {winner && (
        <>
          <Confetti show={winner === user?.id} />
          <div className={`fixed inset-0 z-40 flex flex-col items-center justify-center ${winner === 'draw' ? 'bg-yellow-950/95' : winner === user?.id ? 'bg-green-950/95' : 'bg-gray-950/95'}`}>
            <div className="text-center px-8">
              {winner === user?.id ? (
                <>
                  <div className="text-8xl mb-6 animate-bounce">🏆</div>
                  <h1 className="text-6xl font-black text-green-400 mb-4">YOU WON!</h1>
                  <p className="text-xl text-green-300 mb-2">+50 points added to your score</p>
                  <p className="text-gray-400">vs {battle.opponentName}</p>
                </>
              ) : winner === 'draw' ? (
                <>
                  <div className="text-8xl mb-6">🤝</div>
                  <h1 className="text-6xl font-black text-yellow-400 mb-4">DRAW!</h1>
                  <p className="text-xl text-yellow-300 mb-2">Both solved within 15 seconds</p>
                  <p className="text-gray-400">+25 points each</p>
                </>
              ) : (
                <>
                  <div className="text-8xl mb-6">💀</div>
                  <h1 className="text-5xl font-black text-red-400 mb-4">YOU LOST</h1>
                  <p className="text-xl text-gray-300 mb-2">{battle.opponentName} was faster</p>
                  <p className="text-gray-400">Better luck next time!</p>
                </>
              )}
              <button onClick={() => router.push('/battles')}
                className="mt-8 btn-primary text-lg px-10 py-3">
                Back to Battles
              </button>
            </div>
          </div>
        </>
      )}

      {/* Matched — Waiting for lobby */}
      {battle.status === 'matched' && !winner && (
        <div className="flex-1 flex items-center justify-center">
          <div className="glass rounded-2xl p-10 text-center max-w-md w-full mx-6">
            <div className="text-5xl mb-4 animate-pulse">⚔️</div>
            <h2 className="text-xl font-bold mb-2">You're Matched!</h2>
            <p className="text-gray-300 text-sm mb-2">vs <span className="text-purple-400 font-semibold">{battle.opponentName}</span></p>
            <p className="text-gray-400 text-sm mb-6">Battle starts soon. Lobby opens 2 minutes before start to choose difficulty.</p>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Loader size={16} className="animate-spin" /> Waiting for battle to start...
            </div>
          </div>
        </div>
      )}

      {/* Lobby — Difficulty Selection */}
      {battle.status === 'lobby' && !winner && (
        <div className="flex-1 flex items-center justify-center">
          <div className="glass rounded-2xl p-10 text-center max-w-md w-full mx-6">
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-xl font-bold mb-2">Choose Difficulty</h2>
            <p className="text-gray-400 text-sm mb-6">Both players must choose. If you disagree, Player 1's choice wins.</p>
            <div className="flex gap-3 justify-center mb-4">
              {['Easy', 'Medium', 'Hard'].map(d => (
                <button key={d} onClick={() => handleSetPref(d)} disabled={prefSet}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${preference === d ? 'ring-2 ring-offset-1 ring-offset-gray-950 ring-blue-500' : ''} ${d === 'Easy' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : d === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'} disabled:opacity-50`}>
                  {d}
                </button>
              ))}
            </div>
            {prefSet && <p className="text-green-400 text-sm">✓ Preference set — waiting for opponent...</p>}
          </div>
        </div>
      )}

      {/* Active Battle */}
      {battle.status === 'active' && !winner && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Problem + Progress + Chat */}
          <div className="w-2/5 flex flex-col border-r border-gray-800">
            {/* Progress bars */}
            <div className="p-4 border-b border-gray-800 space-y-3">
              <ProgressBar label="You" progress={myProgress} solved={myProgress.solved} isMe={true} />
              <ProgressBar label={battle.opponentName} progress={oppProgress} solved={oppProgress.solved} isMe={false} />
            </div>

            {/* Problem description */}
            <div className="flex-1 overflow-y-auto p-4">
              {problem ? (
                <>
                  <h2 className="font-bold text-lg mb-1">{problem.title}</h2>
                  <span className={`text-xs font-medium ${problem.difficulty === 'Easy' ? 'text-green-400' : problem.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>{problem.difficulty}</span>
                  <p className="text-gray-300 text-sm mt-3 leading-relaxed whitespace-pre-wrap">{problem.description}</p>
                </>
              ) : <Loader className="animate-spin text-blue-400" size={24} />}
            </div>

            {/* Chat */}
            <div className="border-t border-gray-800 flex flex-col h-48">
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/50">Battle Chat</div>
              <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {chat.map(m => (
                  <div key={m.id} className="text-xs">
                    <span className={`font-semibold mr-1 ${m.user_id === user?.id ? 'text-blue-400' : 'text-purple-400'}`}>{m.username}:</span>
                    <span className="text-gray-300">{m.message}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-2 border-t border-gray-800/50">
                <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Message..." className="flex-1 bg-gray-800 rounded px-2 py-1 text-xs focus:outline-none" />
                <button onClick={sendChat} className="p-1.5 bg-blue-600 rounded hover:bg-blue-700">
                  <Send size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
              <select value={language} onChange={e => { setLanguage(e.target.value); setCode(STARTERS[e.target.value] || ''); }}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none">
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <button onClick={handleRun} disabled={running || submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 transition-colors disabled:opacity-40">
                {running ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
                Run
              </button>
              <button onClick={handleSubmit} disabled={submitting || running} className="btn-primary flex items-center gap-2 text-sm">
                {submitting ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
                {submitting ? 'Judging...' : 'Submit'}
              </button>
            </div>
            <div className="flex-1">
              <MonacoEditor height="100%" language={language} value={code} onChange={v => setCode(v || '')}
                theme="vs-dark" options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 12 } }} />
            </div>
            {runResult && (
              <div className="border-t border-gray-800 bg-gray-950 max-h-36 overflow-y-auto">
                <div className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b border-gray-800 ${runResult.testResults?.every((t:any)=>t.passed) ? 'text-green-400' : 'text-red-400'}`}>
                  {runResult.testResults?.every((t:any)=>t.passed) ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                  Sample tests · {runResult.status}
                </div>
                {runResult.testResults?.map((tr:any, i:number) => (
                  <div key={i} className={`px-3 py-1.5 text-xs border-b border-gray-800/50 ${tr.passed?'text-green-300':'text-red-300'}`}>
                    <span className="font-medium">Case {tr.testCase}: {tr.passed?'✓':'✗'}</span>
                    {!tr.passed && tr.output !== undefined && <span className="text-gray-400 ml-2">got "{tr.output}" expected "{tr.expected}"</span>}
                  </div>
                ))}
              </div>
            )}
            {result && (
              <div className="border-t border-gray-800 p-3 bg-gray-900/50">
                <div className={`flex items-center gap-2 text-sm font-semibold ${result.status === 'Accepted' ? 'text-green-400' : 'text-red-400'}`}>
                  {result.status === 'Accepted' ? <CheckCircle size={16} /> : <XCircle size={16} />} {result.status}
                  {result.runtime && <span className="text-gray-400 font-normal">· {result.runtime}ms</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Quit Confirm Modal */}
      {quitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">🏳️</div>
            <h2 className="text-xl font-bold mb-2">Quit this battle?</h2>
            <p className="text-gray-400 text-sm mb-6">Your opponent wins and gets +50 points. You can choose to keep solving the problem for practice with no ranking impact.</p>
            <div className="flex gap-3">
              <button onClick={() => setQuitModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleQuit} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">Quit Battle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
