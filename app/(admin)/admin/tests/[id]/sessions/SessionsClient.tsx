'use me';
'use client';

import { useState } from 'react';
import { createSessionAction } from '@/services/sessions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface SessionsClientProps {
  testId: string;
  initialSessions: any[];
}

export function SessionsClient({ testId, initialSessions }: SessionsClientProps) {
  const [sessions, setSessions] = useState<any[]>(initialSessions);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreateSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    const res = await createSessionAction(testId, name);
    if (res.success && res.session) {
      setSessions((prev) => [...prev, res.session]);
      setShowCreateModal(false);
    } else {
      alert(res.error || 'Failed to create session');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Session Management (Unlimited Batches)</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Sessions run independently (e.g. Session A = Paper A, Session B = Paper B). Starting Session A does NOT start Session B.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          ➕ Create Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.length === 0 ? (
          <Card className="col-span-2 text-center p-8 text-slate-500">
            No sessions created for this test yet. (Sessions are optional — students can be assigned directly to the test).
          </Card>
        ) : (
          sessions.map((s) => (
            <Card key={s.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">{s.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">ID: {s.id.substring(0, 8)}...</span>
                </div>
                <Badge variant={s.status === 'running' ? 'success' : 'neutral'}>
                  {s.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div>Assigned Students: <span className="font-bold text-slate-200">{s.test_students?.length || 0}</span></div>
                <div>Paper Questions: <span className="font-bold text-indigo-400">{s.questions?.length || 0}</span></div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <Card title="Create Session / Batch" subtitle="Name this session (e.g., Session A / Paper A)">
              <form onSubmit={handleCreateSession} className="space-y-4">
                <Input label="Session Name *" name="name" required placeholder="e.g. Session A (Paper A)" />
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Session'}
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
