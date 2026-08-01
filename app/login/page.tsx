'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed.");
      } else {
        window.dispatchEvent(new Event('auth_changed'));
        if (data.account?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/profile');
        }
      }
    } catch (e: any) {
      setError("Server error during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setIsRegister(false);
    setUsername('admin');
    setPassword('admin123');
  };

  const fillDemoRunner = () => {
    setIsRegister(false);
    setUsername('runner');
    setPassword('runner123');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl max-w-md w-full p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Top Gradient Flare */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Runner Authentication Module</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {isRegister ? 'Create Your Account' : 'Sign In To Cookie Run'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Store your owned Cookies, Pets, & Treasures to unlock 100% personalized recommendations.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                !isRegister ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                isRegister ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Register New
            </button>
          </div>

          {error && (
            <div className="mb-4 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="e.g. CookieRunner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/20 transition"
            >
              {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials Fill Section */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block text-center mb-3">
              ⚡ Quick Fill Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={fillDemoAdmin}
                className="py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold transition text-left"
              >
                <span className="block font-black">👑 Admin Account</span>
                <span className="text-[10px] text-zinc-400 font-mono">admin / admin123</span>
              </button>

              <button
                onClick={fillDemoRunner}
                className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition text-left"
              >
                <span className="block font-black">🍪 Runner Account</span>
                <span className="text-[10px] text-zinc-400 font-mono">runner / runner123</span>
              </button>
            </div>
          </div>

          {/* OAuth Production Readiness Banner */}
          <div className="mt-6 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 text-center">
            🔐 <strong className="text-zinc-300">Production OAuth Architecture</strong>: Plug-and-play interface ready for Google OIDC, Discord, or NextAuth provider integration.
          </div>

        </div>
      </main>
    </div>
  );
}
