import { getStudentSession } from '@/lib/auth/session';
import { getStudentAssignedTestsAction } from '@/services/attempts';
import { StudentDashboardClient } from './StudentDashboardClient';

export default async function StudentDashboardPage() {
  const session = await getStudentSession();
  const { tests } = await getStudentAssignedTestsAction();

  return (
    <StudentDashboardClient
      studentName={session?.student_name || 'Student'}
      studentCode={session?.student_code || ''}
      assignedTests={tests || []}
    />
  );
}
