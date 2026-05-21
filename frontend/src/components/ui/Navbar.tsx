'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code2, Trophy, BookOpen, Swords, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Code2 className="text-blue-400" size={24} />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CodeArena</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/problems" className="hover:text-white flex items-center gap-1.5 transition-colors">
            <BookOpen size={16} /> Problems
          </Link>
          <Link href="/contests" className="hover:text-white flex items-center gap-1.5 transition-colors">
            <Swords size={16} /> Contests
          </Link>
          <Link href="/leaderboard" className="hover:text-white flex items-center gap-1.5 transition-colors">
            <Trophy size={16} /> Leaderboard
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="hidden md:block">{user.username}</span>
              </Link>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white transition-colors">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-sm px-4 py-2">Login</Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-2">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
