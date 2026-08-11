import { getTestByIdAction } from '@/services/tests';
import { TestSettingsClient } from './TestSettingsClient';
import { TestDashboardTabs } from '../TestDashboardTabs';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TestSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { test } = await getTestByIdAction(id);

  if (!test) notFound();

  // test_settings may be returned as a single object or array depending on Supabase join type
  const settings = Array.isArray(test.test_settings)
    ? test.test_settings[0]
    : test.test_settings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">{test.title}</h1>
      </div>
      <TestDashboardTabs testId={id} active="settings" />
      <TestSettingsClient testId={id} initialSettings={settings} />
    </div>
  );
}
