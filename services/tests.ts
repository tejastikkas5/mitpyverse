'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { TestStatus } from '@/types/database';

export async function getTestsAction() {
  const supabase = createAdminClient();

  const { data: tests, error } = await supabase
    .from('tests')
    .select('*, test_settings(*), sessions(*), test_students(*)')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message, tests: [] };
  }

  return { success: true, tests: tests || [] };
}

export async function getTestByIdAction(testId: string) {
  noStore(); // Prevent Next.js from caching - always read fresh from Supabase
  const supabase = createAdminClient();

  const { data: test, error } = await supabase
    .from('tests')
    .select('*, test_settings(*), sessions(*), test_students(*), questions(*)')
    .eq('id', testId)
    .single();

  if (error || !test) {
    return { success: false, error: error?.message || 'Test not found', test: null };
  }

  return { success: true, test };
}

export async function createTestAction(formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const duration_minutes = parseInt(formData.get('duration_minutes') as string || '60', 10);
  const total_marks = parseInt(formData.get('total_marks') as string || '0', 10);

  if (!title) {
    return { success: false, error: 'Test title is required.' };
  }

  const supabase = createAdminClient();

  // 1. Insert Test
  const { data: test, error: testErr } = await supabase
    .from('tests')
    .insert([
      {
        title,
        description,
        duration_minutes,
        total_marks,
        status: 'draft',
      },
    ])
    .select()
    .single();

  if (testErr || !test) {
    return { success: false, error: testErr?.message || 'Failed to create test' };
  }

  // 2. Create Default Test Settings
  const { error: settingsErr } = await supabase.from('test_settings').insert([
    {
      test_id: test.id,
      fullscreen_required: true,
      allow_back_navigation: false,
      shuffle_questions: false,
      shuffle_options: false,
      max_violations: 3,
      auto_submit_on_violation: true,
      show_result_after_submission: false,
      allow_retake: false,
      auto_save_answers: true,
    },
  ]);

  if (settingsErr) {
    console.error('Settings creation warning:', settingsErr.message);
  }

  revalidatePath('/admin/tests');
  return { success: true, test };
}

export async function updateTestAction(testId: string, formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const duration_minutes = parseInt(formData.get('duration_minutes') as string || '60', 10);
  const total_marks = parseInt(formData.get('total_marks') as string || '0', 10);
  const status = (formData.get('status') as string) as TestStatus;

  if (!title) {
    return { success: false, error: 'Test title is required.' };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('tests')
    .update({
      title,
      description,
      duration_minutes,
      total_marks,
      status: status || 'draft',
    })
    .eq('id', testId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tests');
  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}

export async function archiveTestAction(testId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('tests')
    .update({ status: 'archived' })
    .eq('id', testId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tests');
  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}

export async function deleteTestAction(testId: string) {
  const supabase = createAdminClient();

  // Delete test (ON DELETE CASCADE handles settings, student_tests, attempts, questions)
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', testId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tests');
  return { success: true };
}

export async function updateTestSettingsAction(testId: string, settingsData: {
  fullscreen_required: boolean;
  allow_back_navigation: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  max_violations: number;
  auto_submit_on_violation: boolean;
  show_result_after_submission: boolean;
  allow_retake: boolean;
  auto_save_answers: boolean;
}) {
  const supabase = createAdminClient();

  // Use upsert so it inserts if missing, or updates if already exists
  const { error } = await supabase
    .from('test_settings')
    .upsert(
      { test_id: testId, ...settingsData },
      { onConflict: 'test_id' }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/tests/${testId}/settings`);
  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}
