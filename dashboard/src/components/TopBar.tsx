import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { BellIcon, WindIcon } from 'lucide-react';
import { navItems } from '../data/navigation';
import type { View } from '../types/telemetry';

interface TopBarProps {
  view: View;
  onChange: (view: View) => void;
  latencyMs: number;
  openAlerts: number;
  serverConnected?: boolean;
}

export function TopBar({ view, onChange, latencyMs, openAlerts, serverConnected }: TopBarProps) {
  const [now, setNow] = useState(new Date());
  const current = navItems.find((n) => n.id === view) ?? navItems[0];

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="px-4 pt-4 md:px-6 lg:px-8 lg:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-deep text-signal lg:hidden">
            <WindIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Compressed Air System</h1>
            <p className="text-sm text-muted">{current.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-sm ring-1 ring-line">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden ${serverConnected ? 'bg-brand' : 'bg-danger'}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${serverConnected ? 'bg-brand' : 'bg-danger'}`} />
            </span>
            <span className="font-medium text-ink">Backend Server</span>
            <span className="hidden text-muted sm:inline">{serverConnected ? 'Online' : 'Offline'}</span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-sm ring-1 ring-line">
            <span className="font-medium text-ink">MQTT</span>
            <span className="hidden text-muted sm:inline">latency ·</span>
            <span className="font-mono text-muted tabular-nums">{latencyMs} ms</span>
          </div>
          
          <div className="hidden rounded-full bg-surface px-3.5 py-2 font-mono text-sm text-ink tabular-nums ring-1 ring-line sm:block">
            {format(now, 'HH:mm:ss')}
          </div>
          
          <button
            type="button"
            onClick={() => onChange('leak_detection')}
            aria-label={`Alerts, ${openAlerts} open`}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink ring-1 ring-line transition-colors duration-150 hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${openAlerts > 0 ? 'animate-pulse bg-danger/10 text-danger ring-danger' : ''}`}>
            
            <BellIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            {openAlerts > 0 &&
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white">
                {openAlerts}
              </span>
            }
          </button>
        </div>
      </div>

      <nav aria-label="Main" className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
        {navItems.map((item) => {
          const active = item.id === view;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              active ? 'bg-brand-deep text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'}`
              }>
              
              {item.label}
            </button>);

        })}
      </nav>
    </header>);

}