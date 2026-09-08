'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertCircle, Loader2, Terminal, ArrowRight, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { BackupMetadata, SSEProgressEvent } from '@/types/backup';

interface BackupProgressTrackerProps {
  onComplete?: (metadata: BackupMetadata) => void;
  onFail?: (error: string) => void;
}

const STEPS = [
  'Connecting to MongoDB & Docker',
  'Exporting plants collection',
  'Exporting cameras collection',
  'Validating JSON extended structure',
  'Calculating file sizes & checksums',
  'Creating backup metadata.json',
  'Backup completed successfully'
];

export const BackupProgressTracker: React.FC<BackupProgressTrackerProps> = ({ onComplete, onFail }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<('pending' | 'in_progress' | 'completed' | 'failed' | 'started')[]>(
    Array(7).fill('pending')
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const [createdBackup, setCreatedBackup] = useState<BackupMetadata | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/backups/stream');

    eventSource.onmessage = (event) => {
      try {
        const data: SSEProgressEvent = JSON.parse(event.data);

        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`]);

        if (data.step > 0 && data.step <= 7) {
          setCurrentStep(data.step);

          setStepStatuses((prev) => {
            const next = [...prev];
            // Mark previous steps as completed
            for (let i = 0; i < data.step - 1; i++) {
              if (next[i] !== 'failed') next[i] = 'completed';
            }
            next[data.step - 1] = data.status;
            return next;
          });
        }

        if (data.status === 'failed') {
          setHasError(data.message);
          eventSource.close();
          if (onFail) onFail(data.message);
        }

        if (data.status === 'completed' && data.data && data.step === 7) {
          setIsDone(true);
          setCreatedBackup(data.data as BackupMetadata);
          eventSource.close();
          if (onComplete) onComplete(data.data as BackupMetadata);
        }
      } catch {
        // ignore parse error
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onComplete, onFail]);

  const progressPercent = Math.min(100, Math.round((currentStep / 7) * 100));

  return (
    <div className="space-y-6">
      {/* Progress Bar & Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {isDone ? (
                <span className="text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Backup Completed
                </span>
              ) : hasError ? (
                <span className="text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" /> Backup Failed
                </span>
              ) : (
                <span className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="h-5 w-5 animate-spin" /> Executing Live Backup...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Exporting plants.json and cameras.json into timestamp directory</p>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{progressPercent}%</div>
        </div>

        {/* Progress Track */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              hasError ? 'bg-rose-500' : isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-500 to-emerald-400 animate-pulse'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Execution Steps</h4>
          {STEPS.map((stepName, idx) => {
            const status = stepStatuses[idx];
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : status === 'in_progress'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-sm'
                    : status === 'failed'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                }`}
              >
                {status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                ) : status === 'in_progress' ? (
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin flex-shrink-0" />
                ) : status === 'failed' ? (
                  <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-600 flex-shrink-0" />
                )}
                <span className="flex-1 font-mono">{idx + 1}. {stepName}</span>
              </div>
            );
          })}
        </div>

        {/* Live Execution Console Log */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs flex flex-col h-80">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">Server Execution Log</span>
            </div>
            <span className="text-[10px] text-slate-500">Live SSE</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 text-slate-300 pr-2">
            {logs.map((log, i) => (
              <div key={i} className="leading-relaxed break-all">
                <span className="text-emerald-500 mr-2">›</span>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion Card */}
      {isDone && createdBackup && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-xl">
          <div>
            <div className="text-base font-bold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Backup Execution Succeeded!
            </div>
            <div className="text-xs text-emerald-200/80 mt-1 font-mono">
              Folder: {createdBackup.id} • Size: {createdBackup.formattedTotalSize} • Documents: {createdBackup.totalDocuments}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/backups/${encodeURIComponent(createdBackup.id)}`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-md shadow-emerald-600/20"
            >
              <Eye className="h-4 w-4" />
              <span>View Backup</span>
            </Link>

            <a
              href={`/api/backups/${encodeURIComponent(createdBackup.id)}/download`}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download ZIP</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
