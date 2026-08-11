'use me';
'use client';

import { useState } from 'react';
import {
  adminStartSessionAction,
  adminPauseSessionAction,
  adminExtendTimeAction,
  adminForceSubmitAttemptAction,
  resetViolationsAndReopenAttemptAction,
} from '@/services/monitoring';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

interface MonitorClientProps {
  testId: string;
  initialData: any;
}

export function MonitorClient({ testId, initialData }: MonitorClientProps) {
  const [data, setData] = useState(initialData);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showViolationsModal, setShowViolationsModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const test = data?.test;
  const sessions = data?.sessions || [];
  const students = data?.monitoredStudents || [];

  // Filter students by search and session
  const filteredStudents = students.filter((s: any) => {
    const matchesSearch =
      s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode?.toLowerCase().includes(search.toLowerCase());

    const matchesSession = selectedSessionId === 'all' || s.sessionId === selectedSessionId;
    return matchesSearch && matchesSession;
  });

  // Calculate Overview Stats
  const totalAssigned = students.length;
  const notStartedCount = students.filter((s: any) => s.status === 'not_started').length;
  const inProgressCount = students.filter((s: any) => s.status === 'in_progress').length;
  const submittedCount = students.filter(
    (s: any) => s.status === 'submitted' || s.status === 'auto_submitted' || s.status === 'force_submitted'
  ).length;
  const totalViolations = students.reduce((acc: number, s: any) => acc + s.violationsCount, 0);

  // Admin Actions
  async function handleStartSession(sessId: string) {
    if (!confirm('Start this session? Students assigned to this batch will now be able to enter.')) return;
    setLoading(true);
    const res = await adminStartSessionAction(testId, sessId);
    if (res.success) window.location.reload();
    else alert(res.error);
    setLoading(false);
  }

  async function handlePauseSession(sessId: string) {
    if (!confirm('Pause this session?')) return;
    setLoading(true);
    const res = await adminPauseSessionAction(testId, sessId);
    if (res.success) window.location.reload();
    else alert(res.error);
    setLoading(false);
  }

  async function handleExtendTime() {
    const mins = prompt('Enter extra duration minutes to add to test (e.g. 10):', '10');
    if (!mins) return;
    const num = parseInt(mins, 10);
    if (isNaN(num) || num <= 0) return alert('Invalid number');

    setLoading(true);
    const res = await adminExtendTimeAction(testId, num);
    if (res.success) {
      alert(`Extended test duration by +${num} minutes.`);
      window.location.reload();
    } else alert(res.error);
    setLoading(false);
  }

  async function handleForceSubmit(attemptId: string, studentName: string) {
    if (!confirm(`Force submit examination for ${studentName}? Student will be locked out and evaluated immediately.`)) return;
    setLoading(true);
    const res = await adminForceSubmitAttemptAction(attemptId, testId);
    if (res.success) window.location.reload();
    else alert(res.error);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* HEADER CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">{test?.title} — Live Monitor</h1>
            <Badge variant="success">● Live Updates Active</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time invigilator control center for monitoring student exam progress & integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {test?.status !== 'running' ? (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              onClick={async () => {
                const formData = new FormData();
                formData.append('title', test.title);
                formData.append('duration_minutes', String(test.duration_minutes));
                formData.append('total_marks', String(test.total_marks));
                formData.append('status', 'running');
                const res = await (await import('@/services/tests')).updateTestAction(testId, formData);
                if (res.success) window.location.reload();
              }}
            >
              🚀 START TEST NOW
            </Button>
          ) : (
            <Button
              variant="danger"
              className="font-bold"
              onClick={async () => {
                const formData = new FormData();
                formData.append('title', test.title);
                formData.append('duration_minutes', String(test.duration_minutes));
                formData.append('total_marks', String(test.total_marks));
                formData.append('status', 'completed');
                const res = await (await import('@/services/tests')).updateTestAction(testId, formData);
                if (res.success) window.location.reload();
              }}
            >
              🛑 END TEST NOW
            </Button>
          )}
          <Button variant="outline" onClick={handleExtendTime} disabled={loading}>
            ⏱️ Extend Time (+10m)
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Assigned</div>
          <div className="text-2xl font-extrabold text-slate-100 mt-1">{totalAssigned}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-400 font-semibold uppercase">Not Started</div>
          <div className="text-2xl font-extrabold text-slate-400 mt-1">{notStartedCount}</div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 font-semibold uppercase">In Progress</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">{inProgressCount}</div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 font-semibold uppercase">Submitted</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{submittedCount}</div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 font-semibold uppercase">Violations</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{totalViolations}</div>
        </Card>
      </div>



      {/* STUDENT LIVE STATUS TABLE */}
      <Card className="p-0 overflow-hidden" title="Student Live Activity">
        <div className="p-4 border-b border-slate-800">
          <Input
            placeholder="Search student name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Student ID</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Violations</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No active student monitoring data found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s: any) => (
                  <tr key={s.assignmentId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-semibold text-indigo-400">{s.studentCode}</td>
                    <td className="p-4 font-medium text-slate-100">{s.studentName}</td>
                    <td className="p-4">
                      <Badge variant={s.status === 'in_progress' ? 'info' : s.status === 'submitted' ? 'success' : 'neutral'}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono">
                      {s.violationsCount > 0 ? (
                        <button
                          onClick={() => setShowViolationsModal(s)}
                          className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold hover:underline"
                        >
                          ⚠️ {s.violationsCount} violations (View)
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs">0 violations</span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2 items-center">
                      {s.violationsCount > 0 && s.attemptId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (!confirm(`Reset violations and re-open attempt for ${s.studentName}?`)) return;
                            setLoading(true);
                            const res = await resetViolationsAndReopenAttemptAction(s.attemptId, testId);
                            if (res.success) window.location.reload();
                            else alert(res.error);
                            setLoading(false);
                          }}
                          className="text-amber-400 hover:text-amber-300 border-amber-500/30 text-xs"
                        >
                          🔄 Reset Violations
                        </Button>
                      )}
                      {s.status === 'in_progress' && s.attemptId && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleForceSubmit(s.attemptId, s.studentName)}
                        >
                          ⛔ Force Submit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* VIOLATIONS DETAIL MODAL */}
      {showViolationsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg">
            <Card
              title={`Violations Log: ${showViolationsModal.studentName} (${showViolationsModal.studentCode})`}
              subtitle={`Total Recorded Violations: ${showViolationsModal.violationsCount}`}
            >
              <div className="space-y-3 my-4 max-h-60 overflow-y-auto pr-1">
                {showViolationsModal.violations.map((v: any) => (
                  <div key={v.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                    <span className="font-mono text-rose-400 font-bold uppercase">{v.violation_type}</span>
                    <span className="text-slate-500 font-mono">{new Date(v.occurred_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setShowViolationsModal(null)}>
                  Close Log
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
