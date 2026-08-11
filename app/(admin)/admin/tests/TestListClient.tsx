'use me';
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createTestAction, deleteTestAction } from '@/services/tests';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Test } from '@/types/database';

interface TestListClientProps {
  initialTests: any[];
}

export function TestListClient({ initialTests }: TestListClientProps) {
  const [tests, setTests] = useState<any[]>(initialTests);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreateTest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createTestAction(formData);

    if (result.success && result.test) {
      setTests((prev) => [result.test, ...prev]);
      setShowCreateModal(false);
    } else {
      alert(result.error || 'Failed to create test');
    }
    setLoading(false);
  }

  async function handleDeleteTest(testId: string, title: string) {
    if (!confirm(`Are you sure you want to delete test "${title}"? This cannot be undone.`)) return;

    const result = await deleteTestAction(testId);
    if (result.success) {
      setTests((prev) => prev.filter((t) => t.id !== testId));
    } else {
      alert(result.error || 'Failed to delete test');
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'draft':
        return <Badge variant="neutral">Draft</Badge>;
      case 'ready':
        return <Badge variant="info">Ready</Badge>;
      case 'running':
        return <Badge variant="success">Running</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      case 'completed':
        return <Badge variant="info">Completed</Badge>;
      case 'archived':
        return <Badge variant="danger">Archived</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Test Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create and manage independent examinations & assessment configurations.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          ➕ Create New Test
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Test Title</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Marks</th>
                <th className="p-4">Questions</th>
                <th className="p-4">Students</th>
                <th className="p-4">Sessions</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No tests created yet. Click "Create New Test" to get started.
                  </td>
                </tr>
              ) : (
                tests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <Link href={`/admin/tests/${t.id}`} className="font-semibold text-slate-100 hover:text-indigo-400">
                        {t.title}
                      </Link>
                      {t.description && <div className="text-xs text-slate-400 mt-0.5">{t.description}</div>}
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-xs">{t.duration_minutes} min</td>
                    <td className="p-4 text-slate-300 font-mono text-xs">{t.total_marks} pts</td>
                    <td className="p-4 text-slate-300 font-mono text-xs">{t.total_questions || 0}</td>
                    <td className="p-4 text-slate-300 font-mono text-xs">{t.test_students?.length || 0}</td>
                    <td className="p-4 text-slate-300 font-mono text-xs">{t.sessions?.length || 0}</td>
                    <td className="p-4">{getStatusBadge(t.status)}</td>
                    <td className="p-4 text-right flex justify-end items-center gap-2">
                      <Link href={`/admin/tests/${t.id}`}>
                        <Button size="sm" variant="outline">
                          Manage →
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTest(t.id, t.title)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                      >
                        🗑️ Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE TEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <Card title="Create New Examination" subtitle="Configure initial details for your new test">
              <form onSubmit={handleCreateTest} className="space-y-4">
                <Input label="Test Title *" name="title" required placeholder="e.g. MITPyVerse Retest 2026" />
                <Input label="Description" name="description" placeholder="e.g. Python & C programming retest" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Duration (Minutes) *" name="duration_minutes" type="number" defaultValue="60" required />
                  <Input label="Total Marks" name="duration_marks" type="number" defaultValue="30" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Test'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
