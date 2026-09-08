import React from 'react';
import { cn } from '@/lib/utils/formatters';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: string;
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
    <div className={cn('relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-md hover:border-slate-700 transition-all', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {icon && <div className="rounded-lg bg-slate-800/80 p-2 text-slate-300">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">{value}</div>
        {badge}
      </div>

      {subtitle && <div className="mt-2 text-xs text-slate-400">{subtitle}</div>}
    </div>
  );
};
