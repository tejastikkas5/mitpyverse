'use server';

import { createAdminClient } from '@/lib/supabase/server';

export interface ResultRow {
  rank: number;
  studentId: string;
  studentCode: string;
  studentName: string;
  sessionId?: string | null;
  sessionName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTakenSeconds: number;
  startedAt?: string;
  submittedAt?: string;
  violationsCount: number;
  status: string;
  attemptId: string;
}

export async function getTestResultsDataAction(testId: string, sessionId?: string | null) {
  const supabase = createAdminClient();

  // Get Test Metadata
  const { data: test } = await supabase
    .from('tests')
    .select('*, sessions(*)')
    .eq('id', testId)
    .single();

  if (!test) return { success: false, error: 'Test not found', data: null };

  // Fetch all scores joined with attempt, student, session, violations
  let query = supabase
    .from('scores')
    .select('*, exam_attempts(*, exam_violations(*)), students(*), sessions(*)')
    .eq('test_id', testId);

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data: rawScores, error } = await query;
  if (error) return { success: false, error: error.message, data: null };

  // SORT & RANKING LOGIC (M0 Decision #4: Higher Score -> Lower Time Taken -> Rank)
  const sortedScores = (rawScores || []).slice().sort((a, b) => {
    // 1. Score Descending
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // 2. Time Taken Ascending (Faster is better)
    const timeA = a.exam_attempts?.time_taken_seconds || 999999;
    const timeB = b.exam_attempts?.time_taken_seconds || 999999;
    return timeA - timeB;
  });

  // Assign Ranks (with tie handling for equal score & time)
  let currentRank = 1;
  const rankedResults: ResultRow[] = sortedScores.map((item, index) => {
    if (index > 0) {
      const prev = sortedScores[index - 1];
      const prevTime = prev.exam_attempts?.time_taken_seconds || 999999;
      const currTime = item.exam_attempts?.time_taken_seconds || 999999;
      if (item.score !== prev.score || currTime !== prevTime) {
        currentRank = index + 1;
      }
    }

    return {
      rank: currentRank,
      studentId: item.student_id,
      studentCode: item.students?.student_code || 'N/A',
      studentName: item.students?.name || 'Unknown Student',
      sessionId: item.session_id,
      sessionName: item.sessions?.name || 'Direct Test',
      score: item.score,
      totalMarks: item.total_marks,
      percentage: item.percentage,
      timeTakenSeconds: item.exam_attempts?.time_taken_seconds || 0,
      startedAt: item.exam_attempts?.started_at,
      submittedAt: item.exam_attempts?.submitted_at,
      violationsCount: item.exam_attempts?.exam_violations?.length || 0,
      status: item.exam_attempts?.status || 'submitted',
      attemptId: item.attempt_id,
    };
  });

  // Calculate Derived Analytics
  const totalEvaluated = rankedResults.length;
  const scoresList = rankedResults.map((r) => r.score);
  const percentagesList = rankedResults.map((r) => r.percentage);

  const highestScore = scoresList.length > 0 ? Math.max(...scoresList) : 0;
  const lowestScore = scoresList.length > 0 ? Math.min(...scoresList) : 0;
  const averageScore = scoresList.length > 0 ? parseFloat((scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(2)) : 0;

  const highestPercentage = percentagesList.length > 0 ? Math.max(...percentagesList) : 0;
  const lowestPercentage = percentagesList.length > 0 ? Math.min(...percentagesList) : 0;
  const averagePercentage = percentagesList.length > 0 ? parseFloat((percentagesList.reduce((a, b) => a + b, 0) / percentagesList.length).toFixed(2)) : 0;

  const topper = rankedResults.length > 0 ? rankedResults[0] : null;

  // Get total assigned student count
  const { count: totalAssigned } = await supabase
    .from('test_students')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', testId);

  return {
    success: true,
    data: {
      test,
      sessions: test.sessions || [],
      rankedResults,
      analytics: {
        totalAssigned: totalAssigned || 0,
        totalSubmitted: totalEvaluated,
        notSubmitted: Math.max(0, (totalAssigned || 0) - totalEvaluated),
        highestScore,
        lowestScore,
        averageScore,
        highestPercentage,
        lowestPercentage,
        averagePercentage,
        topper,
      },
    },
  };
}

export async function getSingleResultDetailAction(attemptId: string) {
  const supabase = createAdminClient();

  const { data: score, error } = await supabase
    .from('scores')
    .select('*, exam_attempts(*, exam_violations(*)), students(*), sessions(*), tests(*)')
    .eq('attempt_id', attemptId)
    .single();

  if (error || !score) return { success: false, error: 'Result not found' };

  // Fetch Questions for this test along with options & answer_keys
  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, marks, order_index, options(id, option_label, option_text), answer_keys(correct_option)')
    .eq('test_id', score.test_id)
    .order('order_index', { ascending: true });

  // Fetch Student Answers for this attempt
  const { data: studentAnswers } = await supabase
    .from('student_answers')
    .select('*')
    .eq('attempt_id', attemptId);

  const answerMap = new Map();
  studentAnswers?.forEach((sa) => {
    answerMap.set(sa.question_id, sa.selected_option);
  });

  const questionPaper = (questions || []).map((q: any) => {
    const rawKey = Array.isArray(q.answer_keys) ? q.answer_keys[0]?.correct_option : q.answer_keys?.correct_option;
    const correctOption = rawKey ? String(rawKey).trim().toUpperCase() : null;
    const selectedOption = answerMap.get(q.id) ? String(answerMap.get(q.id)).trim().toUpperCase() : null;

    return {
      id: q.id,
      questionText: q.question_text,
      marks: q.marks || 1,
      orderIndex: q.order_index,
      options: q.options || [],
      correctOption,
      selectedOption,
      isCorrect: correctOption && selectedOption && correctOption === selectedOption,
    };
  });

  return { success: true, detail: score, questionPaper };
}
