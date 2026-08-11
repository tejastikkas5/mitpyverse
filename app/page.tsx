import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="px-6 py-5 border-b border-slate-800/80 backdrop-blur-md bg-slate-950/80 sticky top-0 z-50 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg p-1">
            <Image
              src="/PyVerse_logo.png"
              alt="PyVerse Logo"
              width={44}
              height={44}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight leading-none">MITPyVerse</h1>
            <span className="text-xs text-indigo-400 font-bold tracking-wider">EXAMINATION PLATFORM</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Student Portal
          </Link>
          <Link
            href="/admin/login"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Admin Portal 🔐
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-5xl mx-auto w-full text-center space-y-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-extrabold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Next-Gen AI Secured Examination System
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Secure, Intelligent & Seamless Online <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Examinations</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Welcome to the official MITPyVerse Examination & Assessment System. Built with automated anti-cheating security, randomized test papers, and instant analytics.
          </p>
        </div>

        {/* Access Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl pt-4">
          <Link
            href="/login"
            className="group p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all duration-300 text-left flex flex-col justify-between shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🎓
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Student Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Log in with your Student ID and access your assigned live examinations with anti-cheat protection.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-indigo-400 group-hover:text-indigo-300">
              <span>Student Login</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          <Link
            href="/admin/login"
            className="group p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition-all duration-300 text-left flex flex-col justify-between shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Admin Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Manage students, upload question papers, track live anti-cheat violations, and view instant results.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-purple-400 group-hover:text-purple-300">
              <span>Admin Login</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="pt-8 flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-400">
          <span className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">🔒 Forced Fullscreen Enforcement</span>
          <span className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">⚡ Live Monitor & Violations</span>
          <span className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">🎲 Randomized Question Papers</span>
          <span className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">📄 PDF Results Export</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MITPyVerse Examination Platform. All rights reserved.
      </footer>
    </div>
  );
}
