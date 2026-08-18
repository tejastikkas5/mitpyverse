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

// Award bonus marks to ALL students for a test (e.g. for faulty/unanswerable questions)
export async function awardBonusMarksAction(testId: string, bonusMarks: number, reason: string) {
  if (!bonusMarks || bonusMarks <= 0) {
    return { success: false, error: 'Bonus marks must be greater than 0.' };
  }
  if (!reason || !reason.trim()) {
    return { success: false, error: 'A reason is required for awarding bonus marks.' };
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  // Fetch all current scores for this test
  const { data: scores, error: scoresErr } = await supabase
    .from('scores')
    .select('*')
    .eq('test_id', testId);

  if (scoresErr || !scores || scores.length === 0) {
    return { success: false, error: scoresErr?.message || 'No scores found for this test.' };
  }

  let successCount = 0;
  let failCount = 0;

  for (const s of scores) {
    // 1. Snapshot current score before applying bonus
    await supabase.from('score_snapshots').insert([{
      attempt_id: s.attempt_id,
      test_id: testId,
      student_id: s.student_id,
      session_id: s.session_id || null,
      score: s.score,
      total_marks: s.total_marks,
      percentage: s.percentage,
      bonus_marks: s.bonus_marks || 0,
      snapshot_type: 'bonus_applied',
      triggered_by: 'admin',
      note: reason.trim(),
      evaluated_at: s.evaluated_at || nowIso,
    }]);

    // 2. Calculate new score: raw score + new bonus (cumulative with any prior bonus)
    const newBonusTotal = (s.bonus_marks || 0) + bonusMarks;
    const newScore = s.score + bonusMarks;
    const newPercentage = s.total_marks > 0
      ? parseFloat(((newScore / s.total_marks) * 100).toFixed(2))
      : 0;
    const currentVersion = s.snapshot_version || 1;

    // 3. Update live scores table
    const { error: updateErr } = await supabase
      .from('scores')
      .update({
        score: newScore,
        percentage: newPercentage,
        bonus_marks: newBonusTotal,
        snapshot_version: currentVersion + 1,
        evaluated_at: nowIso,
      })
      .eq('id', s.id);

    if (updateErr) {
      failCount++;
    } else {
      successCount++;
    }
  }

  // 4. Log the bonus event in test_adjustments
  await supabase.from('test_adjustments').insert([{
    test_id: testId,
    adjustment_type: 'bonus_marks',
    bonus_marks: bonusMarks,
    reason: reason.trim(),
    applied_by: 'admin',
    applied_at: nowIso,
  }]);

  return {
    success: true,
    totalStudents: scores.length,
    successCount,
    failCount,
  };
}

// Google Form-style: fetch all student answers for every question (for answer sheet export)
export interface AnswerSheetRow {
  studentId: string;
  studentCode: string;
  studentName: string;
  sessionName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  bonusMarks: number;
  answers: {
    questionId: string;
    questionText: string;
    orderIndex: number;
    marks: number;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string | null;
    selectedOption: string | null;
    isCorrect: boolean;
  }[];
}

export async function getFullAnswerSheetAction(testId: string, sessionId?: string | null) {
  const supabase = createAdminClient();

  // 1. Fetch all questions with options and answer keys
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, question_text, marks, order_index, options(option_label, option_text), answer_keys(correct_option)')
    .eq('test_id', testId)
    .order('order_index', { ascending: true });

  if (qErr || !questions) return { success: false, error: qErr?.message || 'Failed to load questions.' };

  // Build question lookup map
  const questionMap = new Map<string, any>();
  questions.forEach((q: any) => questionMap.set(q.id, q));

  // 2. Fetch all submitted attempts with scores
  let scoresQuery = supabase
    .from('scores')
    .select('*, students(*), sessions(*), exam_attempts(*)')
    .eq('test_id', testId);

  if (sessionId) scoresQuery = scoresQuery.eq('session_id', sessionId);

  const { data: scores, error: sErr } = await scoresQuery;
  if (sErr || !scores) return { success: false, error: sErr?.message || 'Failed to load scores.' };

  // 3. Fetch all student answers for all attempts in this test at once
  const attemptIds = scores.map((s: any) => s.attempt_id);
  const { data: allAnswers, error: aErr } = await supabase
    .from('student_answers')
    .select('attempt_id, question_id, selected_option')
    .in('attempt_id', attemptIds);

  if (aErr) return { success: false, error: aErr.message };

  // Build answers lookup: attemptId -> { questionId -> selectedOption }
  const answersMap = new Map<string, Map<string, string>>();
  allAnswers?.forEach((ans: any) => {
    if (!answersMap.has(ans.attempt_id)) answersMap.set(ans.attempt_id, new Map());
    answersMap.get(ans.attempt_id)!.set(ans.question_id, ans.selected_option);
  });

  // 4. Assemble answer sheet rows
  const rows: AnswerSheetRow[] = scores.map((s: any) => {
    const studentAnswerMap = answersMap.get(s.attempt_id) || new Map();

    const answers = questions.map((q: any) => {
      const opts = (q.options || []) as any[];
      const getOpt = (label: string) => opts.find((o: any) => o.option_label === label)?.option_text || '';
      const rawKey = Array.isArray(q.answer_keys) ? q.answer_keys[0]?.correct_option : q.answer_keys?.correct_option;
      const correctOption = rawKey ? String(rawKey).trim().toUpperCase() : null;
      const selectedOption = studentAnswerMap.get(q.id) ? String(studentAnswerMap.get(q.id)).trim().toUpperCase() : null;

      return {
        questionId: q.id,
        questionText: q.question_text,
        orderIndex: q.order_index,
        marks: q.marks || 1,
        optionA: getOpt('A'),
        optionB: getOpt('B'),
        optionC: getOpt('C'),
        optionD: getOpt('D'),
        correctOption,
        selectedOption,
        isCorrect: !!(correctOption && selectedOption && correctOption === selectedOption),
      };
    });

    return {
      studentId: s.student_id,
      studentCode: s.students?.student_code || 'N/A',
      studentName: s.students?.name || 'Unknown',
      sessionName: s.sessions?.name || 'Direct Test',
      score: s.score,
      totalMarks: s.total_marks,
      percentage: s.percentage,
      bonusMarks: s.bonus_marks || 0,
      answers,
    };
  });

  // Sort by studentCode for consistent ordering
  rows.sort((a, b) => a.studentCode.localeCompare(b.studentCode));

  return { success: true, rows, questions };
}

