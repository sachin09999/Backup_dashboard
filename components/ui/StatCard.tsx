import React from 'react';
import { cn } from '@/lib/utils/formatters';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  className
}) => {
  return (
    <div className={cn('relative rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-all', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {icon && <div className="rounded-md bg-slate-800/70 p-1.5">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-xl font-bold font-mono tracking-tight text-slate-100">{value}</div>
        {badge}
      </div>

      {subtitle && <div className="mt-1 text-[11px] text-slate-500">{subtitle}</div>}
    </div>
  );
};
