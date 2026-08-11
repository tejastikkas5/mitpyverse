import { getLiveMonitoringDataAction } from '@/services/monitoring';
import { MonitorClient } from './MonitorClient';
import { TestDashboardTabs } from '../TestDashboardTabs';
import { notFound } from 'next/navigation';

export default async function AdminMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getLiveMonitoringDataAction(id);

  if (!res.success || !res.data) notFound();

  return (
    <div className="space-y-6">
      <TestDashboardTabs testId={id} active="monitor" />
      <MonitorClient testId={id} initialData={res.data} />
    </div>
  );
}
