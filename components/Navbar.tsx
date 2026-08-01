'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types';

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
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center font-black text-zinc-950 text-base shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            🍪
          </div>
          <div>
            <span className="font-black text-base text-white tracking-tight block leading-none">Cookie Run</span>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mt-0.5">Classic Meta</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              pathname === '/' 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Home Recommendations
          </Link>

          <Link
            href="/combo"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              pathname === '/combo' 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Browse Metas
          </Link>

          <Link
            href="/profile"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              pathname === '/profile' 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Inventory Profile
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                pathname === '/admin' 
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' 
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500 hover:text-white'
              }`}
            >
              <span>⚡ Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* User Account / Auth Widget */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-16 h-6 bg-zinc-900 animate-pulse rounded-lg"></div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-none">{profile?.name || profile?.username}</span>
                <span className="text-[10px] font-semibold text-amber-400 capitalize">{profile?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition"
            >
              Sign In / Register
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
