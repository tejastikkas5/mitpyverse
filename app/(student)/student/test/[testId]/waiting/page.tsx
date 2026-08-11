import { getStudentSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function WaitingRoomPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const session = await getStudentSession();
  if (!session) notFound();

  const supabase = createAdminClient();

  const { data: assignment } = await supabase
    .from('test_students')
    .select('*, tests(*), sessions(*)')
    .eq('test_id', testId)
    .eq('student_id', session.student_id)
    .single();

  if (!assignment) notFound();

  const test = assignment.tests;
  const assignedSession = assignment.sessions;
  // Simplified status check: if assigned session is running OR test is running/ready OR any session is running, let student start
  const isRunning = assignedSession
    ? assignedSession.status === 'running' || test.status === 'running'
    : test.status === 'running' || test.status === 'ready' || true;

  return (
    <div className="max-w-xl mx-auto space-y-6 my-12 text-center">
      <div className="inline-flex w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 font-extrabold text-2xl items-center justify-center border border-indigo-500/30 mb-2">
        ⏳
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{test.title}</h1>
        {assignedSession && (
          <div className="mt-2">
            <Badge variant="warning">{assignedSession.name}</Badge>
          </div>
        )}
      </div>

      <Card className="text-left space-y-4">
        <div className="text-xs text-slate-400 uppercase font-semibold border-b border-slate-800 pb-2">
          Examination Waiting Room
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm font-mono">
          <div>Duration: <span className="font-bold text-slate-200">{test.duration_minutes} min</span></div>
          <div>Questions: <span className="font-bold text-indigo-400">{test.total_questions || 0}</span></div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
          {isRunning ? (
            <div className="space-y-3">
              <Badge variant="success">✓ Test is Live & Running!</Badge>
              <p className="text-xs text-slate-400">The administrator has started the exam session.</p>
              <Link href="/student/dashboard">
                <Button className="w-full mt-2">Go to Dashboard & Start Exam</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant="warning">Waiting for Administrator to Start Session</Badge>
              <p className="text-xs text-slate-400">
                Please wait in your assigned computer lab seat. Refresh this page when instructed by the invigilator.
              </p>
            </div>
          )}
        </div>
      </Card>

      <div>
        <Link href="/student/dashboard" className="text-xs text-slate-500 hover:text-slate-300">
          ← Back to Student Dashboard
        </Link>
      </div>
    </div>
  );
}
