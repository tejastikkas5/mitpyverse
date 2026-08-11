import Image from 'next/image';
import { getStudentSession } from '@/lib/auth/session';
import { studentLogoutAction } from '@/lib/auth/actions';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getStudentSession();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-200 bg-white shadow-sm px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 p-1.5 flex items-center justify-center shadow-sm">
            <Image
              src="/PyVerse_logo.png"
              alt="PyVerse Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-base">MITPyVerse</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block -mt-1">Student Examination Portal</span>
          </div>
        </div>

        {session && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800">{session.student_name}</div>
              <div className="text-xs text-indigo-600 font-mono font-semibold">{session.student_code}</div>
            </div>
            <form action={studentLogoutAction}>
              <button
                type="submit"
                className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200"
              >
                Logout
              </button>
            </form>
          </div>
        )}
      </header>
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
