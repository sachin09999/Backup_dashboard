'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsConfig } from '@/types/backup';
import { Settings, Database, Folder, ShieldCheck, CheckCircle2, Save, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsConfig>({
    mongodbContainer: 'ast-mongodb',
    mongodbDatabase: 'factory',
    backupDirectory: '/home/rmg/mongodb-backups',
    collections: {
      plants: true,
      cameras: true
    },
    retentionDays: 30,
    autoCleanupEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-12 text-center text-slate-400 font-mono">
          Loading settings...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-3">
            <Settings className="h-7 w-7 text-cyan-400" />
            Backup Center Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure system parameters, target MongoDB collections, and backup retention policies.
          </p>
        </div>

        {/* Section 1: MongoDB & Storage Environment */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="h-5 w-5 text-emerald-400" /> MongoDB & Environment Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500">Database Name</span>
              <div className="font-bold text-slate-100 text-sm">{settings.mongodbDatabase}</div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500">Docker Container</span>
              <div className="font-bold text-slate-100 text-sm">{settings.mongodbContainer}</div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500">Backup Storage Path</span>
              <div className="font-bold text-slate-100 text-sm truncate">{settings.backupDirectory}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Target Collections */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="h-5 w-5 text-cyan-400" /> Exported Collections
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs">
                  JSON
                </div>
                <div>
                  <div className="font-bold font-mono text-sm text-slate-100">plants</div>
                  <div className="text-xs text-slate-400">Export plants.json</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.collections.plants}
                onChange={(e) => setSettings({ ...settings, collections: { ...settings.collections, plants: e.target.checked } })}
                className="h-5 w-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
            </label>

            <label className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 font-mono font-bold text-xs">
                  JSON
                </div>
                <div>
                  <div className="font-bold font-mono text-sm text-slate-100">cameras</div>
                  <div className="text-xs text-slate-400">Export cameras.json</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.collections.cameras}
                onChange={(e) => setSettings({ ...settings, collections: { ...settings.collections, cameras: e.target.checked } })}
                className="h-5 w-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Retention & Automatic Cleanup */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Trash2 className="h-5 w-5 text-rose-400" /> Retention Policy & Automatic Cleanup
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Keep Backups For</label>
              <select
                value={settings.retentionDays}
                onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
                <option value={0}>Forever (No Automatic Deletion)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Automatic Cleanup</label>
              <label className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-mono text-slate-300">Enable Retention Cleaner</span>
                <input
                  type="checkbox"
                  checked={settings.autoCleanupEnabled}
                  onChange={(e) => setSettings({ ...settings, autoCleanupEnabled: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                />
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="h-4 w-4" /> Settings updated successfully!
              </span>
            ) : (
              <span />
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {saving ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
