import React from 'react';
import type { LiveTelemetry } from '../hooks/useLiveTelemetry';
import { Panel } from '../components/Panel';

export function EnergyMaintenance({ telemetry }: { telemetry: LiveTelemetry }) {
  const { financialLossLKR, action, leakDetected } = telemetry;

  return (
    <div className="space-y-4">
      <Panel title="Energy & Money Loss">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-surface rounded-2xl border border-line flex flex-col justify-center">
            <p className="text-sm text-muted mb-2">Money Lost (Estimated)</p>
            <p className={`text-4xl font-mono font-bold ${financialLossLKR > 0 ? 'text-warn' : 'text-brand'}`}>
              LKR {financialLossLKR.toFixed(2)}
            </p>
          </div>
          <div className="p-6 bg-surface rounded-2xl border border-line flex flex-col justify-center">
            <p className="text-sm text-muted mb-2">Energy Wasted</p>
            <p className={`text-4xl font-mono font-bold ${telemetry.energyLossKWh > 0 ? 'text-warn' : 'text-brand'}`}>
              {(telemetry.energyLossKWh || 0).toFixed(4)} kWh
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Maintenance Decision">
        <div className={`p-6 rounded-2xl flex flex-col gap-2 ${leakDetected ? 'bg-warn/10 border border-warn/20' : 'bg-brand/10 border border-brand/20'}`}>
          <p className="text-sm font-semibold opacity-70">Recommended Action</p>
          <p className="text-2xl font-bold">{action || (leakDetected ? 'Inspect System' : 'System Healthy')}</p>
        </div>
      </Panel>
    </div>
  );
}
