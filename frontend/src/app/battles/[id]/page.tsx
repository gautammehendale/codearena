'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Swords, Play, Loader, CheckCircle, XCircle, Send, Trophy, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import api, { submissionsApi } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/lib/store';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  { value: 'python', label: 'Python 3.11' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java 17' },
  { value: 'cpp', label: 'C++ 17' },
];

const STARTERS: Record<string, string> = {
  python: 'import sys\ninput = sys.stdin.readline\n\n# Write your solution here\n',
  javascript: 'const lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");\n\n',
  java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}',
};

// Confetti component
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 2,
    color: ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD'][i % 7],
    size: 8 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: '-20px',
          width: p.size, height: p.size, backgroundColor: p.color, borderRadius: '2px',
          animation: `fall ${1.5 + Math.random()}s ${p.delay}s linear forwards`
        }} />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}

// Run result panel (expandable)
function RunPanel({ result, onClose }: { result: any; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const allPassed = result.testResults?.every((t: any) => t.passed);
  return (
    <div className="border-t border-gray-800 bg-gray-950">
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-gray-800 ${allPassed ? 'bg-green-950/30' : 'bg-red-950/20'}`}>
        {allPassed ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
        <span className={`text-xs font-semibold ${allPassed ? 'text-green-400' : 'text-red-400'}`}>{allPassed ? 'Sample Tests Passed' : result.status}</span>
        <span className="text-gray-600 text-xs ml-1">· 2 sample cases</span>
        <button onClick={onClose} className="ml-auto text-gray-600 hover:text-white"><X size={12} /></button>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {result.testResults?.map((tr: any, i: number) => (
          <div key={i} className="border-b border-gray-800/50 last:border-0">
            <button onClick={() => setExpanded(expanded === i ? null : i)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-900/40 ${tr.passed ? 'text-green-400' : 'text-red-400'}`}>
              {tr.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
              Case {tr.testCase}: {tr.passed ? 'Passed' : tr.status}
              {tr.runtime && <span className="text-gray-500 ml-1">{tr.runtime}ms</span>}
              <span className="ml-auto text-gray-600">{expanded === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
            </button>
            {expanded === i && (
              <div className="px-3 pb-2 space-y-1.5 bg-gray-900/20">
                {tr.input && <div><p className="text-xs text-gray-600 mb-0.5">Input</p><pre className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 font-mono overflow-x-auto">{tr.input}</pre></div>}
                <div className="grid grid-cols-2 gap-1.5">
                  <div><p className="text-xs text-gray-600 mb-0.5">Your Output</p><pre className={`bg-gray-900 border rounded px-2 py-1.5 text-xs font-mono overflow-x-auto ${tr.passed?'border-green-800/40 text-green-300':'border-red-800/40 text-red-300'}`}>{tr.output||'(empty)'}</pre></div>
                  <div><p className="text-xs text-gray-600 mb-0.5">Expected</p><pre className="bg-gray-900 border border-green-800/40 rounded px-2 py-1.5 text-xs text-green-300 font-mono overflow-x-auto">{tr.expected}</pre></div>
                </div>
                {tr.error && <div><p className="text-xs text-gray-600 mb-0.5">Error</p><pre className="bg-gray-900 border border-yellow-800/30 rounded px-2 py-1.5 text-xs text-yellow-300 font-mono overflow-x-auto">{tr.error}</pre></div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChatMessage { id: string; username: string; message: string; created_at: string; user_id: string; }

export default function BattleArenaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [battle, setBattle] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const problemRef = useRef<any>(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTERS.python);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [runResult, setRunResult] = useState<any>(null);
  const [activeResultTab, setActiveResultTab] = useState<'submit' | 'run'>('submit');
  const [panelHeight, setPanelHeight] = useState(180);
  const draggingRef = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    draggingRef.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = panelHeight;
    e.preventDefault();
  }, [panelHeight]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const dy = dragStartY.current - e.clientY;
      setPanelHeight(Math.max(100, Math.min(500, dragStartH.current + dy)));
    };
    const onUp = () => { draggingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);
  const [myProgress, setMyProgress] = useState({ testsPassed: 0, totalTests: 0, solved: false });
  const [oppProgress, setOppProgress] = useState({ testsPassed: 0, totalTests: 0, solved: false });
  const [winner, setWinner] = useState<string | null>(null);
  const [preference, setPreference] = useState('');
  const [prefSet, setPrefSet] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatMsg, setChatMsg] = useState('');
  const [chatWarning, setChatWarning] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [quitModal, setQuitModal] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [tieWindow, setTieWindow] = useState<{ winnerId: string; timeLeft: number } | null>(null);
  const [tieCountdown, setTieCountdown] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  // Load battle + problem (retries until problem loaded)
  const loadBattle = async () => {
    try {
      const r = await api.get('/battles/active');
      if (!r.data.battle) return;
      const b = r.data.battle;
      setBattle(b);
      setMyProgress(b.myProgress || { testsPassed: 0, totalTests: 0, solved: false });
      setOppProgress(b.opponentProgress || { testsPassed: 0, totalTests: 0, solved: false });
      if (!problemRef.current && (b.problem_slug || b.problem_id)) {
        const pr = await api.get(`/problems/${b.problem_slug || b.problem_id}`);
        setProblem(pr.data);
        problemRef.current = pr.data;
      }
    } catch {}
  };

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadBattle();
    api.get(`/chat/battle-${id}`).then(r => setChat(r.data)).catch(() => {});
    // Retry every 4s until problem loads (handles battle start race condition)
    const retry = setInterval(() => {
      if (!problemRef.current) loadBattle();
    }, 4000);
    return () => clearInterval(retry);
  }, [user, id]);

  // Socket events
  useEffect(() => {
    if (!user) return;
    const socket = connectSocket(user.id);
    socket.emit('join_battle', id);
    socket.emit('join_chat', `battle-${id}`);

    socket.on('battle_start', async (data: any) => {
      loadBattle();
      if (data.problemId && !problemRef.current) {
        try {
          const pr = await api.get(`/problems/${data.problemId}`);
          setProblem(pr.data);
          problemRef.current = pr.data;
        } catch {}
      }
    });
    socket.on('battle_progress', (data: any) => {
      if (data.userId === user.id) setMyProgress({ testsPassed: data.testsPassed, totalTests: data.totalTests, solved: data.solved });
      else setOppProgress({ testsPassed: data.testsPassed, totalTests: data.totalTests, solved: data.solved });
    });
    socket.on('submission_update', (data: any) => { setResult(data); setSubmitting(false); setActiveResultTab('submit'); });
    socket.on('battle_end', (data: any) => { setWinner(data.winnerId); setTieWindow(null); });
    socket.on('battle_tie', () => { setWinner('draw'); setTieWindow(null); });
    socket.on('battle_tie_window', (data: any) => {
      setTieWindow(data); setTieCountdown(data.timeLeft);
      const iv = setInterval(() => setTieCountdown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
    });
    socket.on('new_message', (msg: ChatMessage) => {
      setChat(prev => [...prev, msg]);
      setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50);
    });
    return () => {
      socket.off('battle_start'); socket.off('battle_progress');
      socket.off('submission_update'); socket.off('battle_end');
      socket.off('battle_tie'); socket.off('battle_tie_window'); socket.off('new_message');
    };
  }, [id, user]);

  // Timer — counts up from started_at, only when active
  useEffect(() => {
    if (battle?.status !== 'active' || !battle?.started_at) return;
    const startMs = new Date(battle.started_at).getTime();
    const iv = setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000))), 1000);
    return () => clearInterval(iv);
  }, [battle?.status, battle?.started_at]);

  const handleRun = async () => {
    if (!problem || !user) return;
    setRunning(true); setRunResult(null); setActiveResultTab('run');
    try {
      const res = await submissionsApi.run({ problemId: problem.id, language, code });
      setRunResult(res.data);
    } catch { setRunResult({ status: 'Error', testResults: [] }); }
    finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    if (!problem || !user) return;
    setSubmitting(true); setResult(null);
    try {
      const res = await submissionsApi.submit({ problemId: problem.id, language, code });
      const socket = connectSocket(user.id);
      socket.emit('join_submission', res.data.id);
    } catch { setSubmitting(false); setResult({ status: 'Error' }); }
  };

  const handleSetPref = async (diff: string) => {
    setPreference(diff);
    await api.post(`/battles/${id}/preference`, { difficulty: diff });
    setPrefSet(true);
  };

  const handleQuit = async () => {
    try {
      await api.post(`/battles/${id}/quit`);
      setWinner('opponent');
      setQuitModal(false);
      setTimeout(() => {
        if (confirm('You quit. Opponent wins.\n\nKeep solving for practice? (no ranking impact)')) setPracticeMode(true);
        else router.push('/battles');
      }, 500);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
  };

  const sendChat = async () => {
    if (!chatMsg.trim() || !user) return;
    const BAD = ['fuck','shit','bitch','bastard','ass'];
    if (BAD.some(w => chatMsg.toLowerCase().includes(w))) {
      setChatWarning('⚠️ Inappropriate language is prohibited');
      setTimeout(() => setChatWarning(''), 3000);
      return;
    }
    const socket = connectSocket(user.id);
    socket.emit('chat_message', { roomId: `battle-${id}`, message: chatMsg, userId: user.id, username: user.username });
    setChatMsg('');
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2, '0')}`;

  if (!battle) return <div className="flex justify-center pt-40"><Loader className="animate-spin text-blue-400" size={32} /></div>;

  const ProgressBar = ({ label, progress, isMe }: any) => (
    <div className={`glass rounded-lg p-3 ${progress.solved ? 'border-green-500/40' : ''}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-medium ${isMe ? 'text-blue-400' : 'text-purple-400'}`}>{label}</span>
        {progress.solved ? <span className="text-xs text-green-400">✓ Solved!</span> : <span className="text-xs text-gray-500">{progress.testsPassed}/{progress.totalTests || '?'} tests</span>}
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${progress.solved ? 'bg-green-500' : isMe ? 'bg-blue-500' : 'bg-purple-500'}`}
          style={{ width: progress.totalTests ? `${(progress.testsPassed / progress.totalTests) * 100}%` : '0%' }} />
      </div>
    </div>
  );

  return (
    <div className="h-screen pt-16 flex flex-col overflow-hidden">
      {/* Confetti */}
      <Confetti show={winner === user?.id} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-950 z-10">
        <div className="flex items-center gap-3">
          <Swords className="text-purple-400" size={18} />
          <span className="font-semibold text-sm">You vs {battle.opponentName}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${battle.status === 'active' ? 'bg-green-500/20 text-green-400' : battle.status === 'lobby' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{battle.status}</span>
        </div>
        <div className="flex items-center gap-3">
          {battle.status === 'active' && elapsed > 0 && (
            <div className="flex items-center gap-1.5 font-mono text-sm text-yellow-400 bg-yellow-900/20 px-3 py-1 rounded-full">
              <Clock size={14} />{formatTime(elapsed)}
            </div>
          )}
          {battle.status === 'active' && !winner && !practiceMode && (
            <button onClick={() => setQuitModal(true)} className="px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10">Quit</button>
          )}
          {practiceMode && <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">Practice Mode</span>}
        </div>
      </div>

      {/* Tie Window Banner */}
      {tieWindow && !winner && (
        <div className={`px-4 py-2.5 text-center text-sm font-semibold ${tieWindow.winnerId === user?.id ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
          {tieWindow.winnerId === user?.id
            ? `🎉 You solved it! Opponent has ${tieCountdown}s to tie...`
            : `⚡ Opponent solved! You have ${tieCountdown}s to tie — submit NOW!`}
        </div>
      )}

      {/* WIN SCREEN */}
      {winner && (
        <div className={`fixed inset-0 z-40 flex flex-col items-center justify-center ${winner === 'draw' ? 'bg-yellow-950/95' : winner === user?.id ? 'bg-green-950/95' : 'bg-gray-950/95'}`}>
          <div className="text-center px-8">
            {winner === user?.id ? (
              <><div className="text-8xl mb-6 animate-bounce">🏆</div><h1 className="text-6xl font-black text-green-400 mb-4">YOU WON!</h1><p className="text-green-300 text-xl mb-2">+50 points</p><p className="text-gray-400">vs {battle.opponentName}</p></>
            ) : winner === 'draw' ? (
              <><div className="text-8xl mb-6">🤝</div><h1 className="text-6xl font-black text-yellow-400 mb-4">DRAW!</h1><p className="text-yellow-300 text-xl mb-2">Both solved in 15s · +25 pts each</p></>
            ) : (
              <><div className="text-8xl mb-6">💀</div><h1 className="text-5xl font-black text-red-400 mb-4">YOU LOST</h1><p className="text-gray-300 text-xl mb-2">{battle.opponentName} was faster</p></>
            )}
            <button onClick={() => router.push('/battles')} className="mt-8 btn-primary text-lg px-10 py-3">
              {winner !== user?.id ? 'Enroll Again →' : 'Back to Battles'}
            </button>
          </div>
        </div>
      )}

      {/* MATCHED — waiting */}
      {battle.status === 'matched' && !winner && (
        <div className="flex-1 flex items-center justify-center">
          <div className="glass rounded-2xl p-10 text-center max-w-md w-full mx-6">
            <div className="text-5xl mb-4 animate-pulse">⚔️</div>
            <h2 className="text-xl font-bold mb-2">Matched vs {battle.opponentName}!</h2>
            <p className="text-gray-400 text-sm mb-6">Battle starts soon. Choose difficulty in the lobby 2 mins before start.</p>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm"><Loader size={16} className="animate-spin" /> Waiting for battle to begin...</div>
          </div>
        </div>
      )}

      {/* LOBBY — difficulty picker */}
      {battle.status === 'lobby' && !winner && (
        <div className="flex-1 flex items-center justify-center">
          <div className="glass rounded-2xl p-10 text-center max-w-md w-full mx-6">
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-xl font-bold mb-2">Choose Difficulty</h2>
            <p className="text-gray-400 text-sm mb-6">Both players choose. Disagreements default to Medium.</p>
            <div className="flex gap-3 justify-center mb-4">
              {['Easy','Medium','Hard'].map(d => (
                <button key={d} onClick={() => handleSetPref(d)} disabled={prefSet}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${preference===d?'ring-2 ring-blue-500':''} ${d==='Easy'?'bg-green-500/20 text-green-400':d==='Medium'?'bg-yellow-500/20 text-yellow-400':'bg-red-500/20 text-red-400'} disabled:opacity-50`}>
                  {d}
                </button>
              ))}
            </div>
            {prefSet && <p className="text-green-400 text-sm">✓ Set — waiting for opponent...</p>}
          </div>
        </div>
      )}

      {/* ACTIVE BATTLE */}
      {battle.status === 'active' && !winner && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Progress + Problem + Chat */}
          <div className="w-2/5 flex flex-col border-r border-gray-800">
            <div className="p-3 border-b border-gray-800 space-y-2">
              <ProgressBar label="You" progress={myProgress} isMe={true} />
              <ProgressBar label={battle.opponentName} progress={oppProgress} isMe={false} />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {problem ? (
                <>
                  <h2 className="font-bold text-base mb-1">{problem.title}</h2>
                  <span className={`text-xs font-medium ${problem.difficulty==='Easy'?'text-green-400':problem.difficulty==='Medium'?'text-yellow-400':'text-red-400'}`}>{problem.difficulty}</span>
                  <div className="text-gray-300 text-sm mt-3 leading-relaxed whitespace-pre-wrap">{problem.description}</div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-4"><Loader size={16} className="animate-spin" />Loading problem...</div>
              )}
            </div>
            {/* Chat */}
            <div className="border-t border-gray-800 flex flex-col h-44">
              <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-800/50">Battle Chat</div>
              {chatWarning && <div className="px-3 py-1 text-xs text-yellow-400 bg-yellow-900/20">{chatWarning}</div>}
              <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {chat.map((m, i) => (
                  <div key={m.id || i} className="text-xs">
                    <span className={`font-semibold mr-1 ${m.user_id === user?.id ? 'text-blue-400' : 'text-purple-400'}`}>{m.username}:</span>
                    <span className="text-gray-300">{m.message}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-2 border-t border-gray-800/50">
                <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Message..." className="flex-1 bg-gray-800 rounded px-2 py-1 text-xs focus:outline-none" />
                <button onClick={sendChat} className="p-1.5 bg-blue-600 rounded hover:bg-blue-700"><Send size={12} /></button>
              </div>
            </div>
          </div>

          {/* Right: Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900/50">
              <select value={language} onChange={e => { setLanguage(e.target.value); setCode(STARTERS[e.target.value] || ''); }}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none">
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={handleRun} disabled={running || submitting || !problem}
                  title={!problem ? 'Loading problem...' : ''}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 transition-colors disabled:opacity-40">
                  {running ? <Loader size={13} className="animate-spin" /> : <Play size={13} />} Run
                </button>
                <button onClick={handleSubmit} disabled={submitting || running || !problem}
                  title={!problem ? 'Loading problem...' : ''}
                  className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
                  {submitting ? <Loader size={13} className="animate-spin" /> : <Play size={13} />}
                  {submitting ? 'Judging...' : 'Submit'}
                </button>
              </div>
            </div>
            {!problem && (
              <div className="px-3 py-1.5 bg-yellow-900/20 text-yellow-400 text-xs text-center">
                Loading problem... Run & Submit will enable shortly.
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <MonacoEditor height="100%" language={language} value={code} onChange={v => setCode(v || '')}
                theme="vs-dark" options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 12 } }} />
            </div>
            {/* Draggable result panel — same as problems page */}
            {(runResult || result) && (
              <div style={{ height: panelHeight }} className="border-t border-gray-800 flex flex-col overflow-hidden flex-shrink-0">
                <div onMouseDown={onDragStart}
                  className="h-2 bg-gray-800/80 hover:bg-blue-500/40 cursor-row-resize flex items-center justify-center group flex-shrink-0 transition-colors"
                  title="Drag to resize">
                  <div className="w-10 h-0.5 bg-gray-600 group-hover:bg-blue-400 rounded-full transition-colors" />
                </div>
                {/* Tabs */}
                <div className="flex border-b border-gray-800 flex-shrink-0">
                  {result && (
                    <button onClick={() => setActiveResultTab('submit')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeResultTab==='submit'?'text-blue-400 border-b-2 border-blue-400':'text-gray-400 hover:text-white'}`}>
                      Submit {result.status==='Accepted'?'✓':'✗'}
                    </button>
                  )}
                  {runResult && (
                    <button onClick={() => setActiveResultTab('run')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeResultTab==='run'?'text-blue-400 border-b-2 border-blue-400':'text-gray-400 hover:text-white'}`}>
                      Run {runResult.testResults?.every((t:any)=>t.passed)?'✓':'✗'}
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {/* Run result */}
                  {runResult && activeResultTab==='run' && (
                    <RunPanel result={runResult} onClose={() => { setRunResult(null); if (result) setActiveResultTab('submit'); }} />
                  )}
                  {/* Submit result */}
                  {result && activeResultTab==='submit' && (
                    <div className="bg-gray-950 h-full">
                      <div className={`flex items-center gap-2 px-3 py-2.5 border-b border-gray-800 ${result.status==='Accepted'?'bg-green-950/30':'bg-red-950/20'}`}>
                        {result.status==='Accepted'?<CheckCircle size={15} className="text-green-400"/>:<XCircle size={15} className="text-red-400"/>}
                        <span className={`font-semibold text-sm ${result.status==='Accepted'?'text-green-400':'text-red-400'}`}>{result.status}</span>
                        {result.runtime && <span className="text-gray-400 text-xs">· {result.runtime}ms</span>}
                        {result.status==='Accepted' && <span className="ml-auto text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">All tests passed ✓</span>}
                        <button onClick={() => setResult(null)} className="ml-1 text-gray-600 hover:text-white"><X size={12}/></button>
                      </div>
                      <div className="p-2 grid grid-cols-2 gap-1.5">
                        {result.testResults?.map((tr:any, i:number) => (
                          <div key={i} className={`text-xs px-2 py-1.5 rounded-lg flex items-center gap-1.5 ${tr.passed?'bg-green-900/20 text-green-300 border border-green-800/40':'bg-red-900/20 text-red-300 border border-red-800/40'}`}>
                            {tr.passed?<CheckCircle size={11}/>:<XCircle size={11}/>}
                            Test {tr.testCase}: {tr.passed?'Passed':tr.status}
                            {tr.runtime && <span className="ml-auto text-gray-500">{tr.runtime}ms</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quit Modal */}
      {quitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">🏳️</div>
            <h2 className="text-xl font-bold mb-2">Quit this battle?</h2>
            <p className="text-gray-400 text-sm mb-6">Opponent wins +50 pts. You can stay to practice with no ranking impact.</p>
            <div className="flex gap-3">
              <button onClick={() => setQuitModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleQuit} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg">Quit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
