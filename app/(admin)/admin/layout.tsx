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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
        {/* Sidebar / Top Nav on Mobile */}
        <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between transition-colors duration-200 flex-shrink-0">
          <div>
            <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between md:justify-start gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 p-1">
                  <Image
                    src="/PyVerse_logo.png"
                    alt="PyVerse Logo"
                    width={56}
                    height={56}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div>
                  <h1 className="font-extrabold text-slate-100 leading-none text-base md:text-lg">MITPyVerse</h1>
                  <span className="text-xs text-indigo-400 font-bold">Admin Portal</span>
                </div>
              </div>

              <form action={adminLogoutAction} className="md:hidden">
                <button
                  type="submit"
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                >
                  Logout
                </button>
              </form>
            </div>

            <nav className="p-2 md:p-4 flex md:flex-col overflow-x-auto space-x-1 md:space-x-0 md:space-y-1">
              <Link
                href="/admin"
                className="flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/admin/students"
                className="flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                👥 Students
              </Link>
              <Link
                href="/admin/tests"
                className="flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                📝 Tests
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex p-4 border-t border-slate-800 items-center justify-between">
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
          <header className="h-14 md:h-16 border-b border-slate-800 bg-slate-900/50 px-4 md:px-8 flex items-center justify-between transition-colors duration-200">
            <h2 className="text-xs md:text-sm font-bold text-slate-400">Admin Control Center</h2>
            
            <div className="flex items-center gap-3 md:gap-4">
              <ThemeToggleBar />
              
              <span className="text-[10px] md:text-xs px-2.5 md:px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          </header>

          <main className="p-4 md:p-8 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
