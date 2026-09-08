'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Database, PlayCircle, Calendar, ScrollText, Settings, Server } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';
import { SystemHealth } from '@/types/backup';

interface SidebarProps {
  health?: SystemHealth | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ health }) => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Backups', href: '/backups', icon: Database },
    { name: 'Run Backup', href: '/backup', icon: PlayCircle },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Logs', href: '/logs', icon: ScrollText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isMongoOnline = health?.mongodb.status === 'ONLINE';

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950/90 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-lg leading-tight tracking-tight">Backup Center</h1>
            <p className="text-[11px] font-medium text-slate-400">Factory DB Management</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                )}
              >
                <Icon className={cn('h-4 w-4 transition-transform group-hover:scale-110', isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200')} />
                <span>{item.name}</span>
                {item.href === '/backup' && (
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / MongoDB Online Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="h-4 w-4 text-slate-400" />
            <div>
              <div className="text-xs font-semibold text-slate-200">ast-mongodb</div>
              <div className="text-[10px] text-slate-400">Host: localhost:27017</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full animate-pulse', isMongoOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500')} />
            <span className={cn('text-xs font-mono font-semibold', isMongoOnline ? 'text-emerald-400' : 'text-rose-400')}>
              {isMongoOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
