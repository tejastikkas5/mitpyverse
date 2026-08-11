import { getSingleResultDetailAction } from '@/services/results';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function IndividualResultDetailPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { id, attemptId } = await params;
  const res = await getSingleResultDetailAction(attemptId);

  if (!res.success || !res.detail) notFound();

  const d = res.detail;
  const student = d.students;
  const test = d.tests;
  const session = d.sessions;
  const attempt = d.exam_attempts;
  const violations = attempt?.exam_violations || [];

  function formatTime(secs?: number) {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/admin/tests/${id}/results`} className="text-xs text-indigo-400 font-medium hover:underline">
            ← Back to All Test Results
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Student Result Detail</h1>
        </div>

        <Badge variant={attempt?.status === 'submitted' ? 'success' : 'danger'}>
          {attempt?.status}
        </Badge>
      </div>

      <Card title="Student Profile & Attempt Summary">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400 block">Student Name</span>
            <span className="font-semibold text-slate-100">{student?.name}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Student ID</span>
            <span className="font-mono font-bold text-indigo-400">{student?.student_code}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Examination</span>
            <span className="text-slate-200">{test?.title}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Session Batch</span>
            <span className="text-slate-200">{session?.name || 'Direct Test'}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold">Evaluated Score</div>
          <div className="text-3xl font-extrabold text-slate-100 mt-1">
            {d.score} <span className="text-sm font-normal text-slate-400">/ {d.total_marks}</span>
          </div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold">Percentage</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            {d.percentage.toFixed(2)}%
          </div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold">Time Taken</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">
            {formatTime(attempt?.time_taken_seconds)}
          </div>
        </Card>
      </div>

      <Card title={`Violations Audit Log (${violations.length})`}>
        {violations.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">No integrity violations recorded for this attempt.</div>
        ) : (
          <div className="space-y-2">
            {violations.map((v: any) => (
              <div key={v.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex justify-between">
                <span className="font-mono font-bold text-rose-400 uppercase">{v.violation_type}</span>
                <span className="text-slate-500 font-mono">{new Date(v.occurred_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* FULL QUESTION PAPER & STUDENT ANSWERS */}
      <Card title={`Submitted Answer Sheet (${(res.questionPaper || []).length} Questions)`}>
        <div className="space-y-6 mt-4">
          {(res.questionPaper || []).map((q: any, index: number) => {
            return (
              <div key={q.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Question {index + 1} ({q.marks} Mark{q.marks > 1 ? 's' : ''})
                    </span>
                    <h3 className="text-base font-semibold text-slate-100">{q.questionText}</h3>
                  </div>

                  {q.selectedOption ? (
                    q.isCorrect ? (
                      <Badge variant="success">✓ Correct (+{q.marks})</Badge>
                    ) : (
                      <Badge variant="danger">✗ Incorrect (0)</Badge>
                    )
                  ) : (
                    <Badge variant="neutral">
                      Unanswered (0)
                    </Badge>
                  )}
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                  {q.options.map((opt: any) => {
                    const isSelected = q.selectedOption === opt.option_label;
                    const isCorrect = q.correctOption === opt.option_label;

                    let optionBg = 'bg-slate-900 border-slate-800 text-slate-300';
                    if (isCorrect) {
                      optionBg = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-medium';
                    } else if (isSelected && !isCorrect) {
                      optionBg = 'bg-rose-950/40 border-rose-500/50 text-rose-300 font-medium';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${optionBg}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-200">
                            {opt.option_label}
                          </span>
                          <span>{opt.option_text}</span>
                        </div>

                        <div className="flex gap-1 font-mono text-[10px]">
                          {isSelected && <span className="text-indigo-400 font-bold">[Student Selected]</span>}
                          {isCorrect && <span className="text-emerald-400 font-bold">[Correct Answer]</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
