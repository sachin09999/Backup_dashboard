'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Clock, Database, Box, Sun, Moon } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SystemHealth } from '@/types/backup';

interface TopBarProps {
  health?: SystemHealth | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ health, onRefresh, isRefreshing }) => {
  const [time, setTime] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left side info badges */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          <span>MongoDB:</span>
          <StatusBadge status={health?.mongodb.status || 'OFFLINE'} size="sm" />
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <Box className="h-3.5 w-3.5 text-cyan-400" />
          <span>Docker:</span>
          <StatusBadge status={health?.docker.status || 'NOT_FOUND'} size="sm" />
        </div>

        {health?.backups.lastBackupDate && (
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            <span className="text-slate-400">Last Backup:</span>
            <span className="font-semibold text-emerald-400">
              {new Date(health.backups.lastBackupDate).toLocaleDateString()} {new Date(health.backups.lastBackupDate).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Right side clock & actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Clock className="h-3.5 w-3.5 text-cyan-400 animate-spin-slow" />
          <span>{time || '12:00:00'}</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
          title="Refresh dashboard data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-cyan-400" />}
        </button>
      </div>
    </header>
  );
};
