import { getTestResultsDataAction } from '@/services/results';
import { ResultsClient } from './ResultsClient';
import { TestDashboardTabs } from '../TestDashboardTabs';
import { notFound } from 'next/navigation';

export default async function AdminResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getTestResultsDataAction(id);

  if (!res.success || !res.data) notFound();

  return (
    <div className="space-y-6">
      <TestDashboardTabs testId={id} active="results" />
      <ResultsClient testId={id} initialData={res.data} />
    </div>
  );
}
