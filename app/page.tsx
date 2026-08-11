import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Banner / Announcement */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold py-2 px-4 text-center tracking-wide">
        Organized by Department of CSE, MITCORER Barshi under ByteBuilders Coding Club 🚀
      </div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 backdrop-blur-md bg-slate-950/80 sticky top-0 z-50 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg p-1">
            <Image
              src="/PyVerse_logo.png"
              alt="MIT PyVerse Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight leading-none">MIT PyVerse</h1>
            <span className="text-[10px] text-indigo-400 font-bold tracking-widest block mt-0.5">MAEER's MITCORER BARSHI</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Student Login
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
      <section className="relative overflow-hidden px-6 pt-16 pb-20 max-w-7xl mx-auto w-full text-center space-y-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-extrabold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Practical Python & AI Development Course
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Code. Build. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Innovate With AI.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Master Python, explore modern AI tools, analyze data, build real-world industry projects, and shape your future.
          </p>
        </div>

        {/* Portal Access Login Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl mx-auto pt-4">
          {/* Student Login Card */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/30 hover:border-indigo-500 shadow-2xl flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
                  🎓
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Active Access
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Student Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Enrolled 2nd Year CSE students log in here to access live examinations, assignments, and test assessments.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 text-center transition-all flex items-center justify-center gap-2"
            >
              <span>Student Login Portal</span>
              <span>→</span>
            </Link>
          </div>

          {/* Admin Login Card */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-purple-500/30 hover:border-purple-500 shadow-2xl flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl">
                  🛡️
                </div>
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Faculty Only
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Admin Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Faculty & Instructors log in here to create tests, import students/questions, and monitor exams in real-time.
              </p>
            </div>
            <Link
              href="/admin/login"
              className="w-full py-3.5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/30 text-center transition-all flex items-center justify-center gap-2"
            >
              <span>Admin Login Portal</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Course Curriculum & Modules */}
      <section className="px-6 py-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-white tracking-tight">📘 What You Will Learn</h2>
            <p className="text-sm text-slate-400">
              MIT PyVerse teaches Python from the ground up while introducing modern AI-powered development workflows and real-world project development.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-3xl">🐍</div>
              <h3 className="text-lg font-bold text-white">Python Programming</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Variables, Functions, Object-Oriented Programming (OOP), File Handling, Multithreading and core concepts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-3xl">📊</div>
              <h3 className="text-lg font-bold text-white">Data Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                NumPy, Pandas, Matplotlib, and working with real-world datasets for data insights.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-3xl">🔀</div>
              <h3 className="text-lg font-bold text-white">Git & GitHub</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Version Control, Collaboration, Portfolio Building, and showcasing projects professionally.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-3xl">🤖</div>
              <h3 className="text-lg font-bold text-white">AI Coding Tools</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build with modern AI tools including ChatGPT, Claude, Cursor AI, Codex, and Antigravity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-3xl">⚙️</div>
              <h3 className="text-lg font-bold text-white">AI Agents</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prompt Engineering, AI Workflows, and building Mini AI Agents for intelligent automation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-3xl">📁</div>
              <h3 className="text-lg font-bold text-white">Final Industry Project</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build and deploy an industry-level Python project for internships, hackathons, and placement portfolios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Info & Mentor Details */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Info */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🎯</span> Course Info
            </h3>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <span className="font-bold text-white block">Who Can Join?</span>
                <span className="text-xs text-slate-400">2nd Year CSE/IT Students. No prior coding background required!</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="font-bold text-white block">Duration & Mode</span>
                <span className="text-xs text-slate-400">2-3 Months | College Hours | Offline in Classrooms & Labs</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="font-bold text-white block">Perks & Benefits</span>
                <span className="text-xs text-slate-400">Certificate of Completion, GitHub Portfolio, Internship & Placement Boost</span>
              </div>
            </div>
          </div>

          {/* Mentor Profile */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⭐</span> Course Mentor
              </h3>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20">
                Tech Lead & Mentor
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-3xl text-white shadow-xl flex-shrink-0">
                TT
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-white">Tejas Tikkas</h4>
                <p className="text-xs text-indigo-400 font-bold">Final Year, B.Tech in Computer Engineering</p>
                <p className="text-xs text-slate-400">Python Developer | AI Engineer | Tech Mentor</p>
                
                <div className="pt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
                  <a href="https://github.com/tejastikkas5" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                    🔗 GitHub: tejastikkas5
                  </a>
                  <a href="https://www.linkedin.com/in/tejastikkas" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                    🔗 LinkedIn: tejastikkas
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center font-serif italic text-slate-300 text-sm">
              “We don’t just write code — we build solutions.”
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-400">
          MAEER's MITCORER Barshi — Department of Computer Science & Engineering
        </p>
        <p>© {new Date().getFullYear()} MIT PyVerse. Organized under ByteBuilders Coding Club.</p>
      </footer>
    </div>
  );
}
