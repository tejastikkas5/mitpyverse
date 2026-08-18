'use me';
'use client';

import { useState } from 'react';
import { createQuestionAction, updateQuestionAction, deleteQuestionAction, deleteMultipleQuestionsAction, bulkImportQuestionsAction, reEvaluateTestScoresAction } from '@/services/questions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QuestionOptionLabel } from '@/types/database';

interface QuestionsClientProps {
  testId: string;
  initialQuestions: any[];
  sessions: any[];
}

export function QuestionsClient({ testId, initialQuestions, sessions }: QuestionsClientProps) {
  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Re-Evaluate State
  const [showReEvalModal, setShowReEvalModal] = useState(false);
  const [reEvalNote, setReEvalNote] = useState('');
  const [reEvalLoading, setReEvalLoading] = useState(false);
  const [reEvalResult, setReEvalResult] = useState<{ success: boolean; message: string } | null>(null);

  // Add Question State
  const [correctOption, setCorrectOption] = useState<QuestionOptionLabel>('A');
  // Edit Question State
  const [editCorrectOption, setEditCorrectOption] = useState<QuestionOptionLabel>('A');

  async function handleAddQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const question_text = formData.get('question_text') as string;
    const marks = parseInt(formData.get('marks') as string || '1', 10);
    const session_id = (formData.get('session_id') as string) || null;

    const optA = formData.get('optA') as string;
    const optB = formData.get('optB') as string;
    const optC = formData.get('optC') as string;
    const optD = formData.get('optD') as string;

    const result = await createQuestionAction({
      test_id: testId,
      session_id,
      question_text,
      marks,
      options: [
        { label: 'A', text: optA },
        { label: 'B', text: optB },
        { label: 'C', text: optC },
        { label: 'D', text: optD },
      ],
      correct_option: correctOption,
    });

    if (result.success && result.question) {
      window.location.reload();
    } else {
      alert(result.error || 'Failed to add question');
    }
    setLoading(false);
  }

  function openEditModal(q: any) {
    setEditingQuestion(q);
    const correctOpt = q.answer_keys?.[0]?.correct_option || 'A';
    setEditCorrectOption(correctOpt);
  }

  async function handleEditQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingQuestion) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const question_text = formData.get('question_text') as string;
    const marks = parseInt(formData.get('marks') as string || '1', 10);
    const session_id = (formData.get('session_id') as string) || null;

    const optA = formData.get('optA') as string;
    const optB = formData.get('optB') as string;
    const optC = formData.get('optC') as string;
    const optD = formData.get('optD') as string;

    const result = await updateQuestionAction({
      question_id: editingQuestion.id,
      test_id: testId,
      session_id,
      question_text,
      marks,
      options: [
        { label: 'A', text: optA },
        { label: 'B', text: optB },
        { label: 'C', text: optC },
        { label: 'D', text: optD },
      ],
      correct_option: editCorrectOption,
    });

    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error || 'Failed to update question');
    }
    setLoading(false);
  }

  async function handleDeleteQuestion(qId: string) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const res = await deleteQuestionAction(qId, testId);
    if (res.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== qId));
      setSelectedQuestionIds((prev) => prev.filter((id) => id !== qId));
    } else {
      alert(res.error);
    }
  }

  function toggleSelectQuestion(qId: string) {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  }

  function toggleSelectAll() {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(questions.map((q) => q.id));
    }
  }

  async function handleBulkDelete() {
    if (selectedQuestionIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedQuestionIds.length} selected question(s)?`)) return;

    setLoading(true);
    const res = await deleteMultipleQuestionsAction(selectedQuestionIds, testId);
    setLoading(false);

    if (res.success) {
      setQuestions((prev) => prev.filter((q) => !selectedQuestionIds.includes(q.id)));
      setSelectedQuestionIds([]);
    } else {
      alert(res.error || 'Failed to delete selected questions');
    }
  }

  // Strip invisible/non-printable chars from a CSV field value (BOM, CRLF remnants, zero-width chars, etc.)
  function cleanField(s: string): string {
    return s
      .replace(/\uFEFF/g, '')   // BOM
      .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '') // Zero-width chars
      .replace(/\r/g, '')        // stray carriage returns
      .trim();
  }

  // Helper: RFC4180 multiline CSV parser that handles quotes, commas, AND newlines inside quoted fields
  function parseFullCsv(csvText: string): string[][] {
    // Strip leading BOM if present
    const text = csvText.replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped double quote ("")
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator — clean each field when pushed
        currentRow.push(cleanField(currentField));
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        // Row separator
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(cleanField(currentField));
        if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // Final row
    if (currentField || currentRow.length > 0) {
      currentRow.push(cleanField(currentField));
      if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
    }

    return rows;
  }

  async function handleBulkCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const text = await file.text();
    const rows = parseFullCsv(text);

    if (rows.length === 0) {
      alert('CSV file is empty');
      setLoading(false);
      return;
    }

    // Check if row 0 is a header
    const firstRowCols = rows[0];
    const isHeader =
      firstRowCols[0]?.toLowerCase().includes('question') ||
      firstRowCols[0]?.toLowerCase().includes('text') ||
      firstRowCols[5]?.toLowerCase().includes('correct') ||
      firstRowCols[5]?.toLowerCase().includes('answer');

    const startIndex = isHeader ? 1 : 0;
    const questionsData = [];

    for (let i = startIndex; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length >= 6) {
        // Strip any non-letter characters from correctOption (handles stray spaces, invisible chars)
        const rawCorrect = cols[5] ?? '';
        const safeCorrect = rawCorrect.replace(/[^A-Za-z]/g, '').toUpperCase();
        questionsData.push({
          question_text: cols[0],
          option_a: cols[1],
          option_b: cols[2],
          option_c: cols[3],
          option_d: cols[4],
          correct_option: safeCorrect as QuestionOptionLabel,
          marks: cols[6] ? parseInt(cols[6], 10) || 1 : 1,
        });
      }
    }

    if (questionsData.length === 0) {
      alert('No valid question rows found in CSV. Please ensure each row has at least 6 columns (question, optA, optB, optC, optD, correctOption).');
      setLoading(false);
      return;
    }

    const res = await bulkImportQuestionsAction(testId, selectedSessionId, questionsData);
    setLoading(false);

    if (res.success) {
      let msg = `Import complete! ${res.successful} added, ${res.failed} failed.`;
      if (res.errors && res.errors.length > 0) {
        msg += `\n\nDetails:\n${res.errors.join('\n')}`;
      }
      alert(msg);
      window.location.reload();
    } else {
      alert('Failed to import questions');
    }
  }

  async function handleReEvaluate() {
    setReEvalLoading(true);
    setReEvalResult(null);
    const res = await reEvaluateTestScoresAction(testId, reEvalNote.trim() || undefined);
    setReEvalLoading(false);
    if (res.success) {
      setReEvalResult({
        success: true,
        message: `✅ Re-evaluation complete! ${res.successCount} of ${res.totalAttempts} student scores updated successfully.${(res.failCount ?? 0) > 0 ? ` (${res.failCount} failed)` : ''}`,
      });
    } else {
      setReEvalResult({ success: false, message: `❌ Error: ${(res as any).error}` });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Question Management (Hybrid Scope)</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Questions can be shared across the entire test or assigned specifically to Session A (Paper A), Session B (Paper B).
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setShowReEvalModal(true); setReEvalResult(null); setReEvalNote(''); }}
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
          >
            🔄 Re-Evaluate Scores
          </Button>
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>
            📥 Bulk CSV Import
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            ➕ Add Question
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {questions.length > 0 && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={questions.length > 0 && selectedQuestionIds.length === questions.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
            <span>Select All ({selectedQuestionIds.length}/{questions.length} selected)</span>
          </label>

          {selectedQuestionIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={loading}
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold"
            >
              🗑️ Delete Selected ({selectedQuestionIds.length})
            </Button>
          )}
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card className="text-center p-8 text-slate-500">
            No questions created for this test yet. Click "Add Question" to begin.
          </Card>
        ) : (
          questions.map((q, idx) => {
            const isSelected = selectedQuestionIds.includes(q.id);
            return (
              <Card key={q.id} className={`relative transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-950/10' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectQuestion(q.id)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                    <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-extrabold flex items-center justify-center text-xs">
                      Q{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-100 text-base whitespace-pre-wrap font-mono">{q.question_text}</span>
                  </div>
                <div className="flex items-center gap-2">
                  {q.session_id ? (
                    <Badge variant="warning">
                      Session Paper: {sessions.find((s) => s.id === q.session_id)?.name || 'Specific Session'}
                    </Badge>
                  ) : (
                    <Badge variant="info">Test-Level Shared</Badge>
                  )}
                  <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
                    {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => openEditModal(q)} className="text-indigo-400 hover:text-indigo-300">
                    ✏️ Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(q.id)} className="text-rose-400 hover:text-rose-300">
                    🗑️
                  </Button>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {q.options?.map((opt: any) => {
                  const isCorrect = q.answer_keys?.[0]?.correct_option === opt.option_label;
                  return (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded-lg border text-sm flex items-center gap-2 ${
                        isCorrect
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 font-medium'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-bold text-xs w-5 h-5 rounded bg-slate-800 flex items-center justify-center">
                        {opt.option_label}
                      </span>
                      <span>{opt.option_text}</span>
                      {isCorrect && <span className="ml-auto text-xs text-emerald-400 font-bold">✓ Correct Answer Key</span>}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })
      )}
    </div>

      {/* ADD QUESTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <Card title="Add Question" subtitle="Define MCQ question text, choices, and answer key">
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Question Text *</label>
                  <textarea
                    name="question_text"
                    required
                    rows={4}
                    placeholder="e.g. What is the output of:&#10;int x = 10;&#10;printf(&quot;%d&quot;, x);"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <Input label="Marks" name="marks" type="number" defaultValue="1" required />

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">MCQ Options (A, B, C, D) *</label>
                  <Input label="Option A" name="optA" required placeholder="Option A text" />
                  <Input label="Option B" name="optB" required placeholder="Option B text" />
                  <Input label="Option C" name="optC" required placeholder="Option C text" />
                  <Input label="Option D" name="optD" required placeholder="Option D text" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Correct Answer Key *</label>
                  <div className="flex gap-4">
                    {(['A', 'B', 'C', 'D'] as const).map((lbl) => (
                      <label key={lbl} className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                        <input
                          type="radio"
                          name="correct_option"
                          value={lbl}
                          checked={correctOption === lbl}
                          onChange={() => setCorrectOption(lbl)}
                          className="accent-indigo-600"
                        />
                        Option {lbl}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Question'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* EDIT QUESTION MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <Card title="Edit Question" subtitle="Update question text, choices, marks, or answer key">
              <form onSubmit={handleEditQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Question Text *</label>
                  <textarea
                    name="question_text"
                    required
                    rows={4}
                    defaultValue={editingQuestion.question_text}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <Input
                  label="Marks"
                  name="marks"
                  type="number"
                  defaultValue={editingQuestion.marks || 1}
                  required
                />

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">MCQ Options (A, B, C, D) *</label>
                  <Input
                    label="Option A"
                    name="optA"
                    required
                    defaultValue={editingQuestion.options?.find((o: any) => o.option_label === 'A')?.option_text || ''}
                  />
                  <Input
                    label="Option B"
                    name="optB"
                    required
                    defaultValue={editingQuestion.options?.find((o: any) => o.option_label === 'B')?.option_text || ''}
                  />
                  <Input
                    label="Option C"
                    name="optC"
                    required
                    defaultValue={editingQuestion.options?.find((o: any) => o.option_label === 'C')?.option_text || ''}
                  />
                  <Input
                    label="Option D"
                    name="optD"
                    required
                    defaultValue={editingQuestion.options?.find((o: any) => o.option_label === 'D')?.option_text || ''}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Correct Answer Key *</label>
                  <div className="flex gap-4">
                    {(['A', 'B', 'C', 'D'] as const).map((lbl) => (
                      <label key={lbl} className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                        <input
                          type="radio"
                          name="edit_correct_option"
                          value={lbl}
                          checked={editCorrectOption === lbl}
                          onChange={() => setEditCorrectOption(lbl)}
                          className="accent-indigo-600"
                        />
                        Option {lbl}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setEditingQuestion(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Question'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <Card title="Bulk Import Questions (CSV)" subtitle="Format: question, optA, optB, optC, optD, correctOption, marks">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Scope</label>
                  <select
                    value={selectedSessionId || ''}
                    onChange={(e) => setSelectedSessionId(e.target.value || null)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="">Shared Test-Level</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Paper Specific)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 border-2 border-dashed border-slate-800 rounded-lg text-center bg-slate-950">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkCsv}
                    disabled={loading}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white"
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => setShowBulkModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}\n\n      {/* RE-EVALUATE MODAL */}
      {showReEvalModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <Card title="🔄 Re-Evaluate All Student Scores" subtitle="Recalculate scores using the current (corrected) answer keys">
              <div className="space-y-4">
                {/* Warning Banner */}
                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-300 font-semibold">⚠️ Important</p>
                  <p className="text-xs text-amber-200/80 mt-1">
                    This will recalculate ALL submitted student scores using the <span className="font-bold text-amber-300">current answer keys</span>.
                    Previous scores will be preserved in the audit log — no data will be lost.
                  </p>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reason / Note <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={reEvalNote}
                    onChange={(e) => setReEvalNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. Fixed Q5 correct answer from C to D — re-evaluating all scores..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Result Message */}
                {reEvalResult && (
                  <div className={`p-3 rounded-lg border text-sm font-medium ${
                    reEvalResult.success
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                  }`}>
                    {reEvalResult.message}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setShowReEvalModal(false)}>
                    {reEvalResult ? 'Close' : 'Cancel'}
                  </Button>
                  {!reEvalResult && (
                    <Button
                      onClick={handleReEvaluate}
                      disabled={reEvalLoading}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
                    >
                      {reEvalLoading ? '⏳ Re-Evaluating...' : '🔄 Confirm Re-Evaluate'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
