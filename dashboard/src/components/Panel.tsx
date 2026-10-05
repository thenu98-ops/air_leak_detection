import React, { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface PanelProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, subtitle, action, className, children }: PanelProps) {
  return (
    <section className={twMerge('rounded-4xl bg-surface p-5 ring-1 ring-line md:p-6', className)}>
      {(title || action) &&
      <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      }
      {children}
    </section>);

}