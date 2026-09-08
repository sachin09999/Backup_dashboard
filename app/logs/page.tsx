'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LogEntry } from '@/types/backup';
import { ScrollText, Search, Trash2, RefreshCw } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.set('search', searchTerm);
      if (levelFilter !== 'ALL') query.set('level', levelFilter);

      const res = await fetch(`/api/logs?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, levelFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        setShowClearModal(false);
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-purple-400" />
              System Execution Logs
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect application logs, backup export history, validation checks, and health events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Refresh logs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>

            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/30 text-rose-400 font-medium text-xs transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search log messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
              {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded transition-all ${
                    levelFilter === lvl
                      ? 'bg-slate-800 text-slate-100 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Level</th>
                  <th className="p-3.5">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500 font-sans">
                      Loading logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500 font-sans">
                      No matching log entries found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <StatusBadge status={log.level} size="sm" />
                      </td>
                      <td className="p-3.5 font-sans text-slate-200 break-all">
                        {log.message}
                        {log.details && (
                          <pre className="mt-1 p-2 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clear Logs Modal */}
        <ConfirmModal
          isOpen={showClearModal}
          title="Clear Log History?"
          message="Are you sure you want to clear all system logs? This action cannot be undone."
          confirmLabel="Clear Logs"
          isLoading={isClearing}
          onConfirm={handleClearLogs}
          onClose={() => setShowClearModal(false)}
        />
      </div>
    </MainLayout>
  );
}
