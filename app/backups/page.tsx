'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BackupMetadata } from '@/types/backup';
import { Search, Download, Eye, Trash2, Database, ArrowUpDown, Filter, Plus } from 'lucide-react';
import { formatBytes } from '@/lib/utils/formatters';

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'size'>('newest');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

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

  let filtered = backups.filter((b) => {
    const matchesSearch = b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.formattedDate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (sortOrder === 'newest') {
    filtered.sort((a, b) => new Date(b.backupDate).getTime() - new Date(a.backupDate).getTime());
  } else if (sortOrder === 'oldest') {
    filtered.sort((a, b) => new Date(a.backupDate).getTime() - new Date(b.backupDate).getTime());
  } else if (sortOrder === 'size') {
    filtered.sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);
  }

  const totalSizeBytes = filtered.reduce((acc, b) => acc + b.totalSizeBytes, 0);

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-400" />
              Backup History
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect, download, verify, or delete MongoDB timestamped backup snapshots.
            </p>
          </div>

          <Link
            href="/backup"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Backup</span>
          </Link>
        </div>

        {/* Toolbar: Search, Filters & Stats */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search backup ID or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'size')}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="size">Largest Size</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {filtered.length} backups • <span className="text-emerald-400 font-bold">{formatBytes(totalSizeBytes)}</span>
          </div>
        </div>

        {/* Backups Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Backup Folder</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Plants Docs</th>
                  <th className="p-3.5 text-center">Cameras Docs</th>
                  <th className="p-3.5">Total Size</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                      Scanning backup directory...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                      No matching backups found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
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
                      <td className="p-3.5 text-right space-x-1.5">
                        <Link
                          href={`/backups/${encodeURIComponent(b.id)}`}
                          className="inline-flex p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition-all"
                          title="Open Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <a
                          href={`/api/backups/${encodeURIComponent(b.id)}/download`}
                          className="inline-flex p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded transition-all"
                          title="Download ZIP"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => setDeleteTarget(b.id)}
                          className="inline-flex p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded transition-all"
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
