'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Database, PlayCircle, Calendar, ScrollText, Settings } from 'lucide-react';
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
    <aside className="w-56 flex-shrink-0 border-r border-slate-800 bg-slate-950/90 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="px-4 py-4 border-b border-slate-800/80 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm leading-tight tracking-tight">Backup Center</h1>
            <p className="text-[10px] text-slate-500">factory · ast-mongodb</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300')} />
                <span>{item.name}</span>
                {item.href === '/backup' && !isActive && (
                  <span className="ml-auto flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / MongoDB Status */}
      <div className="p-3 border-t border-slate-800/60">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[10px] text-slate-500 font-mono">MongoDB</span>
          <div className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', isMongoOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500')} />
            <span className={cn('text-[10px] font-mono font-semibold', isMongoOnline ? 'text-emerald-400' : 'text-rose-400')}>
              {isMongoOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
