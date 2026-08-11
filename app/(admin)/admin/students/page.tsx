export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { StudentManagementClient } from './StudentManagementClient';

export default async function AdminStudentsPage() {
  const supabase = createAdminClient();

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  return <StudentManagementClient initialStudents={students || []} />;
}
