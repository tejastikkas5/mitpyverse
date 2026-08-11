import Link from 'next/link';
import Image from 'next/image';
import { adminLogoutAction } from '@/lib/auth/actions';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggleBar } from '@/components/ThemeToggleBar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex transition-colors duration-200">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-colors duration-200">
          <div>
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 p-1">
                <Image
                  src="/PyVerse_logo.png"
                  alt="PyVerse Logo"
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-100 leading-none">MITPyVerse</h1>
                <span className="text-xs text-indigo-400 font-bold">Admin Portal</span>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/admin/students"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                👥 Students Management
              </Link>
              <Link
                href="/admin/tests"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                📝 Tests Management
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Logged in as <span className="text-slate-200 font-bold">Admin</span>
            </div>
            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
              >
                Logout
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-slate-800 bg-slate-900/50 px-8 flex items-center justify-between transition-colors duration-200">
            <h2 className="text-sm font-bold text-slate-400">Admin Control Center</h2>
            
            <div className="flex items-center gap-4">
              <ThemeToggleBar />
              
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                System Online
              </span>
            </div>
          </header>

          <main className="p-8 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
