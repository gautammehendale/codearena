'use client';
import { useEffect, useState } from 'react';
import { Loader, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

export default function WakeUpBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const start = Date.now();
    fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) })
      .then(() => setShow(false))
      .catch(() => {
        if (Date.now() - start >= 4000) setShow(true); // slow = sleeping
      });
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-yellow-900/90 border border-yellow-500/40 rounded-xl text-yellow-300 text-sm flex items-center gap-3 shadow-xl backdrop-blur-sm max-w-md">
      <Loader size={16} className="animate-spin flex-shrink-0" />
      <span>Server waking up (~30s on free tier). Everything will load shortly...</span>
      <button onClick={() => setDismissed(true)} className="ml-1 text-yellow-500 hover:text-yellow-300 flex-shrink-0"><X size={14} /></button>
    </div>
  );
}
