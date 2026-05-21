'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code2, Loader } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.register(form);
      setAuth(res.data.user, res.data.token);
      router.push('/problems');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Code2 className="text-blue-400 mx-auto mb-3" size={40} />
          <h1 className="text-2xl font-bold">Join CodeArena</h1>
          <p className="text-gray-400 mt-1">Create your account and start competing</p>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-5">
          {error && <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {[
            { key: 'username', label: 'Username', type: 'text', placeholder: 'coolcoder123' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
              <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
            {loading ? <Loader size={18} className="animate-spin" /> : null} Create Account
          </button>
          <p className="text-center text-sm text-gray-400">
            Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
