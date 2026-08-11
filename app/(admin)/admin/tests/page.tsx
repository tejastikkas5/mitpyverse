export const dynamic = 'force-dynamic';

import { getTestsAction } from '@/services/tests';
import { TestListClient } from './TestListClient';

export default async function AdminTestsPage() {
  const { tests } = await getTestsAction();
  return <TestListClient initialTests={tests || []} />;
}
