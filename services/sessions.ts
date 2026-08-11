'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSessionsByTestIdAction(testId: string) {
  const supabase = createAdminClient();

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*, test_students(*), questions(*)')
    .eq('test_id', testId)
    .order('created_at', { ascending: true });

  if (error) {
    return { success: false, error: error.message, sessions: [] };
  }

  return { success: true, sessions: sessions || [] };
}

export async function createSessionAction(testId: string, name: string) {
  if (!name || !name.trim()) {
    return { success: false, error: 'Session name is required.' };
  }

  const supabase = createAdminClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .insert([
      {
        test_id: testId,
        name: name.trim(),
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/tests/${testId}/sessions`);
  return { success: true, session };
}

export async function assignStudentToTestOrSessionAction(
  testId: string,
  studentId: string,
  sessionId?: string | null
) {
  const supabase = createAdminClient();

  // Validate session belongs to test if provided
  if (sessionId) {
    const { data: sess } = await supabase
      .from('sessions')
      .select('test_id')
      .eq('id', sessionId)
      .single();

    if (!sess || sess.test_id !== testId) {
      return { success: false, error: 'Session does not belong to this test.' };
    }
  }

  // Check existing assignment for this student & test
  const { data: existing } = await supabase
    .from('test_students')
    .select('*')
    .eq('test_id', testId)
    .eq('student_id', studentId)
    .single();

  if (existing) {
    // If student is already assigned to a session in this test, prevent multi-session assignment
    if (existing.session_id && sessionId && existing.session_id !== sessionId) {
      return {
        success: false,
        error: 'Student is already assigned to another session in this test.',
      };
    }

    // Update assignment with new session
    const { error: upErr } = await supabase
      .from('test_students')
      .update({ session_id: sessionId || existing.session_id })
      .eq('id', existing.id);

    if (upErr) return { success: false, error: upErr.message };
  } else {
    // Create new assignment
    const { error: insErr } = await supabase.from('test_students').insert([
      {
        test_id: testId,
        student_id: studentId,
        session_id: sessionId || null,
        status: 'assigned',
      },
    ]);

    if (insErr) return { success: false, error: insErr.message };
  }

  revalidatePath(`/admin/tests/${testId}/students`);
  revalidatePath(`/admin/tests/${testId}/sessions`);
  return { success: true };
}

export async function bulkAssignStudentsToTestAction(testId: string, studentIds: string[]) {
  if (!studentIds || studentIds.length === 0) return { success: true, count: 0 };
  const supabase = createAdminClient();

  const inserts = studentIds.map((student_id) => ({
    test_id: testId,
    student_id,
    status: 'assigned',
  }));

  const { error } = await supabase.from('test_students').insert(inserts);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/tests/${testId}/students`);
  revalidatePath(`/admin/tests/${testId}/sessions`);
  return { success: true, count: studentIds.length };
}

export async function removeStudentAssignmentAction(assignmentId: string, testId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from('test_students').delete().eq('id', assignmentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/tests/${testId}/students`);
  revalidatePath(`/admin/tests/${testId}/sessions`);
  return { success: true };
}
