'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types';
import { 
  CookieIcon, 
  SparklesIcon, 
  TrophyIcon, 
  UserIcon, 
  AdminIcon, 
  LogoutIcon,
  LockIcon 
} from '@/components/icons';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAuth();

    const handleAuthChange = () => loadAuth();
    window.addEventListener('auth_changed', handleAuthChange);
    return () => window.removeEventListener('auth_changed', handleAuthChange);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('cr_user_profile');
      setProfile(null);
      window.dispatchEvent(new Event('auth_changed'));
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const isLoggedIn = Boolean(profile && profile.username && profile.username !== 'guest');
  const isAdmin = Boolean(isLoggedIn && profile?.role === 'admin');

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform duration-200">
            <CookieIcon className="w-5 h-5 fill-zinc-950/20 text-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-white tracking-tight leading-none group-hover:text-amber-400 transition-colors">
                Cookie Run
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest block mt-0.5">
              Classic Meta Finder
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900/70 p-1 rounded-2xl border border-zinc-800/80">
          <Link
            href="/"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              pathname === '/' 
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Home Metas</span>
          </Link>

          <Link
            href="/combo"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              pathname === '/combo' 
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <TrophyIcon className="w-3.5 h-3.5" />
            <span>Browse Setups</span>
          </Link>

          <Link
            href="/profile"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              pathname === '/profile' 
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>My Inventory</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                pathname === '/admin' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                  : 'bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white'
              }`}
            >
              <AdminIcon className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* User Account / Auth Widget */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-20 h-7 bg-zinc-900 animate-pulse rounded-xl border border-zinc-800"></div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-none">{profile?.name || profile?.username}</span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">{profile?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogoutIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LockIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
