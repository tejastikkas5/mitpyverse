import { getTestByIdAction } from '@/services/tests';
import { getSessionsByTestIdAction } from '@/services/sessions';
import { SessionsClient } from './SessionsClient';
import { TestDashboardTabs } from '../TestDashboardTabs';
import { notFound } from 'next/navigation';

export default async function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { test } = await getTestByIdAction(id);

  if (!test) notFound();

  const { sessions } = await getSessionsByTestIdAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">{test.title}</h1>
      </div>
      <TestDashboardTabs testId={id} active="sessions" />
      <SessionsClient testId={id} initialSessions={sessions || []} />
    </div>
  );
}
