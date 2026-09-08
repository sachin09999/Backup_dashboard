import React from 'react';
import { cn } from '@/lib/utils/formatters';

interface StatusBadgeProps {
  status: 'ONLINE' | 'OFFLINE' | 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'RUNNING' | 'STOPPED' | 'NOT_FOUND' | 'ACCESSIBLE' | 'NOT_ACCESSIBLE' | 'valid' | 'invalid' | 'missing' | 'INFO' | 'WARNING' | 'ERROR';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'md' }) => {
  const getColors = () => {
    switch (status) {
      case 'ONLINE':
      case 'SUCCESS':
      case 'RUNNING':
      case 'ACCESSIBLE':
      case 'valid':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'WARNING':
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'OFFLINE':
      case 'FAILED':
      case 'STOPPED':
      case 'NOT_ACCESSIBLE':
      case 'invalid':
      case 'missing':
      case 'ERROR':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'INFO':
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm': return 'px-2 py-0.5 text-xs font-mono';
      case 'lg': return 'px-3 py-1.5 text-sm font-mono font-medium';
      case 'md':
      default: return 'px-2.5 py-1 text-xs font-mono font-medium';
    }
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-colors', getColors(), getSize(), className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', 
        status === 'ONLINE' || status === 'SUCCESS' || status === 'RUNNING' || status === 'valid' ? 'bg-emerald-400' :
        status === 'IN_PROGRESS' || status === 'WARNING' ? 'bg-amber-400' :
        status === 'INFO' ? 'bg-cyan-400' : 'bg-rose-400'
      )} />
      {status}
    </span>
  );
};
