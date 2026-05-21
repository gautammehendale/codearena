'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code2, Loader } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.login(form);
      setAuth(res.data.user, res.data.token);
      router.push('/problems');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Code2 className="text-blue-400 mx-auto mb-3" size={40} />
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-400 mt-1">Sign in to CodeArena</p>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-5">
          {error && <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
            {loading ? <Loader size={18} className="animate-spin" /> : null} Sign In
          </button>
          <p className="text-center text-sm text-gray-400">
            Don't have an account? <Link href="/register" className="text-blue-400 hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
