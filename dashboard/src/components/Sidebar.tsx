import React from 'react';
import { WindIcon } from 'lucide-react';
import { navItems } from '../data/navigation';
import type { View } from '../types/telemetry';

interface SidebarProps {
  view: View;
  onChange: (view: View) => void;
  openAlerts: number;
}

export function Sidebar({ view, onChange, openAlerts }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-4 lg:flex">
      <div className="flex h-full flex-col rounded-4xl bg-brand-deep p-4 text-white">
        <div className="flex items-center gap-3 px-2 pb-8 pt-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-signal text-brand-deep">
            <WindIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[15px] font-semibold leading-tight">AirTrace</p>
            <p className="text-xs text-white/55">Industrial IoT</p>
          </div>
        </div>

        <nav aria-label="Main">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = item.id === view;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onChange(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
                    active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`
                    }>
                    
                    <Icon className={`h-[18px] w-[18px] ${active ? 'text-signal' : ''}`} aria-hidden="true" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === 'leak_detection' && openAlerts > 0 &&
                    <span className="rounded-full bg-signal px-2 py-0.5 text-xs font-semibold text-brand-deep">
                        {openAlerts}
                      </span>
                    }
                  </button>
                </li>);

            })}
          </ul>
        </nav>

        <div className="mt-auto rounded-3xl bg-white/5 p-4">
          <p className="text-xs text-white/55">Edge device</p>
          <p className="mt-1 font-mono text-lg font-semibold">C3 Super Mini</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
            Online &middot; Main line
          </p>
        </div>
      </div>
    </aside>);

}