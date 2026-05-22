'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    const id = params.get('id');
    const username = params.get('username');
    const role = params.get('role');

    if (token && id && username) {
      setAuth({ id, username, email: '', role: role || 'user', total_solved: 0, total_submissions: 0 }, token);
      router.replace('/problems');
    } else {
      router.replace('/login?error=oauth');
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader className="animate-spin text-blue-400" size={32} />
      <p className="text-gray-400">Signing you in with Google...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-40"><Loader className="animate-spin text-blue-400" size={32} /></div>}>
      <CallbackHandler />
    </Suspense>
  );
}
