'use server';

import { createAdminClient } from '@/lib/supabase/server';

// Fetch all adjustment history (bonus marks & re-evaluations) for a test
export async function getTestAdjustmentsAction(testId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('test_adjustments')
    .select('*')
    .eq('test_id', testId)
    .order('applied_at', { ascending: false });

  if (error) return { success: false, error: error.message, adjustments: [] };

  return { success: true, adjustments: data || [] };
}
