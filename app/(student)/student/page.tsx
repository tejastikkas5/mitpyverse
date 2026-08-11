import { Card } from '@/components/ui/Card';

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Student Examination Portal</h1>
        <p className="text-sm text-slate-400 mt-1">
          Welcome to MIT PyVerse Examination Platform. Assigned assessments will appear here.
        </p>
      </div>

      <Card title="No Active Tests Assigned" subtitle="Check back closer to your exam session">
        <p className="text-sm text-slate-400">
          When an administrator assigns you to a test or session, your exam card will show up here automatically.
        </p>
      </Card>
    </div>
  );
}
