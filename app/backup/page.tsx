'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BackupProgressTracker } from '@/components/backup/BackupProgressTracker';
import { PlayCircle, Database, HardDrive, ShieldCheck, Folder, FileJson, ArrowLeft } from 'lucide-react';

export default function RunBackupPage() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleStartBackup = () => {
    setShowConfirmModal(false);
    setIsRunning(true);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-3">
              <PlayCircle className="h-7 w-7 text-emerald-400" />
              Run MongoDB Backup
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Trigger an immediate live export of factory database collections.
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Link>
        </div>

        {!isRunning ? (
          /* Pre-run Overview Card */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 shadow-inner">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Ready to Backup</h2>
                <p className="text-xs text-slate-400">Review execution parameters before launching the backup job</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
                <Database className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-slate-500">Database</div>
                  <div className="font-bold text-slate-200 text-sm">factory</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
                <FileJson className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <div className="text-slate-500">Target Collections</div>
                  <div className="font-bold text-slate-200 text-sm">plants.json, cameras.json</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
                <Folder className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="text-slate-500">Backup Directory</div>
                  <div className="font-bold text-slate-200 text-sm truncate">/home/rmg/mongodb-backups/</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-purple-400 flex-shrink-0" />
                <div>
                  <div className="text-slate-500">Folder Format</div>
                  <div className="font-bold text-slate-200 text-sm">D-MMM-YYYY_HH-MM-SS</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 space-y-1">
              <div className="font-bold flex items-center gap-2">
                <span>ℹ Safety Guarantee</span>
              </div>
              <p>
                Every backup execution creates a NEW timestamped folder. It will never overwrite existing backups. Mongoexport will preserve MongoDB Extended JSON formatting.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02]"
              >
                <PlayCircle className="h-5 w-5" />
                <span>START BACKUP NOW</span>
              </button>
            </div>
          </div>
        ) : (
          /* Live Progress Tracker during execution */
          <BackupProgressTracker />
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          title="Create a new backup now?"
          message={
            <div>
              This will export <strong className="text-white font-mono">plants</strong> and <strong className="text-white font-mono">cameras</strong> collections from MongoDB and create a new timestamped folder under <strong className="text-white font-mono">/home/rmg/mongodb-backups/</strong>.
            </div>
          }
          confirmLabel="Start Backup"
          isDanger={false}
          onConfirm={handleStartBackup}
          onClose={() => setShowConfirmModal(false)}
        />
      </div>
    </MainLayout>
  );
}
