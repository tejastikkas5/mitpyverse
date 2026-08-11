'use me';
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { startOrResumeExamAttemptAction } from '@/services/attempts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';

interface StudentDashboardClientProps {
  studentName: string;
  studentCode: string;
  assignedTests: any[];
}

export function StudentDashboardClient({
  studentName,
  studentCode,
  assignedTests,
}: StudentDashboardClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleStartOrResume(testId: string) {
    setLoadingId(testId);
    
    // Request fullscreen immediately within direct user click gesture handler
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen request caught or denied
      });
    }

    const res = await startOrResumeExamAttemptAction(testId);

    if (res.success && res.attemptId) {
      router.push(`/student/exam/${res.attemptId}`);
    } else {
      alert(res.error || 'Unable to start exam');
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome, {studentName}!</h1>
        <p className="text-sm text-slate-500 mt-1">
          Student ID: <span className="font-mono text-indigo-600 font-bold px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg">{studentCode}</span>
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Your Assigned Examinations</h2>

        {assignedTests.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-slate-400 font-medium">
            No active examinations assigned to your account at this time.
          </div>
        ) : (
          assignedTests.map((item) => {
            const { test, session, attempt } = item;
            const isSubmitted =
              attempt?.status === 'submitted' ||
              attempt?.status === 'auto_submitted' ||
              attempt?.status === 'force_submitted';

            return (
              <div key={test.id} className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{test.title}</h3>
                    {session && <Badge variant="warning">{session.name}</Badge>}
                  </div>
                  {test.description && <p className="text-xs text-slate-500 mt-1">{test.description}</p>}

                  <div className="flex gap-4 mt-3 text-xs text-slate-600 font-mono font-medium">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200/60">⏱️ {test.duration_minutes} min</span>
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200/60">❓ {test.total_questions || 0} questions</span>
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200/60">💯 {test.total_marks || 0} marks</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isSubmitted ? (
                    <span className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      ✓ Exam Submitted
                    </span>
                  ) : attempt?.status === 'in_progress' ? (
                    <button
                      onClick={() => handleStartOrResume(test.id)}
                      disabled={loadingId === test.id}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                    >
                      {loadingId === test.id ? 'Resuming...' : '▶ Resume Exam'}
                    </button>
                  ) : test.status !== 'running' ? (
                    <div className="flex flex-col items-end gap-1">
                      <button disabled className="px-4 py-2 bg-amber-50 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 opacity-80 cursor-not-allowed">
                        ⏳ Waiting for Admin to Start
                      </button>
                      <span className="text-[10px] text-amber-600 font-semibold">Test Not Live Yet</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartOrResume(test.id)}
                      disabled={loadingId === test.id}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                    >
                      {loadingId === test.id ? 'Starting...' : '🚀 Start Exam'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
