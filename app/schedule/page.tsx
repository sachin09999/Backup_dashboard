'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ScheduleConfig } from '@/types/backup';
import { Calendar, Clock, CheckCircle2, Save, Power } from 'lucide-react';

export default function SchedulePage() {
  const [config, setConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'daily',
    dailyTime: '02:00',
    weeklyDay: 'Sunday',
    weeklyTime: '02:00'
  });
  const [cronExpression, setCronExpression] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch('/api/schedule');
        if (res.ok) {
          const data = await res.json();
          setConfig(data.config);
          setCronExpression(data.cronExpression);
        }
      } catch (err) {
        console.error('Error loading schedule:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setCronExpression(data.cronExpression);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="w-full py-12 text-center text-slate-400 font-mono">
          Loading schedule settings...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="pb-2 border-b border-slate-800/80">
          <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            Automatic Backup Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure server-side cron scheduling to perform periodic MongoDB backups automatically.
          </p>
        </div>

        {/* Schedule Config Form */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${config.enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <Power className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono">Enable Automatic Backups</h3>
                <p className="text-xs text-slate-400">Background cron service will execute backups on schedule</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className={`space-y-5 transition-all ${config.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Frequency</label>
              <div className="grid grid-cols-3 gap-3">
                {(['hourly', 'daily', 'weekly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setConfig({ ...config, frequency: freq })}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold font-mono capitalize transition-all ${
                      config.frequency === freq
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {config.frequency === 'daily' && (
              <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Execution Time (24h format)</label>
                <input
                  type="time"
                  value={config.dailyTime}
                  onChange={(e) => setConfig({ ...config, dailyTime: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {config.frequency === 'weekly' && (
              <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Day of Week</label>
                  <select
                    value={config.weeklyDay}
                    onChange={(e) => setConfig({ ...config, weeklyDay: e.target.value as ScheduleConfig['weeklyDay'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={config.weeklyTime}
                    onChange={(e) => setConfig({ ...config, weeklyTime: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Cron Expression: <strong className="text-slate-200">{cronExpression || 'Disabled'}</strong></span>
              </div>
              {config.lastRun && (
                <span className="text-[11px] text-slate-500">Last Run: {new Date(config.lastRun).toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Schedule settings saved successfully!
              </span>
            ) : (
              <span />
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {saving ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
