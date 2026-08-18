'use me';
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ResultRow, awardBonusMarksAction, getFullAnswerSheetAction } from '@/services/results';
import { getTestAdjustmentsAction } from '@/services/adjustments';
import { resetViolationsAndReopenAttemptAction } from '@/services/monitoring';
import { exportResultsPDF, exportResultsExcel, exportAnswerSheetExcel, exportAnswerSheetPDF } from '@/utils/resultExport';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ResultsClientProps {
  testId: string;
  initialData: any;
}

export function ResultsClient({ testId, initialData }: ResultsClientProps) {
  const [data] = useState(initialData);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'name' | 'time'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Bonus Marks State
  const [showBonusPanel, setShowBonusPanel] = useState(false);
  const [bonusMarks, setBonusMarks] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusResult, setBonusResult] = useState<{ success: boolean; message: string } | null>(null);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [adjustmentsLoaded, setAdjustmentsLoaded] = useState(false);

  // Answer Sheet Export State
  const [answerSheetLoading, setAnswerSheetLoading] = useState<'excel' | 'pdf' | null>(null);

  const test = data?.test;
  const sessions = data?.sessions || [];
  const analytics = data?.analytics || {};
  const rawResults: ResultRow[] = data?.rankedResults || [];

  // Filter & Sort Results
  let filtered = rawResults.filter((r) => {
    const matchesSession = selectedSessionId === 'all' || r.sessionId === selectedSessionId;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentCode.toLowerCase().includes(search.toLowerCase());

    return matchesSession && matchesStatus && matchesSearch;
  });

  // Client-side Sorting
  filtered = filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'rank') comparison = a.rank - b.rank;
    else if (sortBy === 'score') comparison = b.score - a.score;
    else if (sortBy === 'name') comparison = a.studentName.localeCompare(b.studentName);
    else if (sortBy === 'time') comparison = a.timeTakenSeconds - b.timeTakenSeconds;

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const activeSessionName =
    selectedSessionId === 'all'
      ? 'All Sessions'
      : sessions.find((s: any) => s.id === selectedSessionId)?.name || 'Session';

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  }

  async function handleBonusMarks() {
    const marks = parseFloat(bonusMarks);
    if (!marks || marks <= 0) { alert('Please enter valid bonus marks (> 0).'); return; }
    if (!bonusReason.trim()) { alert('Please enter a reason for awarding bonus marks.'); return; }
    if (!confirm(`Award +${marks} marks to ALL students? This action will be logged and previous scores will be preserved.`)) return;

    setBonusLoading(true);
    setBonusResult(null);
    const res = await awardBonusMarksAction(testId, marks, bonusReason);
    setBonusLoading(false);

    if (res.success) {
      setBonusResult({
        success: true,
        message: `✅ Bonus applied! ${res.successCount} of ${res.totalStudents} students received +${marks} marks.${(res.failCount ?? 0) > 0 ? ` (${res.failCount} failed)` : ''}`,
      });
      setBonusMarks('');
      setBonusReason('');
      // Reload adjustments log
      const adjRes = await getTestAdjustmentsAction(testId);
      if (adjRes.success) setAdjustments(adjRes.adjustments);
    } else {
      setBonusResult({ success: false, message: `❌ Error: ${(res as any).error}` });
    }
  }

  async function handleLoadAdjustments() {
    if (adjustmentsLoaded) return;
    const res = await getTestAdjustmentsAction(testId);
    if (res.success) { setAdjustments(res.adjustments); setAdjustmentsLoaded(true); }
  }

  async function handleAnswerSheetExport(format: 'excel' | 'pdf') {
    setAnswerSheetLoading(format);
    const sessionFilter = selectedSessionId === 'all' ? null : selectedSessionId;
    const res = await getFullAnswerSheetAction(testId, sessionFilter);
    setAnswerSheetLoading(null);

    if (!res.success || !res.rows) {
      alert(`Failed to load answer sheet data: ${(res as any).error}`);
      return;
    }

    if (format === 'excel') {
      exportAnswerSheetExcel(test?.title || 'Exam', res.rows);
    } else {
      exportAnswerSheetPDF(test?.title || 'Exam', res.rows);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{test?.title} — Examination Results</h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative evaluated scores, rankings, analytics & official report exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Existing Result Exports */}
          <Button
            variant="outline"
            onClick={() => exportResultsPDF(test?.title || 'Exam', activeSessionName, filtered, analytics)}
          >
            📄 Export PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => exportResultsExcel(test?.title || 'Exam', activeSessionName, filtered)}
          >
            📊 Export Excel (.xlsx)
          </Button>
          {/* New Answer Sheet Exports */}
          <Button
            variant="outline"
            disabled={answerSheetLoading === 'excel'}
            onClick={() => handleAnswerSheetExport('excel')}
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
          >
            {answerSheetLoading === 'excel' ? '⏳ Loading...' : '📋 Answer Sheet (Excel)'}
          </Button>
          <Button
            variant="outline"
            disabled={answerSheetLoading === 'pdf'}
            onClick={() => handleAnswerSheetExport('pdf')}
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
          >
            {answerSheetLoading === 'pdf' ? '⏳ Loading...' : '📋 Answer Sheet (PDF)'}
          </Button>
        </div>
      </div>

      {/* ANALYTICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {analytics.topper ? (
          <Card className="border-amber-500/30 bg-amber-950/20 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div>
                <div className="text-xs text-amber-400 font-extrabold uppercase tracking-wider">Examination Topper</div>
                <div className="text-lg font-bold text-slate-100 mt-0.5">
                  {analytics.topper.studentName} <span className="font-mono text-indigo-400">({analytics.topper.studentCode})</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Score: <span className="font-bold text-amber-300">{analytics.topper.score} / {analytics.topper.totalMarks}</span> ({analytics.topper.percentage.toFixed(2)}%) • Time: {formatTime(analytics.topper.timeTakenSeconds)} • {analytics.topper.sessionName}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="col-span-1 md:col-span-2 text-slate-500 text-sm">No evaluated topper data available</Card>
        )}

        <Card>
          <div className="text-xs text-slate-400 font-semibold uppercase">Average Score</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">
            {analytics.averageScore} <span className="text-xs font-normal text-slate-400">({analytics.averagePercentage}%)</span>
          </div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 font-semibold uppercase">Score Range (High / Low)</div>
          <div className="text-xl font-extrabold text-slate-100 mt-1">
            <span className="text-emerald-400">{analytics.highestScore}</span> / <span className="text-rose-400">{analytics.lowestScore}</span>
          </div>
        </Card>
      </div>

      {/* 🎁 BONUS MARKS PANEL */}
      <Card className="border-violet-500/20 bg-violet-950/10">
        <button
          onClick={() => { setShowBonusPanel(!showBonusPanel); if (!showBonusPanel) handleLoadAdjustments(); }}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🎁</span>
            <div>
              <div className="text-sm font-bold text-violet-300">Award Bonus Marks to All Students</div>
              <div className="text-xs text-slate-400">For faulty questions where all options were incorrect</div>
            </div>
          </div>
          <span className="text-slate-400 text-sm">{showBonusPanel ? '▲ Collapse' : '▼ Expand'}</span>
        </button>

        {showBonusPanel && (
          <div className="mt-4 space-y-4 pt-4 border-t border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bonus Marks to Award *</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={bonusMarks}
                  onChange={(e) => setBonusMarks(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Note *</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="e.g. Q1 (1 mark) and Q12 (3 marks) had no valid correct option — awarding 4 marks to all students"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Result Message */}
            {bonusResult && (
              <div className={`p-3 rounded-lg border text-sm font-medium ${
                bonusResult.success
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              }`}>
                {bonusResult.message}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleBonusMarks}
                disabled={bonusLoading}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold"
              >
                {bonusLoading ? '⏳ Applying...' : '🎁 Apply Bonus Marks'}
              </Button>
            </div>

            {/* Adjustment History */}
            {adjustments.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📋 Adjustment History</div>
                <div className="space-y-1.5">
                  {adjustments.map((adj: any) => (
                    <div key={adj.id} className="flex items-center justify-between text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                      <div>
                        <span className={`font-bold mr-2 ${adj.adjustment_type === 'bonus_marks' ? 'text-violet-400' : 'text-amber-400'}`}>
                          {adj.adjustment_type === 'bonus_marks' ? '🎁 Bonus' : '🔄 Re-Eval'}
                        </span>
                        {adj.adjustment_type === 'bonus_marks' && (
                          <span className="text-emerald-400 font-mono font-bold mr-2">+{adj.bonus_marks} marks</span>
                        )}
                        <span className="text-slate-300">{adj.reason}</span>
                      </div>
                      <span className="text-slate-500 ml-3 whitespace-nowrap">
                        {new Date(adj.applied_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* FILTER & SEARCH TOOLBAR */}
      <Card className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-72">
          <Input
            placeholder="Search student name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="text-slate-400 font-semibold mr-1.5">Session:</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="all">All Sessions</option>
              {sessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold mr-1.5">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="rank">Rank</option>
              <option value="score">Score</option>
              <option value="name">Name</option>
              <option value="time">Time Taken</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono"
          >
            {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
          </button>
        </div>
      </Card>

      {/* RESULTS RANKED TABLE */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Rank</th>
                <th className="p-4">Student ID</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Session</th>
                <th className="p-4">Score</th>
                <th className="p-4">Percentage</th>
                <th className="p-4">Time Taken</th>
                <th className="p-4">Violations</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No evaluated examination results match current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.attemptId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      {r.rank === 1 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-extrabold flex items-center justify-center text-xs border border-amber-500/30">
                          🥇 1
                        </span>
                      ) : r.rank === 2 ? (
                        <span className="w-7 h-7 rounded-full bg-slate-400/20 text-slate-200 font-extrabold flex items-center justify-center text-xs border border-slate-400/30">
                          🥈 2
                        </span>
                      ) : r.rank === 3 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 font-extrabold flex items-center justify-center text-xs border border-amber-700/30">
                          🥉 3
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400 text-xs pl-2">#{r.rank}</span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-semibold text-indigo-400">{r.studentCode}</td>
                    <td className="p-4 font-medium text-slate-100">{r.studentName}</td>
                    <td className="p-4">
                      <Badge variant="neutral">{r.sessionName}</Badge>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-100">
                      {r.score} / {r.totalMarks}
                    </td>
                    <td className="p-4 font-mono font-semibold text-emerald-400">
                      {r.percentage.toFixed(2)}%
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">{formatTime(r.timeTakenSeconds)}</td>
                    <td className="p-4 font-mono text-xs">
                      {r.violationsCount > 0 ? (
                        <span className="text-rose-400 font-bold">⚠️ {r.violationsCount}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end items-center gap-2">
                      {r.violationsCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (!confirm(`Reset violations and re-open attempt for ${r.studentName}? This will clear violations and allow student to log back in.`)) return;
                            const res = await resetViolationsAndReopenAttemptAction(r.attemptId, testId);
                            if (res.success) window.location.reload();
                            else alert(res.error);
                          }}
                          className="text-amber-400 hover:text-amber-300 border-amber-500/30 text-xs"
                        >
                          🔄 Reset & Give 2nd Chance
                        </Button>
                      )}
                      <Link href={`/admin/tests/${testId}/results/${r.attemptId}`}>
                        <Button size="sm" variant="ghost">
                          View →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
