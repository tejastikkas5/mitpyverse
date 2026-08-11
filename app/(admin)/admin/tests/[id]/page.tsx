import { getTestByIdAction, archiveTestAction } from '@/services/tests';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TestDashboardTabs } from './TestDashboardTabs';
import { notFound } from 'next/navigation';

export default async function TestOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { test } = await getTestByIdAction(id);

  if (!test) {
    notFound();
  }

  async function handleArchive() {
    'use server';
    await archiveTestAction(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">{test.title}</h1>
            <Badge variant={test.status === 'running' ? 'success' : test.status === 'archived' ? 'danger' : 'neutral'}>
              {test.status}
            </Badge>
          </div>
          {test.description && <p className="text-sm text-slate-400 mt-1">{test.description}</p>}
        </div>

        {test.status !== 'archived' && (
          <form action={handleArchive}>
            <Button size="sm" variant="danger" type="submit">
              Archive Test
            </Button>
          </form>
        )}
      </div>

      <TestDashboardTabs testId={id} active="overview" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Duration</div>
          <div className="text-3xl font-extrabold text-slate-100 mt-2">{test.duration_minutes} min</div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Questions</div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2">{test.questions?.length || 0}</div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold">Assigned Students</div>
          <div className="text-3xl font-extrabold text-slate-100 mt-2">{test.test_students?.length || 0}</div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold">Sessions</div>
          <div className="text-3xl font-extrabold text-slate-100 mt-2">{test.sessions?.length || 0}</div>
        </Card>
      </div>

      <Card title="Quick Configuration Status">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-300">Fullscreen Required</span>
            <Badge variant={test.test_settings?.[0]?.fullscreen_required ? 'success' : 'neutral'}>
              {test.test_settings?.[0]?.fullscreen_required ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-300">Max Violation Limit</span>
            <span className="font-mono text-slate-100 font-bold">{test.test_settings?.[0]?.max_violations || 3} violations</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-300">Result Display Mode</span>
            <span className="text-xs text-amber-400 font-mono">Submission Message Only (Score hidden from student)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
