'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { ServerCardGrid } from '@/components/settings/ServerCardGrid';
import { Database, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const handleServerSelected = (connectionId?: string) => {
    if (connectionId) {
      router.push(`/server/${encodeURIComponent(connectionId)}`);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 py-2">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2.5">
              <Database className="h-6 w-6 text-emerald-400" />
              MongoDB Backup Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select a database server to enter its dashboard, view live health, and run live backups.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="h-4 w-4" />
            <span>Multi-Server Ready</span>
          </div>
        </div>

        {/* Clean Server Selection Grid */}
        <div className="pt-2">
          <ServerCardGrid onServerSelected={handleServerSelected} />
        </div>
      </div>
    </MainLayout>
  );
}
