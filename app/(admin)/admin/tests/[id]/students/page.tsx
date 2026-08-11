import { getTestByIdAction } from '@/services/tests';
import { getSessionsByTestIdAction } from '@/services/sessions';
import { createAdminClient } from '@/lib/supabase/server';
import { TestStudentsClient } from './TestStudentsClient';
import { TestDashboardTabs } from '../TestDashboardTabs';
import { notFound } from 'next/navigation';

export default async function TestStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { test } = await getTestByIdAction(id);

  if (!test) notFound();

  const supabase = createAdminClient();

  // Get assigned test students
  const { data: assignments } = await supabase
    .from('test_students')
    .select('*, students(*), sessions(*)')
    .eq('test_id', id);

  // Get all active students in system
  const { data: allStudents } = await supabase
    .from('students')
    .select('*')
    .eq('is_active', true)
    .order('student_code', { ascending: true });

  const { sessions } = await getSessionsByTestIdAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">{test.title}</h1>
      </div>
      <TestDashboardTabs testId={id} active="students" />
      <TestStudentsClient
        testId={id}
        assignments={assignments || []}
        allStudents={allStudents || []}
        sessions={sessions || []}
      />
    </div>
  );
}
