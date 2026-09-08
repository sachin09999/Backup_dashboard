'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BackupMetadata, SystemHealth, MongoConnectionProfile } from '@/types/backup';
import { PlayCircle, Database, Download, Eye, Trash2, ArrowLeft, HardDrive, FileJson, CheckCircle2, Server, ArrowRight } from 'lucide-react';
import { formatBytes } from '@/lib/utils/formatters';

export default function ServerDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params?.id as string;

  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [profile, setProfile] = useState<MongoConnectionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initServer = useCallback(async () => {
    if (!serverId) return;
    setLoading(true);
    try {
      // 1. Activate connection
      const activateRes = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', connectionId: serverId })
      });

      if (activateRes.ok) {
        const actData = await activateRes.json();
        setProfile(actData.activeProfile || null);
      }

      // 2. Fetch backups & health for this server
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
      console.error('Error loading server dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    initServer();
  }, [initServer]);

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
      <div className="w-full space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono font-semibold transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Servers
            </Link>

            <div>
              <h1 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                {profile?.name || serverId}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Database: <strong className="text-slate-200">{profile?.database || health?.mongodb.database || 'factory'}</strong> ·{' '}
                {health?.mongodb.status === 'ONLINE' ? (
                  <span className="text-emerald-400 font-semibold">● ONLINE</span>
                ) : (
                  <span className="text-rose-400 font-semibold">● OFFLINE</span>
                )}
              </p>
            </div>
          </div>

          <Link
            href="/backup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Run Backup Now</span>
          </Link>
        </div>

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
              <h3 className="text-sm font-semibold text-slate-200">Latest Backup Overview</h3>
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
                    <div className="font-semibold text-slate-200 mt-0.5">{latestBackup.formattedTotalSize}</div>
                    <div className="text-slate-500 text-[10px]">{latestBackup.totalDocuments} docs</div>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Database</div>
                    <div className="font-semibold text-slate-200 mt-0.5 truncate">{latestBackup.database}</div>
                    <div className="text-slate-500 text-[10px]">MongoDB</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <Link
                    href={`/backups/${encodeURIComponent(latestBackup.id)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    <span>View Details</span>
                  </Link>

                  <a
                    href={`/api/backups/${encodeURIComponent(latestBackup.id)}/download`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Download ZIP</span>
                  </a>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs font-mono">
                No backups created yet for this server.
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Server Quick Actions</h3>
              <p className="text-xs text-slate-400 mt-1">Manage backups & settings for {profile?.name || 'this server'}</p>
            </div>

            <div className="space-y-2 my-4">
              <Link
                href="/backup"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-200 transition-all group"
              >
                <span className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-emerald-400" />
                  Trigger Manual Backup
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </Link>

              <Link
                href="/schedule"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-xs font-medium text-slate-200 transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-cyan-400" />
                  Auto Backup Schedules
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </Link>
            </div>

            <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800">
              <span>Host: {profile?.host || profile?.containerName || 'Local'}</span>
              <span className="text-emerald-400 font-semibold">Active Profile</span>
            </div>
          </div>
        </div>

        {/* Recent Backups Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Recent Backup Snapshots</h3>
              <p className="text-xs text-slate-400">Stored backup archives for {profile?.name}</p>
            </div>
            <Link href="/backups" className="text-xs font-mono text-emerald-400 hover:underline">
              View All ({backups.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">ID / Timestamp</th>
                  <th className="p-2.5">Date & Time</th>
                  <th className="p-2.5">Database</th>
                  <th className="p-2.5">Docs</th>
                  <th className="p-2.5">Size</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {backups.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-200">{b.id}</td>
                    <td className="p-2.5 text-slate-400">{b.formattedDate} {b.formattedTime}</td>
                    <td className="p-2.5 text-slate-300">{b.database}</td>
                    <td className="p-2.5 text-slate-300">{b.totalDocuments}</td>
                    <td className="p-2.5 text-slate-300">{b.formattedTotalSize}</td>
                    <td className="p-2.5"><StatusBadge status={b.status} size="sm" /></td>
                    <td className="p-2.5 text-right space-x-2">
                      <Link href={`/backups/${encodeURIComponent(b.id)}`} className="text-cyan-400 hover:text-cyan-300">View</Link>
                      <a href={`/api/backups/${encodeURIComponent(b.id)}/download`} className="text-emerald-400 hover:text-emerald-300">ZIP</a>
                      <button onClick={() => setDeleteTarget(b.id)} className="text-rose-400 hover:text-rose-300">Delete</button>
                    </td>
                  </tr>
                ))}
                {backups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">No backups found. Click "Run Backup Now" to create your first snapshot.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Backup Snapshot?"
          message={`Are you sure you want to delete backup snapshot "${deleteTarget}"?`}
          confirmLabel="Delete Permanently"
          isDanger={true}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </MainLayout>
  );
}
