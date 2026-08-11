'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { QuestionOptionLabel } from '@/types/database';

export async function getQuestionsByTestIdAction(testId: string) {
  const supabase = createAdminClient();

  // Step 1: Fetch questions with their options
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('test_id', testId)
    .order('order_index', { ascending: true });

  if (error) {
    return { success: false, error: error.message, questions: [] };
  }

  if (!questions || questions.length === 0) {
    return { success: true, questions: [] };
  }

  // Step 2: Fetch answer_keys separately (avoids relying on Supabase FK auto-join)
  const questionIds = questions.map((q) => q.id);
  const { data: answerKeys } = await supabase
    .from('answer_keys')
    .select('*')
    .in('question_id', questionIds);

  // Step 3: Merge answer_keys into each question
  const questionsWithKeys = questions.map((q) => ({
    ...q,
    answer_keys: (answerKeys || []).filter((ak) => ak.question_id === q.id),
  }));

  return { success: true, questions: questionsWithKeys };
}

export async function createQuestionAction(data: {
  test_id: string;
  session_id?: string | null;
  question_text: string;
  marks: number;
  options: { label: QuestionOptionLabel; text: string }[];
  correct_option: QuestionOptionLabel;
}) {
  if (!data.question_text || !data.question_text.trim()) {
    return { success: false, error: 'Question text is required.' };
  }
  if (!data.options || data.options.length < 4) {
    return { success: false, error: 'Must provide 4 options (A, B, C, D).' };
  }
  if (!data.correct_option) {
    return { success: false, error: 'Correct option is required.' };
  }

  const supabase = createAdminClient();

  // Validate session_id belongs to test_id if provided
  if (data.session_id) {
    const { data: session } = await supabase
      .from('sessions')
      .select('test_id')
      .eq('id', data.session_id)
      .single();

    if (!session || session.test_id !== data.test_id) {
      return { success: false, error: 'Session does not belong to this test.' };
    }
  }

  // Get current highest order_index
  const { data: existing } = await supabase
    .from('questions')
    .select('order_index')
    .eq('test_id', data.test_id)
    .order('order_index', { ascending: false })
    .limit(1);

  const order_index = existing && existing.length > 0 ? existing[0].order_index + 1 : 1;

  // 1. Insert Question
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .insert([
      {
        test_id: data.test_id,
        session_id: data.session_id || null,
        question_text: data.question_text.trim(),
        question_type: 'mcq',
        marks: data.marks || 1,
        order_index,
      },
    ])
    .select()
    .single();

  if (qErr || !question) {
    return { success: false, error: qErr?.message || 'Failed to create question' };
  }

  // 2. Insert 4 Options
  const optionRows = data.options.map((opt) => ({
    question_id: question.id,
    option_label: opt.label,
    option_text: opt.text.trim(),
  }));

  const { error: optErr } = await supabase.from('options').insert(optionRows);
  if (optErr) {
    return { success: false, error: optErr.message };
  }

  // 3. Upsert Answer Key (insert if missing, update if exists)
  const { error: keyErr } = await supabase.from('answer_keys').upsert(
    [{ question_id: question.id, correct_option: data.correct_option }],
    { onConflict: 'question_id' }
  );

  if (keyErr) {
    return { success: false, error: keyErr.message };
  }

  // Recalculate test total_questions and total_marks
  await updateTestTotals(data.test_id);

  revalidatePath(`/admin/tests/${data.test_id}/questions`);
  return { success: true, question };
}

export async function deleteQuestionAction(questionId: string, testId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from('questions').delete().eq('id', questionId);

  if (error) {
    return { success: false, error: error.message };
  }

  await updateTestTotals(testId);
  revalidatePath(`/admin/tests/${testId}/questions`);
  return { success: true };
}

export async function deleteMultipleQuestionsAction(questionIds: string[], testId: string) {
  if (!questionIds || questionIds.length === 0) {
    return { success: false, error: 'No questions selected for deletion.' };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from('questions').delete().in('id', questionIds);

  if (error) {
    return { success: false, error: error.message };
  }

  await updateTestTotals(testId);
  revalidatePath(`/admin/tests/${testId}/questions`);
  return { success: true };
}

export async function updateQuestionAction(data: {
  question_id: string;
  test_id: string;
  session_id?: string | null;
  question_text: string;
  marks: number;
  options: { label: QuestionOptionLabel; text: string }[];
  correct_option: QuestionOptionLabel;
}) {
  if (!data.question_text || !data.question_text.trim()) {
    return { success: false, error: 'Question text is required.' };
  }
  if (!data.options || data.options.length < 4) {
    return { success: false, error: 'Must provide 4 options (A, B, C, D).' };
  }
  if (!data.correct_option) {
    return { success: false, error: 'Correct option is required.' };
  }

  const supabase = createAdminClient();

  // 1. Update Question table
  const { error: qErr } = await supabase
    .from('questions')
    .update({
      question_text: data.question_text.trim(),
      marks: data.marks || 1,
      session_id: data.session_id || null,
    })
    .eq('id', data.question_id);

  if (qErr) {
    return { success: false, error: qErr.message };
  }

  // 2. Update Options
  for (const opt of data.options) {
    const { error: optErr } = await supabase
      .from('options')
      .update({ option_text: opt.text.trim() })
      .eq('question_id', data.question_id)
      .eq('option_label', opt.label);

    if (optErr) {
      return { success: false, error: optErr.message };
    }
  }

  // 3. UPSERT Answer Key: insert if no row exists, update if it does
  // This fixes the case where CSV import never created an answer_key row
  const { error: keyErr } = await supabase
    .from('answer_keys')
    .upsert(
      [{ question_id: data.question_id, correct_option: data.correct_option }],
      { onConflict: 'question_id' }
    );

  if (keyErr) {
    return { success: false, error: keyErr.message };
  }

  await updateTestTotals(data.test_id);
  revalidatePath(`/admin/tests/${data.test_id}/questions`);
  return { success: true };
}

export async function bulkImportQuestionsAction(
  testId: string,
  sessionId: string | null,
  questionsData: Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: QuestionOptionLabel;
    marks: number;
  }>
) {
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < questionsData.length; i++) {
    const q = questionsData[i];
    if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
      failed++;
      errors.push(`Row ${i + 1}: Missing question text or options.`);
      continue;
    }

    const validLabels: QuestionOptionLabel[] = ['A', 'B', 'C', 'D'];
    const cleanCorrectOption = (q.correct_option ? String(q.correct_option).trim().toUpperCase() : '') as QuestionOptionLabel;

    if (!validLabels.includes(cleanCorrectOption)) {
      failed++;
      errors.push(`Row ${i + 1}: Invalid correct option "${q.correct_option}". Must be A, B, C, or D.`);
      continue;
    }

    const res = await createQuestionAction({
      test_id: testId,
      session_id: sessionId,
      question_text: q.question_text,
      marks: q.marks || 1,
      options: [
        { label: 'A', text: q.option_a },
        { label: 'B', text: q.option_b },
        { label: 'C', text: q.option_c },
        { label: 'D', text: q.option_d },
      ],
      correct_option: cleanCorrectOption,
    });

    if (res.success) {
      successful++;
    } else {
      failed++;
      errors.push(`Row ${i + 1}: ${res.error}`);
    }
  }

  return {
    success: true,
    total: questionsData.length,
    successful,
    failed,
    errors,
  };
}

// Helper: Recalculate test totals
async function updateTestTotals(testId: string) {
  const supabase = createAdminClient();
  const { data: qList } = await supabase
    .from('questions')
    .select('marks')
    .eq('test_id', testId);

  const total_questions = qList ? qList.length : 0;
  const total_marks = qList ? qList.reduce((acc, curr) => acc + (curr.marks || 0), 0) : 0;

  await supabase
    .from('tests')
    .update({ total_questions, total_marks })
    .eq('id', testId);
}
