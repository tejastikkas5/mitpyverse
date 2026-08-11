export const dynamic = 'force-dynamic';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [{ count: totalTests }, { count: totalStudents }, { count: runningTests }] = await Promise.all([
    supabase.from('tests').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('status', 'running'),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Control Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage examinations, students, and real-time assessment monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/tests">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Examinations</div>
            <div className="text-3xl font-extrabold text-slate-100 mt-2">{totalTests || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Manage tests →</div>
          </Card>
        </Link>

        <Link href="/admin/tests">
          <Card className="hover:border-emerald-500/50 transition-colors cursor-pointer">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Live Running Tests</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{runningTests || 0}</div>
            <div className="text-xs text-emerald-500 mt-1">Active examinations</div>
          </Card>
        </Link>

        <Link href="/admin/students">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Enrolled Students</div>
            <div className="text-3xl font-extrabold text-indigo-400 mt-2">{totalStudents || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Manage students →</div>
          </Card>
        </Link>

        <Card>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">System Status</div>
          <div className="mt-2">
            <Badge variant="success">Online & Operational</Badge>
          </div>
          <div className="text-xs text-slate-500 mt-2">Server Authoritative</div>
        </Card>
      </div>
    </div>
  );
}
