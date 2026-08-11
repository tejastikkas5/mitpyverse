'use me';
'use client';

import { useState } from 'react';
import { createQuestionAction, updateQuestionAction, deleteQuestionAction, bulkImportQuestionsAction } from '@/services/questions';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

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
    } else {
      alert(res.error);
    }
  }

  // Helper: RFC4180 compliant CSV line parser (handles commas inside quotes)
  function parseCsvRow(rowText: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      if (char === '"') {
        if (inQuotes && rowText[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  async function handleBulkCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const text = await file.text();
    const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    if (rawLines.length === 0) {
      alert('CSV file is empty');
      setLoading(false);
      return;
    }

    // Check if line 1 is a header
    const firstRowCols = parseCsvRow(rawLines[0]);
    const isHeader =
      firstRowCols[0]?.toLowerCase().includes('question') ||
      firstRowCols[0]?.toLowerCase().includes('text') ||
      firstRowCols[5]?.toLowerCase().includes('correct') ||
      firstRowCols[5]?.toLowerCase().includes('answer');

    const startIndex = isHeader ? 1 : 0;
    const questionsData = [];

    for (let i = startIndex; i < rawLines.length; i++) {
      const cols = parseCsvRow(rawLines[i]);
      if (cols.length >= 6) {
        questionsData.push({
          question_text: cols[0],
          option_a: cols[1],
          option_b: cols[2],
          option_c: cols[3],
          option_d: cols[4],
          correct_option: (cols[5] ? cols[5].toUpperCase() : '') as QuestionOptionLabel,
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
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>
            📥 Bulk CSV Import
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            ➕ Add Question
          </Button>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card className="text-center p-8 text-slate-500">
            No questions created for this test yet. Click "Add Question" to begin.
          </Card>
        ) : (
          questions.map((q, idx) => (
            <Card key={q.id} className="relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-extrabold flex items-center justify-center text-xs">
                    Q{idx + 1}
                  </span>
                  <span className="font-semibold text-slate-100 text-base">{q.question_text}</span>
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
          ))
        )}
      </div>

      {/* ADD QUESTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <Card title="Add Question" subtitle="Define MCQ question text, choices, and answer key">
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <Input label="Question Text *" name="question_text" required placeholder="e.g. What is the output of print(2**3)?" />
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
                <Input
                  label="Question Text *"
                  name="question_text"
                  required
                  defaultValue={editingQuestion.question_text}
                />
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
      )}
    </div>
  );
}
