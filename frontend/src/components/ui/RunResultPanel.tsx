'use client';
import { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react';

interface TestResult {
  testCase: number;
  passed: boolean;
  status: string;
  runtime?: number;
  input?: string;
  output?: string;
  expected?: string;
  error?: string;
}

interface RunResultPanelProps {
  result: { status: string; testResults: TestResult[] };
  onClose: () => void;
}

function CaseDetail({ tr }: { tr: TestResult }) {
  return (
    <div className="px-4 pb-3 space-y-2 bg-gray-900/20">
      {tr.input !== undefined && tr.input !== '' && (
        <div>
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Input</p>
          <pre className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">{tr.input}</pre>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Your Output</p>
          <pre className={`bg-gray-900 border rounded px-3 py-2 text-xs font-mono overflow-x-auto min-h-[2rem] ${tr.passed ? 'border-green-800/40 text-green-300' : 'border-red-800/40 text-red-300'}`}>{tr.output || '(empty)'}</pre>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Expected</p>
          <pre className="bg-gray-900 border border-green-800/40 rounded px-3 py-2 text-xs text-green-300 font-mono overflow-x-auto min-h-[2rem]">{tr.expected}</pre>
        </div>
      </div>
      {tr.error && (
        <div>
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Error</p>
          <pre className="bg-gray-900 border border-yellow-800/30 rounded px-3 py-2 text-xs text-yellow-300 font-mono overflow-x-auto">{tr.error}</pre>
        </div>
      )}
    </div>
  );
}

export default function RunResultPanel({ result, onClose }: RunResultPanelProps) {
  // All cases expanded by default
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const allPassed = result.testResults?.every(t => t.passed);
  const toggle = (i: number) => setCollapsed(p => { const s = new Set(p); s.has(i) ? s.delete(i) : s.add(i); return s; });

  return (
    <div className="bg-gray-950 h-full flex flex-col">
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 flex-shrink-0 ${allPassed ? 'bg-green-950/40' : 'bg-red-950/30'}`}>
        {allPassed
          ? <CheckCircle size={16} className="text-green-400" />
          : <XCircle size={16} className="text-red-400" />}
        <span className={`text-sm font-semibold ${allPassed ? 'text-green-400' : 'text-red-400'}`}>
          {allPassed ? 'Sample Tests Passed' : result.status || 'Failed'}
        </span>
        <span className="text-xs text-gray-500 ml-1">— {result.testResults?.length || 2} sample cases</span>
        <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {result.testResults?.map((tr, i) => (
          <div key={i} className="border-b border-gray-800/50 last:border-0">
            <button onClick={() => toggle(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-900/40 transition-colors ${tr.passed ? 'text-green-400' : 'text-red-400'}`}>
              {tr.passed ? <CheckCircle size={14} /> : <XCircle size={14} />}
              <span className="font-medium">Case {tr.testCase}: {tr.passed ? 'Passed' : tr.status}</span>
              {tr.runtime && <span className="text-gray-500 text-xs ml-1">{tr.runtime}ms</span>}
              <span className="ml-auto text-gray-600">{!collapsed.has(i) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
            </button>
            {!collapsed.has(i) && <CaseDetail tr={tr} />}
          </div>
        ))}
      </div>
    </div>
  );
}
