'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MongoConnectionProfile } from '@/types/backup';
import { Server, Plus, Check, RefreshCw, Trash2, Database, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConnectionSelectorProps {
  onConnectionChange?: () => void;
}

export function ConnectionSelector({ onConnectionChange }: ConnectionSelectorProps) {
  const [connections, setConnections] = useState<MongoConnectionProfile[]>([]);
  const [activeId, setActiveId] = useState<string>('local-docker');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Modal Form State
  const [formData, setFormData] = useState<Partial<MongoConnectionProfile>>({
    name: '',
    type: 'REMOTE_URI',
    uri: '',
    database: 'factory',
    authDatabase: 'admin'
  });

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/connections');
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        setActiveId(data.activeConnectionId || 'local-docker');
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleActivate = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', connectionId: id })
      });
      if (res.ok) {
        setActiveId(id);
        if (onConnectionChange) onConnectionChange();
      }
    } catch (err) {
      console.error('Failed to activate connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', profile: formData })
      });
      const data = await res.json();
      if (data.success) {
        const cols = data.health?.collections?.map((c: { name: string }) => c.name).join(', ') || 'Connected';
        setTestResult({ success: true, message: `Connected! Found collections: ${cols}` });
      } else {
        setTestResult({ success: false, message: data.health?.error || 'Connection failed' });
      }
    } catch (err) {
      setTestResult({ success: false, message: String(err) });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.database) return;

    setLoading(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', profile: formData })
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        setActiveId(data.activeConnectionId);
        setShowModal(false);
        setFormData({ name: '', type: 'REMOTE_URI', uri: '', database: 'factory', authDatabase: 'admin' });
        setTestResult(null);
        if (onConnectionChange) onConnectionChange();
      }
    } catch (err) {
      console.error('Failed to save connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'local-docker') return;
    if (!confirm('Are you sure you want to delete this connection profile?')) return;

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', connectionId: id })
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        setActiveId(data.activeConnectionId);
        if (onConnectionChange) onConnectionChange();
      }
    } catch (err) {
      console.error('Failed to delete connection:', err);
    }
  };

  const activeProfile = connections.find(c => c.id === activeId) || connections[0];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Server className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Target Database</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-slate-200 font-mono">
              {activeProfile?.name || 'Local Docker'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
              {activeProfile?.database || 'factory'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={activeId}
          onChange={(e) => handleActivate(e.target.value)}
          disabled={loading}
          className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
        >
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.database})
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Server</span>
        </button>
      </div>

      {/* Add Remote Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-400" />
                Add Remote MongoDB Connection
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Profile Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UAE Factory Remote Server"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">MongoDB Connection URI</label>
                <input
                  type="text"
                  placeholder="mongodb://username:password@10.10.12.60:27017/factory?authSource=admin"
                  value={formData.uri || ''}
                  onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Database Name</label>
                  <input
                    type="text"
                    required
                    placeholder="factory"
                    value={formData.database || ''}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Auth Database</label>
                  <input
                    type="text"
                    placeholder="admin"
                    value={formData.authDatabase || ''}
                    onChange={(e) => setFormData({ ...formData, authDatabase: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="font-mono text-[11px]">{testResult.message}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !formData.uri}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Server Profile</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
