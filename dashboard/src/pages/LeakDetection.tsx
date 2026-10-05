import React from 'react';
import { AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import type { LiveTelemetry } from '../hooks/useLiveTelemetry';
import { Panel } from '../components/Panel';

export function LeakDetection({ telemetry }: { telemetry: LiveTelemetry }) {
  const { leakDetected, severity, leakRateLpm } = telemetry;
  
  return (
    <div className="space-y-4">
      <Panel title="Leak Detection Status" subtitle="Continuous pressure drop analysis">
        <div className={`p-6 rounded-2xl flex items-center gap-4 ${leakDetected ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-brand/10 text-brand border border-brand/20'}`}>
          {leakDetected ? <AlertTriangleIcon size={48} /> : <CheckCircleIcon size={48} />}
          <div>
            <h2 className="text-2xl font-bold">{leakDetected ? 'Leak Detected' : 'No Leaks Detected'}</h2>
            <p className="opacity-80">{leakDetected ? 'The system has identified a continuous pressure drop indicative of a leak.' : 'Pressure is holding steady. No anomalous drops detected.'}</p>
          </div>
        </div>
      </Panel>
      
      {leakDetected && severity && (
        <Panel title="Leak Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface rounded-xl border border-line">
              <p className="text-sm text-muted mb-1">Severity Level</p>
              <p className="text-2xl font-bold text-ink">{severity.level}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-line">
              <p className="text-sm text-muted mb-1">Leak Rate</p>
              <p className="text-2xl font-bold text-ink">{leakRateLpm} L/min</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-line">
              <p className="text-sm text-muted mb-1">Time to Empty</p>
              <p className="text-2xl font-bold text-ink">{severity.timeToEmptyMin ? `${severity.timeToEmptyMin} mins` : 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-surface rounded-xl border border-line">
            <p className="text-sm text-muted mb-1">Reason</p>
            <p className="text-lg text-ink">{severity.reason}</p>
          </div>
        </Panel>
      )}
    </div>
  );
}
