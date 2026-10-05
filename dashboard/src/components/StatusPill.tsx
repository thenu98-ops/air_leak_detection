import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { Status } from '../types/telemetry';

const styles: Record<Status, string> = {
  normal: 'bg-brand-soft text-brand',
  warning: 'bg-warn-soft text-warn',
  critical: 'bg-danger-soft text-danger'
};

const dots: Record<Status, string> = {
  normal: 'bg-brand',
  warning: 'bg-warn',
  critical: 'bg-danger'
};

const labels: Record<Status, string> = { normal: 'Normal', warning: 'Warning', critical: 'Critical' };

interface StatusPillProps {
  status: Status;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium',
        styles[status],
        className
      )}>
      
      <span className={twMerge('h-1.5 w-1.5 rounded-full', dots[status])} aria-hidden="true" />
      {label ?? labels[status]}
    </span>);

}