'use me';
'use client';

import { useState } from 'react';
import { adminLoginAction } from '@/lib/auth/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await adminLoginAction(formData);

    if (result && !result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white items-center justify-center p-1 shadow-xl mb-3 overflow-hidden">
            <img
              src="/PyVerse_logo.png"
              alt="PyVerse Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">MITPyVerse</h1>
          <p className="text-sm text-slate-400">Admin Control Portal</p>
        </div>

        <Card title="Administrator Login">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Email / Username"
              name="email"
              type="text"
              placeholder="Enter admin username"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter password"
              required
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In as Administrator'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
