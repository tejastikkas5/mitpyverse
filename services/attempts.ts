'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getStudentSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { QuestionOptionLabel } from '@/types/database';

// 1. Get tests assigned to the authenticated student
export async function getStudentAssignedTestsAction() {
  const session = await getStudentSession();
  if (!session) {
    return { success: false, error: 'Unauthorized', tests: [] };
  }

  const supabase = createAdminClient();

  // Get assignments for this student
  const { data: assignments, error } = await supabase
    .from('test_students')
    .select('*, tests(*, test_settings(*)), sessions(*)')
    .eq('student_id', session.student_id);

  if (error) {
    return { success: false, error: error.message, tests: [] };
  }

  // Get existing attempts for this student to know attempt status
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('student_id', session.student_id);

  const attemptMap = new Map();
  attempts?.forEach((att) => attemptMap.set(att.test_id, att));

  const formatted = assignments.map((a) => {
    const attempt = attemptMap.get(a.test_id);
    return {
      assignmentId: a.id,
      test: a.tests,
      session: a.sessions,
      attempt,
      assignmentStatus: a.status,
    };
  });

  return { success: true, tests: formatted };
}

// 2. Start or Resume Exam Attempt
export async function startOrResumeExamAttemptAction(testId: string) {
  const session = await getStudentSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createAdminClient();

  // Verify student is assigned to this test
  const { data: assignment, error: assignErr } = await supabase
    .from('test_students')
    .select('*, tests(*, test_settings(*)), sessions(*)')
    .eq('test_id', testId)
    .eq('student_id', session.student_id)
    .single();

  if (assignErr || !assignment) {
    return { success: false, error: 'You are not assigned to this test.' };
  }

  const test = assignment.tests;
  const assignedSession = assignment.sessions;

  // Check test status: MUST be 'running' for students to start
  if (test.status !== 'running') {
    return {
      success: false,
      error: 'This test is currently not live. Please wait for the administrator to start the test.',
    };
  }

  // Check if attempt already exists
  const { data: existingAttempt } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('test_id', testId)
    .eq('student_id', session.student_id)
    .single();

  if (existingAttempt) {
    // If submitted, cannot restart
    if (existingAttempt.status === 'submitted' || existingAttempt.status === 'auto_submitted' || existingAttempt.status === 'force_submitted') {
      return { success: false, error: 'You have already submitted this exam.' };
    }

    // Check timer expiration
    const startedAt = new Date(existingAttempt.started_at).getTime();
    const durationMs = test.duration_minutes * 60 * 1000;
    const now = Date.now();

    if (now >= startedAt + durationMs) {
      // Auto-submit expired attempt
      await evaluateAndSubmitAttemptAction(existingAttempt.id, 'auto_submitted');
      return { success: false, error: 'Your exam time has expired.' };
    }

    return { success: true, attemptId: existingAttempt.id };
  }

  // Create new attempt with server-authoritative timestamp
  const nowIso = new Date().toISOString();
  const { data: newAttempt, error: createErr } = await supabase
    .from('exam_attempts')
    .insert([
      {
        test_id: testId,
        student_id: session.student_id,
        session_id: assignment.session_id || null,
        status: 'in_progress',
        started_at: nowIso,
      },
    ])
    .select()
    .single();

  if (createErr || !newAttempt) {
    return { success: false, error: createErr?.message || 'Failed to start exam attempt' };
  }

  // Update test_students assignment status
  await supabase
    .from('test_students')
    .update({ status: 'in_progress' })
    .eq('id', assignment.id);

  return { success: true, attemptId: newAttempt.id };
}

// 3. Get Exam Attempt State with Hydrated Questions (Hybrid Scope)
export async function getExamStateAction(attemptId: string) {
  const session = await getStudentSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createAdminClient();

  // Get attempt
  const { data: attempt, error: attErr } = await supabase
    .from('exam_attempts')
    .select('*, tests(*, test_settings(*))')
    .eq('id', attemptId)
    .eq('student_id', session.student_id)
    .single();

  if (attErr || !attempt) {
    return { success: false, error: 'Attempt not found or access denied.' };
  }

  const test = attempt.tests;
  const settings = (Array.isArray(test.test_settings) ? test.test_settings[0] : test.test_settings) || {};
  const startedAt = new Date(attempt.started_at).getTime();
  const durationMs = test.duration_minutes * 60 * 1000;
  const now = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((startedAt + durationMs - now) / 1000));

  // Check if expired on server
  if (remainingSeconds <= 0 && attempt.status === 'in_progress') {
    await evaluateAndSubmitAttemptAction(attempt.id, 'auto_submitted');
    return {
      success: true,
      isExpired: true,
      attempt: { ...attempt, status: 'auto_submitted' },
      remainingSeconds: 0,
      questions: [],
      savedAnswers: {},
    };
  }

  // Fetch Questions for this attempt based on Hybrid Scope:
  // Questions where test_id = test.id AND (session_id IS NULL OR session_id = attempt.session_id)
  let query = supabase
    .from('questions')
    .select('id, question_text, marks, order_index, session_id, options(id, option_label, option_text)')
    .eq('test_id', test.id)
    .order('order_index', { ascending: true });

  if (attempt.session_id) {
    query = query.or(`session_id.is.null,session_id.eq.${attempt.session_id}`);
  } else {
    query = query.is('session_id', null);
  }

  const { data: rawQuestions, error: qErr } = await query;

  if (qErr) {
    return { success: false, error: qErr.message };
  }

  // Fetch Saved Student Answers
  const { data: savedAnswersList } = await supabase
    .from('student_answers')
    .select('*')
    .eq('attempt_id', attemptId);

  const savedAnswers: Record<string, { selected_option?: QuestionOptionLabel; is_marked_for_review: boolean }> = {};
  savedAnswersList?.forEach((ans) => {
    savedAnswers[ans.question_id] = {
      selected_option: ans.selected_option,
      is_marked_for_review: ans.is_marked_for_review,
    };
  });

  let questions = rawQuestions || [];

  // If shuffle_questions is enabled, shuffle deterministically using student attemptId seed
  if (settings.shuffle_questions && questions.length > 1) {
    questions = [...questions];
    // Simple PRNG based on string hash of attemptId
    let hash = 0;
    for (let i = 0; i < attemptId.length; i++) {
      hash = (hash << 5) - hash + attemptId.charCodeAt(i);
      hash |= 0;
    }
    const seedRandom = () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };

    // Fisher-Yates shuffle algorithm
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(seedRandom() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }

  return {
    success: true,
    isExpired: false,
    attempt,
    test,
    settings,
    remainingSeconds,
    serverTime: new Date().toISOString(),
    questions,
    savedAnswers,
  };
}

// 4. Save Student Answer (Auto-save / Immediate save)
export async function saveAnswerAction(
  attemptId: string,
  questionId: string,
  selectedOption: QuestionOptionLabel | null,
  isMarkedForReview: boolean
) {
  const session = await getStudentSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createAdminClient();

  // Validate attempt is still active and within timer bounds
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('*, tests(duration_minutes)')
    .eq('id', attemptId)
    .eq('student_id', session.student_id)
    .single();

  if (!attempt || attempt.status !== 'in_progress') {
    return { success: false, error: 'Attempt is no longer active.' };
  }

  const startedAt = new Date(attempt.started_at).getTime();
  const durationMs = attempt.tests.duration_minutes * 60 * 1000;
  if (Date.now() >= startedAt + durationMs) {
    await evaluateAndSubmitAttemptAction(attemptId, 'auto_submitted');
    return { success: false, error: 'Exam time expired.' };
  }

  // Upsert Student Answer
  const { error } = await supabase
    .from('student_answers')
    .upsert(
      [
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_option: selectedOption,
          is_marked_for_review: isMarkedForReview,
          answered_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'attempt_id,question_id' }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 5. Server-Side Evaluation & Submission (Mandatory Server-Side Scoring)
export async function evaluateAndSubmitAttemptAction(
  attemptId: string,
  submissionType: 'submitted' | 'auto_submitted' | 'force_submitted' = 'submitted'
) {
  const supabase = createAdminClient();

  // Get attempt details
  const { data: attempt, error: attErr } = await supabase
    .from('exam_attempts')
    .select('*, tests(*)')
    .eq('id', attemptId)
    .single();

  if (attErr || !attempt) {
    return { success: false, error: 'Attempt not found' };
  }

  // Prevent duplicate submissions
  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted' || attempt.status === 'force_submitted') {
    // Return existing score
    const { data: existingScore } = await supabase
      .from('scores')
      .select('*')
      .eq('attempt_id', attemptId)
      .single();

    return { success: true, score: existingScore };
  }

  const nowIso = new Date().toISOString();
  const startedAt = new Date(attempt.started_at).getTime();
  const submittedAt = new Date(nowIso).getTime();
  const timeTakenSeconds = Math.max(0, Math.floor((submittedAt - startedAt) / 1000));

  // Update Attempt status to submitted
  await supabase
    .from('exam_attempts')
    .update({
      status: submissionType,
      submitted_at: nowIso,
      time_taken_seconds: timeTakenSeconds,
    })
    .eq('id', attemptId);

  // Update test_students assignment status to submitted
  await supabase
    .from('test_students')
    .update({ status: 'submitted' })
    .eq('test_id', attempt.test_id)
    .eq('student_id', attempt.student_id);

  // EVALUATE SCORE SERVER-SIDE against answer_keys table
  // 1. Get all questions & answer keys for this test
  const { data: questions } = await supabase
    .from('questions')
    .select('id, marks, answer_keys(correct_option)')
    .eq('test_id', attempt.test_id);

  // 2. Get student answers for this attempt
  const { data: studentAnswers } = await supabase
    .from('student_answers')
    .select('question_id, selected_option')
    .eq('attempt_id', attemptId);

  const answerMap = new Map();
  studentAnswers?.forEach((sa) => answerMap.set(sa.question_id, sa.selected_option));

  let totalScore = 0;
  let totalPossibleMarks = 0;

  questions?.forEach((q: any) => {
    const marks = typeof q.marks === 'number' ? q.marks : 1;
    totalPossibleMarks += marks;
    // Supabase 1:1 relation returns answer_keys as an object, not an array
    const rawKey = Array.isArray(q.answer_keys) ? q.answer_keys[0]?.correct_option : q.answer_keys?.correct_option;
    const correctOption = rawKey ? String(rawKey).trim().toUpperCase() : null;
    const studentSelected = answerMap.get(q.id) ? String(answerMap.get(q.id)).trim().toUpperCase() : null;

    if (correctOption && studentSelected && correctOption === studentSelected) {
      totalScore += marks;
    }
  });

  const percentage = totalPossibleMarks > 0 ? parseFloat(((totalScore / totalPossibleMarks) * 100).toFixed(2)) : 0;

  // Insert Score Record (Server-side Only)
  const { data: scoreRecord, error: scoreErr } = await supabase
    .from('scores')
    .upsert(
      [
        {
          attempt_id: attemptId,
          test_id: attempt.test_id,
          student_id: attempt.student_id,
          session_id: attempt.session_id || null,
          score: totalScore,
          total_marks: totalPossibleMarks,
          percentage,
          evaluated_at: nowIso,
        },
      ],
      { onConflict: 'attempt_id' }
    )
    .select()
    .single();

  revalidatePath('/student/dashboard');
  return {
    success: true,
    score: scoreRecord,
  };
}
