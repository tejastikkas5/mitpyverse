'use client';

import { useState } from 'react';
import Image from 'next/image';
import { studentLoginAction } from '@/lib/auth/actions';

export default function StudentLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await studentLoginAction(formData);

    if (result && !result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
        
        {/* LEFT SIDE — BRANDING & LOGO */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative background circles */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-24 h-24 bg-white rounded-2xl p-2 flex items-center justify-center shadow-xl shadow-black/25 shrink-0 border border-slate-100">
              <img
                src="/PyVerse_logo.png"
                alt="PyVerse Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">MITPyVerse</h2>
              <p className="text-xs text-indigo-200 font-semibold tracking-wider uppercase mt-0.5">Examination System</p>
            </div>
          </div>

          {/* Center Showcase */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 border border-white/10">
              🎓 Student Examination Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Welcome to Your Online Assessment Platform
            </h1>
            <p className="text-sm text-indigo-100/80 leading-relaxed">
              Secure, server-authoritative examination environment with automated scoring and instant feedback.
            </p>
          </div>

          {/* Footer Badge */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200/70">
            <span>© MITPyVerse 2026</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Portal Active
            </span>
          </div>
        </div>

        {/* RIGHT SIDE — LIGHT THEME LOGIN FORM */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm w-full mx-auto space-y-6">
            
            {/* Form Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Student Sign In
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your credentials assigned by your administrator.
              </p>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="studentCode" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Student ID
                </label>
                <input
                  id="studentCode"
                  name="studentCode"
                  type="text"
                  placeholder="e.g. MPV26-001"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 font-mono text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to Student Portal →</span>
                )}
              </button>
            </form>

            {/* Help Note */}
            <p className="text-xs text-center text-slate-400 pt-2">
              Forgot your Student ID or Password? Contact your invigilator.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
