'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BackupMetadata, SystemHealth } from '@/types/backup';
import { PlayCircle, Database, Calendar, ScrollText, Download, Eye, Trash2, ArrowRight, HardDrive, FileJson, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils/formatters';

import { ServerCardGrid } from '@/components/settings/ServerCardGrid';

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

  const plantsCount = health?.mongodb.collections?.find((c) => c.name === 'plants')?.count ?? 0;
  const camerasCount = health?.mongodb.collections?.find((c) => c.name === 'cameras')?.count ?? 0;

  return (
    <MainLayout>
      <div className="w-full space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold font-mono text-slate-100">MongoDB Backup Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">{health?.mongodb.database || 'factory'} database · {health?.mongodb.status === 'ONLINE' ? <span className="text-emerald-400">Connected</span> : <span className="text-slate-500">Connecting...</span>}</p>
          </div>

          <Link
            href="/backup"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            <span>Run Backup</span>
          </Link>
        </div>

        {/* Server & Database Selection Cards */}
        <ServerCardGrid onServerSelected={fetchData} />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            title="Total Backups"
            value={`${backups.length}`}
            subtitle="Snapshots stored"
            icon={<Database className="h-4 w-4 text-emerald-400" />}
          />

          <StatCard
            title="Collections"
            value={`${plantsCount + camerasCount}`}
            subtitle={`plants (${plantsCount}) · cameras (${camerasCount})`}
            icon={<FileJson className="h-4 w-4 text-cyan-400" />}
          />

          <StatCard
            title="Latest Backup"
            value={latestBackup ? latestBackup.formattedDate : '—'}
            subtitle={latestBackup ? latestBackup.formattedTime : 'No backups yet'}
            badge={latestBackup ? <StatusBadge status={latestBackup.status} size="sm" /> : undefined}
            icon={<CheckCircle2 className="h-4 w-4 text-teal-400" />}
          />

          <StatCard
            title="Storage Used"
            value={formatBytes(totalSizeBytes)}
            subtitle={`across ${backups.length} snapshot${backups.length !== 1 ? 's' : ''}`}
            icon={<HardDrive className="h-4 w-4 text-purple-400" />}
          />
        </div>

        {/* Content row: latest backup + quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Latest Backup Overview */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Latest Backup</h3>
              {latestBackup && <StatusBadge status={latestBackup.status} size="sm" />}
            </div>

            {latestBackup ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Date</div>
                    <div className="font-semibold text-slate-200 mt-0.5">{latestBackup.formattedDate}</div>
                    <div className="text-slate-500 text-[10px]">{latestBackup.formattedTime}</div>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Duration</div>
                    <div className="font-semibold text-emerald-400 mt-0.5">{latestBackup.durationFormatted}</div>
                    <div className="text-slate-500 text-[10px]">Completed</div>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Size</div>
                    <div className="font-semibold text-cyan-400 mt-0.5">{latestBackup.formattedTotalSize}</div>
                    <div className="text-slate-500 text-[10px]">2 JSON files</div>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Documents</div>
                    <div className="font-semibold text-amber-400 mt-0.5">{latestBackup.totalDocuments}</div>
                    <div className="text-slate-500 text-[10px]">
                      p:{latestBackup.collections['plants']?.documents ?? 0} c:{latestBackup.collections['cameras']?.documents ?? 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs">
                  <Link
                    href={`/backups/${encodeURIComponent(latestBackup.id)}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View</span>
                  </Link>

                  <a
                    href={`/api/backups/${encodeURIComponent(latestBackup.id)}/download`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium border border-slate-700 transition-all"
                  >
                    <Download className="h-3 w-3 text-cyan-400" />
                    <span>Download ZIP</span>
                  </a>

                  <Link
                    href="/backup"
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg font-medium border border-slate-800 transition-all"
                  >
                    <PlayCircle className="h-3 w-3 text-emerald-400" />
                    <span>New Backup</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                No backups yet. Click <strong className="text-slate-300">Run Backup</strong> to create your first snapshot.
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Quick Actions</h3>

            <Link href="/backup" className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300 text-xs font-medium transition-all group">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Run Backup Now</span>
              </div>
              <ArrowRight className="h-3 w-3 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link href="/backups" className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 text-xs font-medium transition-all group">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-cyan-400" />
                <span>All Backups ({backups.length})</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-500 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link href="/schedule" className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 text-xs font-medium transition-all group">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                <span>Configure Schedule</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-500 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link href="/logs" className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 text-xs font-medium transition-all group">
              <div className="flex items-center gap-2">
                <ScrollText className="h-3.5 w-3.5 text-purple-400" />
                <span>View Logs</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Recent Backups Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Recent Backups</h3>
            <Link href="/backups" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2">Snapshot ID</th>
                  <th className="px-3 py-2">Date & Time</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-center">Plants</th>
                  <th className="px-3 py-2 text-center">Cameras</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Duration</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-5 text-center text-slate-500 font-sans">Loading...</td>
                  </tr>
                ) : backups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-5 text-center text-slate-500 font-sans">No backups yet</td>
                  </tr>
                ) : (
                  backups.slice(0, 5).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-3 py-2 font-semibold text-slate-100 text-[11px]">{b.id}</td>
                      <td className="px-3 py-2 text-slate-300">
                        {b.formattedDate} <span className="text-slate-500">{b.formattedTime}</span>
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="px-3 py-2 text-center text-emerald-400 font-bold">
                        {b.collections['plants']?.documents ?? 0}
                      </td>
                      <td className="px-3 py-2 text-center text-cyan-400 font-bold">
                        {b.collections['cameras']?.documents ?? 0}
                      </td>
                      <td className="px-3 py-2 text-slate-300">{b.formattedTotalSize}</td>
                      <td className="px-3 py-2 text-slate-400">{b.durationFormatted}</td>
                      <td className="px-3 py-2 text-right space-x-1">
                        <Link
                          href={`/backups/${encodeURIComponent(b.id)}`}
                          className="inline-flex p-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition-all"
                          title="View"
                        >
                          <Eye className="h-3 w-3" />
                        </Link>
                        <a
                          href={`/api/backups/${encodeURIComponent(b.id)}/download`}
                          className="inline-flex p-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded transition-all"
                          title="Download ZIP"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                        <button
                          onClick={() => setDeleteTarget(b.id)}
                          className="inline-flex p-1 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
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
          title="Delete Backup?"
          message={
            <div>
              Delete snapshot <strong className="text-white font-mono">{deleteTarget}</strong>?
              <p className="text-xs text-rose-400 mt-1">This action cannot be undone.</p>
            </div>
          }
          confirmLabel="Delete"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </MainLayout>
  );
}
