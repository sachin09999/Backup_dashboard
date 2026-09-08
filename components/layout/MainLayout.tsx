'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { SystemHealth } from '@/types/backup';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex antialiased">
      <Sidebar health={health} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar health={health} onRefresh={fetchHealth} isRefreshing={isRefreshing} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
