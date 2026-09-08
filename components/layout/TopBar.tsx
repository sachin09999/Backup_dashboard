'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface TopBarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onRefresh, isRefreshing }) => {
  const [time, setTime] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/backups') return 'Backup History';
    if (pathname.startsWith('/backups/')) return 'Backup Detail';
    if (pathname === '/backup') return 'Run Backup';
    if (pathname === '/schedule') return 'Schedule';
    if (pathname === '/logs') return 'System Logs';
    if (pathname === '/settings') return 'Settings';
    return 'Backup Center';
  };

  return (
    <header className="h-12 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-20">
      <span className="text-sm font-semibold text-slate-200">{getPageTitle()}</span>

      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-slate-600" />
          {time || '00:00:00'}
        </span>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
