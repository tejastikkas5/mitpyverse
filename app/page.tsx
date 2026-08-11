'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Home() {
  const [dark, setDark] = useState(false);

  // Persist preference
  useEffect(() => {
    const saved = localStorage.getItem('home-theme');
    if (saved === 'dark') setDark(true);
  }, []);

  const toggleTheme = () => {
    setDark((prev) => {
      localStorage.setItem('home-theme', !prev ? 'dark' : 'light');
      return !prev;
    });
  };

  const bg = dark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900';
  const headerBg = dark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200';
  const cardBg = dark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200';
  const textMuted = dark ? 'text-slate-400' : 'text-slate-500';
  const textSub = dark ? 'text-slate-300' : 'text-slate-600';
  const pillBg = dark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600';
  const sectionBg = dark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200';
  const infoBg = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const quoteBg = dark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600';
  const featurePill = dark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500';

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-300 ${bg}`}>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold py-2 px-4 text-center tracking-wide">
        🚀 Organized by Department of CSE, MITCORER Barshi &nbsp;·&nbsp; ByteBuilders Coding Club
      </div>

      {/* Header */}
      <header className={`px-4 sm:px-6 py-3 sm:py-4 border-b backdrop-blur-md sticky top-0 z-50 ${headerBg}`}>
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-3">

          {/* Logo + Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow-lg p-1 sm:p-1.5 flex items-center justify-center border border-slate-200 flex-shrink-0">
              <Image
                src="/PyVerse_logo.png"
                alt="MIT PyVerse"
                width={52}
                height={52}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <h1 className={`font-extrabold text-base sm:text-xl tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
              MIT PyVerse
            </h1>
          </div>

          {/* Nav + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sliding Pill Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`relative flex items-center w-14 sm:w-16 h-7 sm:h-8 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${dark ? 'bg-slate-900 border border-slate-700' : 'bg-slate-100 border border-slate-300'}`}
            >
              {/* Moon icon */}
              <span className={`absolute left-1.5 sm:left-2 text-[11px] sm:text-[13px] transition-opacity duration-200 select-none ${dark ? 'opacity-100' : 'opacity-0'}`}>
                🌙
              </span>
              {/* Sun icon */}
              <span className={`absolute right-1.5 sm:right-2 text-[11px] sm:text-[13px] transition-opacity duration-200 select-none ${dark ? 'opacity-0' : 'opacity-100'}`}>
                ☀️
              </span>
              {/* Sliding circle */}
              <span
                className={`absolute top-0.5 sm:top-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-md transition-all duration-300 ${dark ? 'left-[calc(100%-1.5rem)] sm:left-[calc(100%-1.75rem)] bg-white' : 'left-0.5 sm:left-1 bg-slate-900'}`}
              />
            </button>

            <Link
              href="/login"
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors ${dark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Student
            </Link>
            <Link
              href="/admin/login"
              className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              Admin 🔐
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 max-w-7xl mx-auto w-full text-center space-y-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-extrabold uppercase tracking-widest ${pillBg}`}>
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Practical Python & AI Development Course
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h2 className={`text-4xl sm:text-6xl font-black tracking-tight leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
            Code. Build. <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Innovate With AI.
            </span>
          </h2>
          <p className={`text-base sm:text-xl max-w-2xl mx-auto leading-relaxed ${textSub}`}>
            Master Python, explore modern AI tools, analyze data, build real-world industry projects, and shape your future.
          </p>
        </div>

        {/* Login Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl mx-auto pt-4">
          <div className={`p-8 rounded-3xl border-2 border-indigo-300/50 hover:border-indigo-500 shadow-xl flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1 ${cardBg}`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">🎓</div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 uppercase tracking-wider">Active Access</span>
              </div>
              <h3 className={`text-2xl font-black mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Student Portal</h3>
              <p className={`text-sm leading-relaxed mb-6 ${textMuted}`}>
                Enrolled 2nd Year CSE students log in here to access live examinations, assignments, and test assessments.
              </p>
            </div>
            <Link href="/login" className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 text-center transition-all flex items-center justify-center gap-2">
              Student Login Portal →
            </Link>
          </div>

          <div className={`p-8 rounded-3xl border-2 border-purple-300/50 hover:border-purple-500 shadow-xl flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1 ${cardBg}`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl">🛡️</div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200 uppercase tracking-wider">Faculty Only</span>
              </div>
              <h3 className={`text-2xl font-black mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Admin Portal</h3>
              <p className={`text-sm leading-relaxed mb-6 ${textMuted}`}>
                Faculty & Instructors log in here to create tests, import students/questions, and monitor exams in real-time.
              </p>
            </div>
            <Link href="/admin/login" className="w-full py-3.5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/20 text-center transition-all flex items-center justify-center gap-2">
              Admin Login Portal →
            </Link>
          </div>
        </div>

        {/* Feature Pills */}
        <div className={`flex flex-wrap justify-center gap-3 text-xs font-semibold pt-4 ${featurePill}`}>
          {['🔒 Forced Fullscreen', '⚡ Live Anti-Cheat Monitor', '🎲 Randomized Papers', '📄 PDF Results Export', '🏆 Auto Grading'].map(f => (
            <span key={f} className={`px-4 py-2 rounded-xl border ${featurePill}`}>{f}</span>
          ))}
        </div>
      </section>

      {/* Course Curriculum */}
      <section className={`px-6 py-16 border-y ${sectionBg}`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className={`text-3xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>📘 What You Will Learn</h2>
            <p className={`text-sm ${textMuted}`}>From Python basics to AI-powered industry projects — a complete developer journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🐍', title: 'Python Programming', desc: 'Variables, Functions, OOP, File Handling, Multithreading and core concepts.' },
              { icon: '📊', title: 'Data Analysis', desc: 'NumPy, Pandas, Matplotlib and working with real-world datasets for insights.' },
              { icon: '🔀', title: 'Git & GitHub', desc: 'Version Control, Collaboration, Portfolio Building and professional showcasing.' },
              { icon: '🤖', title: 'AI Coding Tools', desc: 'Build with ChatGPT, Claude, Cursor AI, Codex and Antigravity for AI-assisted coding.' },
              { icon: '⚙️', title: 'AI Agents', desc: 'Prompt Engineering, AI Workflows and building Mini AI Agents for automation.' },
              { icon: '📁', title: 'Final Project', desc: 'Build and deploy an industry-level Python capstone project for placements.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className={`p-6 rounded-2xl border space-y-3 transition-all hover:-translate-y-0.5 ${infoBg}`}>
                <div className="text-3xl">{icon}</div>
                <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                <p className={`text-xs leading-relaxed ${textMuted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentor & Info */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`p-8 rounded-3xl border space-y-6 ${infoBg}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-900'}`}>🎯 Course Info</h3>
            <div className="space-y-4 text-sm">
              {[
                { label: 'Who Can Join?', desc: '2nd Year CSE/IT Students. No prior coding background required!' },
                { label: 'Duration & Mode', desc: '2–3 Months | College Hours | Offline in Classrooms & Labs' },
                { label: 'Perks & Benefits', desc: 'Certificate, GitHub Portfolio, Internship & Placement Boost' },
              ].map(({ label, desc }) => (
                <div key={label} className={`pt-3 first:pt-0 border-t first:border-0 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <span className={`font-bold block ${dark ? 'text-white' : 'text-slate-900'}`}>{label}</span>
                  <span className={`text-xs ${textMuted}`}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`lg:col-span-2 p-8 rounded-3xl border space-y-6 ${infoBg}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-900'}`}>⭐ Course Mentor</h3>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">Tech Lead & Mentor</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-3xl text-white shadow-xl flex-shrink-0">TT</div>
              <div className="space-y-1">
                <h4 className={`text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>Tejas Tikkas</h4>
                <p className="text-xs text-indigo-600 font-bold">Final Year, B.Tech in Computer Engineering</p>
                <p className={`text-xs ${textMuted}`}>Python Developer | AI Engineer | Tech Mentor</p>
                <div className="pt-3 flex flex-wrap gap-4 text-xs font-semibold">
                  <a href="https://github.com/tejastikkas5" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400 transition-colors">🔗 GitHub: tejastikkas5</a>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-2xl border text-center font-serif italic text-sm ${quoteBg}`}>
              "We don't just write code — we build solutions."
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-6 py-8 border-t text-center text-xs space-y-2 ${dark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
        <p className={`font-semibold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>MAEER's MITCORER Barshi — Department of Computer Science & Engineering</p>
        <p>© {new Date().getFullYear()} MIT PyVerse. Organized under ByteBuilders Coding Club.</p>
      </footer>
    </div>
  );
}
