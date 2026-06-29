import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, apiFetch, showToast } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid work email address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(data.token, data.user);
      
      // Route based on role
      if (data.user.role === 'Admin') {
        navigate('/admin');
      } else if (data.user.role === 'HR') {
        navigate('/hr');
      } else {
        navigate('/employee');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password.');
      showToast(err.message || 'Login failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-6 text-slate-200 font-sans relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">NexaHR</h1>
          <p className="text-slate-400 text-sm">Enterprise Workforce Management Platform</p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-200 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15 active:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials & Info */}
          <div className="mt-8 pt-6 border-t border-slate-800/60 space-y-4">
            <div className="bg-slate-950/40 border border-slate-800/40 rounded-2xl p-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2 tracking-wider">
                💡 Instant Admin Access
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in with <strong className="text-blue-400">any email and password</strong> to instantly register and access as an <strong className="text-white font-semibold">Admin</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">
                Seeded Roles (Click to autofill)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@nexahr.com');
                    setPassword('admin123');
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-bold text-blue-400 block">Admin</span>
                  <span className="text-[9px] text-slate-500 font-mono block truncate">admin@nexahr.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('vedi@nexahr.com');
                    setPassword('vedika123');
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-bold text-amber-400 block">HR</span>
                  <span className="text-[9px] text-slate-500 font-mono block truncate">vedi@nexahr.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('trupti@nexahr.com');
                    setPassword('trupti123');
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-bold text-emerald-400 block">Employee</span>
                  <span className="text-[9px] text-slate-500 font-mono block truncate">trupti@nexahr.com</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
