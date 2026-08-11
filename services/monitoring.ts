'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getStudentSession } from '@/lib/auth/session';
import { evaluateAndSubmitAttemptAction } from '@/services/attempts';
import { ViolationType } from '@/types/database';
import { revalidatePath } from 'next/cache';

// 1. Report Anti-Cheating Violation from Student Browser
export async function reportViolationAction(
  attemptId: string,
  violationType: ViolationType
) {
  const session = await getStudentSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createAdminClient();

  // Validate attempt belongs to student and is in_progress
  const { data: attempt, error: attErr } = await supabase
    .from('exam_attempts')
    .select('*, tests(*, test_settings(*))')
    .eq('id', attemptId)
    .eq('student_id', session.student_id)
    .single();

  if (attErr || !attempt || attempt.status !== 'in_progress') {
    return { success: false, error: 'Attempt not active or invalid' };
  }

  // Insert Violation record
  const { error: insErr } = await supabase.from('exam_violations').insert([
    {
      attempt_id: attemptId,
      student_id: session.student_id,
      test_id: attempt.test_id,
      violation_type: violationType,
      occurred_at: new Date().toISOString(),
    },
  ]);

  if (insErr) {
    return { success: false, error: insErr.message };
  }

  // Calculate total violation count from DB
  const { count, error: countErr } = await supabase
    .from('exam_violations')
    .select('*', { count: 'exact', head: true })
    .eq('attempt_id', attemptId);

  const violationCount = count || 0;
  const maxViolations = attempt.tests?.test_settings?.[0]?.max_violations ?? 3;
  const autoSubmitOnViolation = attempt.tests?.test_settings?.[0]?.auto_submit_on_violation ?? true;

  let isTerminated = false;

  // Enforce Auto-Submit if violation count >= maxViolations
  if (autoSubmitOnViolation && violationCount >= maxViolations) {
    isTerminated = true;
    await evaluateAndSubmitAttemptAction(attemptId, 'auto_submitted');
  }

  return {
    success: true,
    violationCount,
    maxViolations,
    isTerminated,
  };
}

// 2. Admin Live Monitoring Queries & Actions
export async function getLiveMonitoringDataAction(testId: string, sessionId?: string | null) {
  const supabase = createAdminClient();

  // Get Test & Sessions
  const { data: test } = await supabase
    .from('tests')
    .select('*, sessions(*)')
    .eq('id', testId)
    .single();

  if (!test) return { success: false, error: 'Test not found', data: null };

  // Get Test Student Assignments
  let assignQuery = supabase
    .from('test_students')
    .select('*, students(*), sessions(*)')
    .eq('test_id', testId);

  if (sessionId) {
    assignQuery = assignQuery.eq('session_id', sessionId);
  }

  const { data: assignments } = await assignQuery;

  // Get Exam Attempts for this test
  let attemptQuery = supabase
    .from('exam_attempts')
    .select('*, exam_violations(*), scores(*)')
    .eq('test_id', testId);

  if (sessionId) {
    attemptQuery = attemptQuery.eq('session_id', sessionId);
  }

  const { data: attempts } = await attemptQuery;

  const attemptMap = new Map();
  attempts?.forEach((att) => attemptMap.set(att.student_id, att));

  // Merge student status and attempt monitoring data
  const monitoredStudents = assignments?.map((a) => {
    const att = attemptMap.get(a.student_id);
    return {
      assignmentId: a.id,
      studentId: a.student_id,
      studentCode: a.students?.student_code,
      studentName: a.students?.name,
      sessionName: a.sessions?.name || 'Direct Test',
      sessionId: a.session_id,
      status: att?.status || 'not_started',
      startedAt: att?.started_at,
      submittedAt: att?.submitted_at,
      violationsCount: att?.exam_violations?.length || 0,
      violations: att?.exam_violations || [],
      attemptId: att?.id,
    };
  }) || [];

  return {
    success: true,
    data: {
      test,
      sessions: test.sessions || [],
      monitoredStudents,
    },
  };
}

// 3. Admin Control: Start Session
export async function adminStartSessionAction(testId: string, sessionId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('test_id', testId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/tests/${testId}/monitor`);
  return { success: true };
}

// 4. Admin Control: Pause Session
export async function adminPauseSessionAction(testId: string, sessionId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'paused' })
    .eq('id', sessionId)
    .eq('test_id', testId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/tests/${testId}/monitor`);
  return { success: true };
}

// 5. Admin Control: Extend Student / Test Duration by X Minutes
export async function adminExtendTimeAction(testId: string, extraMinutes: number) {
  const supabase = createAdminClient();

  const { data: test } = await supabase.from('tests').select('duration_minutes').eq('id', testId).single();
  if (!test) return { success: false, error: 'Test not found' };

  const newDuration = test.duration_minutes + extraMinutes;
  const { error } = await supabase
    .from('tests')
    .update({ duration_minutes: newDuration })
    .eq('id', testId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/tests/${testId}/monitor`);
  return { success: true };
}

// 6. Admin Control: Force Submit Student Attempt
export async function adminForceSubmitAttemptAction(attemptId: string, testId: string) {
  const res = await evaluateAndSubmitAttemptAction(attemptId, 'force_submitted');
  if (res.success) {
    revalidatePath(`/admin/tests/${testId}/monitor`);
  }
  return res;
}

// 7. Admin Control: Clear Violations & Re-open Attempt (Give Second Chance)
export async function resetViolationsAndReopenAttemptAction(attemptId: string, testId: string) {
  const supabase = createAdminClient();

  // 1. Delete all violations for this attempt
  await supabase.from('exam_violations').delete().eq('attempt_id', attemptId);

  // 2. Delete any existing score record for this attempt
  await supabase.from('scores').delete().eq('attempt_id', attemptId);

  // 3. Re-open attempt status back to 'in_progress'
  const { error } = await supabase
    .from('exam_attempts')
    .update({ status: 'in_progress' })
    .eq('id', attemptId);

  if (error) return { success: false, error: error.message };

  // 4. Update test_students assignment status
  const { data: att } = await supabase
    .from('exam_attempts')
    .select('student_id')
    .eq('id', attemptId)
    .single();

  if (att) {
    await supabase
      .from('test_students')
      .update({ status: 'in_progress' })
      .eq('test_id', testId)
      .eq('student_id', att.student_id);
  }

  revalidatePath(`/admin/tests/${testId}/monitor`);
  revalidatePath(`/admin/tests/${testId}/results`);
  return { success: true };
}
