import Link from 'next/link';

export function TestDashboardTabs({
  testId,
  active,
}: {
  testId: string;
  active: 'overview' | 'monitor' | 'results' | 'questions' | 'sessions' | 'students' | 'settings';
}) {
  const tabs = [
    { id: 'overview', label: '📊 Overview', href: `/admin/tests/${testId}` },
    { id: 'monitor', label: '📡 Live Monitor', href: `/admin/tests/${testId}/monitor` },
    { id: 'results', label: '🏆 Results', href: `/admin/tests/${testId}/results` },
    { id: 'questions', label: '❓ Questions', href: `/admin/tests/${testId}/questions` },
    { id: 'students', label: '👥 Students', href: `/admin/tests/${testId}/students` },
    { id: 'settings', label: '⚙️ Settings', href: `/admin/tests/${testId}/settings` },
  ];

  return (
    <div className="flex border-b border-slate-800 space-x-1 mb-6">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            active === tab.id
              ? 'bg-indigo-600 text-white font-bold border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
