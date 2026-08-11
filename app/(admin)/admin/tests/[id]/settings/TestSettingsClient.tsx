'use me';
'use client';

import { useState, useEffect } from 'react';
import { updateTestSettingsAction } from '@/services/tests';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const DEFAULT_SETTINGS = {
  fullscreen_required: true,
  allow_back_navigation: false,
  shuffle_questions: false,
  shuffle_options: false,
  max_violations: 3,
  auto_submit_on_violation: true,
  show_result_after_submission: false,
  allow_retake: false,
  auto_save_answers: true,
};

interface TestSettingsClientProps {
  testId: string;
  initialSettings: any;
}

export function TestSettingsClient({ testId, initialSettings }: TestSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Re-sync when server passes fresh initialSettings (e.g. after revalidatePath)
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const res = await updateTestSettingsAction(testId, settings);
    if (res.success) {
      setSuccess(true);
      // Force a hard reload to get fresh server-rendered props with updated values
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      alert(res.error || 'Failed to update settings');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Examination Configuration & Policies</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Configure security enforcement, navigation controls, and result visibility policies for this test.
        </p>
      </div>

      <Card title="Test Security & Execution Rules">
        <form onSubmit={handleSave} className="space-y-6">
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg">
              ✓ Settings saved successfully.
            </div>
          )}

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-200 text-sm block">Fullscreen Required</span>
                <span className="text-xs text-slate-400">Force student browser into fullscreen mode on exam start</span>
              </div>
              <input
                type="checkbox"
                checked={settings.fullscreen_required}
                onChange={(e) => setSettings({ ...settings, fullscreen_required: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-200 text-sm block">Allow Back Navigation</span>
                <span className="text-xs text-slate-400">Allow student to navigate backwards and change previous answers</span>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_back_navigation}
                onChange={(e) => setSettings({ ...settings, allow_back_navigation: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-200 text-sm block">Shuffle Questions</span>
                <span className="text-xs text-slate-400">Randomize question order for each student attempt</span>
              </div>
              <input
                type="checkbox"
                checked={settings.shuffle_questions}
                onChange={(e) => setSettings({ ...settings, shuffle_questions: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-200 text-sm block">Auto-Save Answers</span>
                <span className="text-xs text-slate-400">Automatically sync answers to database every 30 seconds</span>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_save_answers}
                onChange={(e) => setSettings({ ...settings, auto_save_answers: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </label>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <label className="font-semibold text-slate-200 text-sm block">Maximum Violation Threshold</label>
              <span className="text-xs text-slate-400 block mb-2">Number of anti-cheating violations allowed before auto-submit</span>
              <Input
                type="number"
                value={settings.max_violations}
                onChange={(e) => setSettings({ ...settings, max_violations: parseInt(e.target.value || '3', 10) })}
                className="w-32"
              />
            </div>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-200 text-sm block">Auto-Submit on Violation Limit</span>
                <span className="text-xs text-slate-400">Automatically submit attempt when violation threshold is reached</span>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_submit_on_violation}
                onChange={(e) => setSettings({ ...settings, auto_submit_on_violation: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
