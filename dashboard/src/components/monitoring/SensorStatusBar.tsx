import React from 'react';
import { CpuIcon } from 'lucide-react';

interface SensorStatusBarProps {
  lastUpdate: string;
  financialLossLKR: number;
  leakDetected: boolean;
  serverConnected: boolean;
  mqttConnected: boolean;
}

export function SensorStatusBar({ lastUpdate, financialLossLKR, leakDetected, serverConnected, mqttConnected }: SensorStatusBarProps) {
  let statusText = 'Healthy';
  let statusColor = 'text-brand';
  let iconColor = 'bg-brand-soft text-brand';

  if (!serverConnected) {
    statusText = 'Dashboard Offline';
    statusColor = 'text-warn';
    iconColor = 'bg-warn-soft text-warn';
  } else if (!mqttConnected) {
    statusText = 'Sensor Offline';
    statusColor = 'text-warn';
    iconColor = 'bg-warn-soft text-warn';
  } else if (leakDetected) {
    statusText = 'Leak Detected';
    statusColor = 'text-warn';
    iconColor = 'bg-warn-soft text-warn';
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-4xl bg-surface px-5 py-4 ring-1 ring-line md:px-6">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconColor}`}>
          <CpuIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">C3 Super Mini</p>
          <p className="text-xs text-muted">Active Device</p>
        </div>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-muted">Last reading</dt>
          <dd className="font-mono font-medium tabular-nums text-ink">{lastUpdate || '---'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Money Lost</dt>
          <dd className="font-mono font-medium tabular-nums text-warn">LKR {financialLossLKR.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Status</dt>
          <dd className={`font-medium ${statusColor}`}>
            {statusText}
          </dd>
        </div>
      </dl>
    </div>
  );
}