'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BackupMetadata, SystemHealth } from '@/types/backup';
import { PlayCircle, Database, Calendar, ScrollText, Download, Eye, Trash2, ShieldCheck, ArrowRight, HardDrive, FileJson, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils/formatters';

export default function DashboardPage() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [backupsRes, healthRes] = await Promise.all([
        fetch('/api/backups'),
        fetch('/api/health')
      ]);

      if (backupsRes.ok) {
        const data = await backupsRes.json();
        setBackups(data.backups || []);
      }
      if (healthRes.ok) {
        const hData = await healthRes.json();
        setHealth(hData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/backups/${encodeURIComponent(deleteTarget)}`, { method: 'DELETE' });
      if (res.ok) {
        setBackups((prev) => prev.filter((b) => b.id !== deleteTarget));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const latestBackup = backups[0];
  const totalSizeBytes = backups.reduce((sum, b) => sum + b.totalSizeBytes, 0);

  const plantsCount = health?.mongodb.collections?.find((c) => c.name === 'plants')?.count ?? 2;
  const camerasCount = health?.mongodb.collections?.find((c) => c.name === 'cameras')?.count ?? 8;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-3">
              MongoDB Backup Center
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-normal">
                v1.0.0
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor and manage factory database backups automatically.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/backup"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
            >
              <PlayCircle className="h-4 w-4" />
              <span>RUN BACKUP NOW</span>
            </Link>
          </div>
        </div>

        {/* 6 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="MongoDB Status"
            value={health?.mongodb.status || 'OFFLINE'}
            subtitle={`Version ${health?.mongodb.version || '4.0.3'}`}
            badge={<StatusBadge status={health?.mongodb.status || 'OFFLINE'} size="sm" />}
            icon={<Database className="h-4 w-4 text-emerald-400" />}
          />

          <StatCard
            title="Database"
            value={health?.mongodb.database || 'factory'}
            subtitle="Target DB"
            icon={<HardDrive className="h-4 w-4 text-cyan-400" />}
          />

          <StatCard
            title="Collections"
            value="2"
            subtitle={`plants (${plantsCount}), cameras (${camerasCount})`}
            icon={<FileJson className="h-4 w-4 text-amber-400" />}
          />

          <StatCard
            title="Last Backup"
            value={latestBackup ? latestBackup.formattedDate : 'None'}
            subtitle={latestBackup ? latestBackup.formattedTime : 'No backups'}
            badge={latestBackup ? <StatusBadge status={latestBackup.status} size="sm" /> : undefined}
            icon={<CheckCircle2 className="h-4 w-4 text-teal-400" />}
          />

          <StatCard
            title="Backup Size"
            value={formatBytes(totalSizeBytes)}
            subtitle="Total storage used"
            icon={<HardDrive className="h-4 w-4 text-purple-400" />}
          />

          <StatCard
            title="Backup Count"
            value={`${backups.length}`}
            subtitle="Saved snapshots"
            icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
          />
        </div>

        {/* Main Grid: Latest Backup Panel & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Backup Panel (2 cols) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Latest Backup Status</h3>
                    <p className="text-xs text-slate-400">Most recent snapshot details</p>
                  </div>
                </div>

                {latestBackup && <StatusBadge status={latestBackup.status} size="lg" />}
              </div>

              {latestBackup ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono mb-6">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="text-slate-500 mb-1">Backup Date</div>
                    <div className="font-bold text-slate-200">{latestBackup.formattedDate}</div>
                    <div className="text-[11px] text-slate-400">{latestBackup.formattedTime}</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="text-slate-500 mb-1">Execution Duration</div>
                    <div className="font-bold text-emerald-400">{latestBackup.durationFormatted}</div>
                    <div className="text-[11px] text-slate-400">Validated export</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="text-slate-500 mb-1">Total Files / Size</div>
                    <div className="font-bold text-cyan-400">{latestBackup.formattedTotalSize}</div>
                    <div className="text-[11px] text-slate-400">2 JSON export files</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="text-slate-500 mb-1">Documents Saved</div>
                    <div className="font-bold text-amber-400">{latestBackup.totalDocuments} docs</div>
                    <div className="text-[11px] text-slate-400">
                      plants ({latestBackup.collections['plants']?.documents ?? 0}), cameras ({latestBackup.collections['cameras']?.documents ?? 0})
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No backups found yet. Click "RUN BACKUP NOW" to perform your first backup.
                </div>
              )}
            </div>

            {latestBackup && (
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
                <Link
                  href={`/backups/${encodeURIComponent(latestBackup.id)}`}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Backup</span>
                </Link>

                <a
                  href={`/api/backups/${encodeURIComponent(latestBackup.id)}/download`}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>Download ZIP</span>
                </a>

                <Link
                  href="/backup"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-all ml-auto"
                >
                  <PlayCircle className="h-4 w-4 text-cyan-400" />
                  <span>Run New Backup</span>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions (1 col) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-3 mb-4">Quick Actions</h3>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <Link
                href="/backup"
                className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <PlayCircle className="h-4 w-4" />
                  </div>
                  <span>Run Backup Now</span>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/backups"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium text-xs transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <span>View All Backups ({backups.length})</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/schedule"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium text-xs transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span>Configure Schedule</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/logs"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium text-xs transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <ScrollText className="h-4 w-4" />
                  </div>
                  <span>View System Logs</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Backups Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Recent Backups</h3>
              <p className="text-xs text-slate-400">Latest executed backup snapshots</p>
            </div>

            <Link href="/backups" className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Backup Folder</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Plants</th>
                  <th className="p-3.5 text-center">Cameras</th>
                  <th className="p-3.5">Total Size</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                      Loading backup history...
                    </td>
                  </tr>
                ) : backups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                      No backups executed yet.
                    </td>
                  </tr>
                ) : (
                  backups.slice(0, 5).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-100">{b.id}</td>
                      <td className="p-3.5 text-slate-300">
                        {b.formattedDate} <span className="text-slate-500">{b.formattedTime}</span>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="p-3.5 text-center text-emerald-400 font-bold">
                        {b.collections['plants']?.documents ?? 0}
                      </td>
                      <td className="p-3.5 text-center text-cyan-400 font-bold">
                        {b.collections['cameras']?.documents ?? 0}
                      </td>
                      <td className="p-3.5 font-bold text-slate-200">{b.formattedTotalSize}</td>
                      <td className="p-3.5 text-slate-400">{b.durationFormatted}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <Link
                          href={`/backups/${encodeURIComponent(b.id)}`}
                          className="inline-flex p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-all"
                          title="View Backup"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <a
                          href={`/api/backups/${encodeURIComponent(b.id)}/download`}
                          className="inline-flex p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-all"
                          title="Download ZIP"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => setDeleteTarget(b.id)}
                          className="inline-flex p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                          title="Delete Backup"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Backup Folder?"
          message={
            <div>
              Are you sure you want to delete backup <strong className="text-white font-mono">{deleteTarget}</strong>?
              <p className="text-xs text-rose-400 mt-2">This action cannot be undone.</p>
            </div>
          }
          confirmLabel="Delete Backup"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </MainLayout>
  );
}
