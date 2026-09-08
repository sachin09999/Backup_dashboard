'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { JsonViewerModal } from '@/components/ui/JsonViewerModal';
import { BackupMetadata } from '@/types/backup';
import { ArrowLeft, Download, Trash2, Eye, FileCode, CheckCircle2, AlertCircle, HardDrive, Clock, Calendar, ShieldCheck, Database } from 'lucide-react';
import { formatBytes } from '@/lib/utils/formatters';

export default function BackupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [backup, setBackup] = useState<BackupMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // File preview modal state
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const fetchBackup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/backups/${encodeURIComponent(id)}`);
      if (!res.ok) {
        throw new Error('Backup not found');
      }
      const data = await res.json();
      setBackup(data.backup);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBackup();
  }, [fetchBackup]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/backups/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/backups');
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto py-12 text-center text-slate-400 font-mono">
          Loading backup details...
        </div>
      </MainLayout>
    );
  }

  if (error || !backup) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-100">Backup Not Found</h2>
          <p className="text-sm text-slate-400">{error || 'Could not locate backup directory'}</p>
          <Link
            href="/backups"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Backups
          </Link>
        </div>
      </MainLayout>
    );
  }

  const filesList = [
    {
      name: 'plants.json',
      meta: backup.collections['plants']
    },
    {
      name: 'cameras.json',
      meta: backup.collections['cameras']
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back Link & Header Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/backups"
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">{backup.id}</h1>
                <StatusBadge status={backup.status} size="lg" />
              </div>
              <p className="text-xs text-slate-400 mt-1">Backup folder detail overview and JSON file inspector</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/api/backups/${encodeURIComponent(backup.id)}/download`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download Complete Backup (.ZIP)</span>
            </a>

            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/30 text-rose-400 font-medium text-xs transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Backup</span>
            </button>
          </div>
        </div>

        {/* Backup Summary Overview Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" /> Backup Overview
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-500 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Date & Time
              </div>
              <div className="font-bold text-slate-200 text-sm">{backup.formattedDate}</div>
              <div className="text-slate-400">{backup.formattedTime}</div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-500 mb-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> Execution Duration
              </div>
              <div className="font-bold text-emerald-400 text-sm">{backup.durationFormatted}</div>
              <div className="text-slate-400">Validated export</div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-500 mb-1 flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-purple-400" /> Total Storage Size
              </div>
              <div className="font-bold text-slate-200 text-sm">{backup.formattedTotalSize}</div>
              <div className="text-slate-400">{backup.totalDocuments} documents total</div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-500 mb-1 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-400" /> Target Database
              </div>
              <div className="font-bold text-slate-200 text-sm">{backup.database}</div>
              <div className="text-slate-400">plants & cameras</div>
            </div>
          </div>
        </div>

        {/* Files Cards / Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileCode className="h-5 w-5 text-cyan-400" /> Exported JSON Files
            </h2>
            <span className="text-xs font-mono text-slate-400">Compass Compatible Extended JSON</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filesList.map((file) => {
              const meta = file.meta;
              return (
                <div key={file.name} className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <FileCode className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold font-mono text-slate-100 text-sm">{file.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {meta ? `${meta.documents} documents • ${formatBytes(meta.size)}` : 'File unavailable'}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={meta?.status || 'missing'} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setPreviewFile(file.name)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Preview JSON</span>
                    </button>

                    <a
                      href={`/api/backups/${encodeURIComponent(backup.id)}/files/${encodeURIComponent(file.name)}?download=true`}
                      download
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs font-semibold transition-all border border-emerald-500/30"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* File Preview Modal */}
        {previewFile && (
          <JsonViewerModal
            isOpen={!!previewFile}
            onClose={() => setPreviewFile(null)}
            backupId={backup.id}
            filename={previewFile}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Delete Backup Folder?"
          message={
            <div>
              Are you sure you want to delete backup <strong className="text-white font-mono">{backup.id}</strong>?
              <p className="text-xs text-rose-400 mt-2">This action cannot be undone.</p>
            </div>
          }
          confirmLabel="Delete Backup"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteModalOpen(false)}
        />
      </div>
    </MainLayout>
  );
}
