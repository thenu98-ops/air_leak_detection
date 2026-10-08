import React from 'react';
import { GaugeIcon, ThermometerIcon, WindIcon } from 'lucide-react';
import { LiveMetricCard } from '../components/monitoring/LiveMetricCard';
import { SensorStatusBar } from '../components/monitoring/SensorStatusBar';
import type { LiveTelemetry } from '../hooks/useLiveTelemetry';
import { socket } from '../socket';

interface MonitoringProps {
  telemetry: LiveTelemetry;
}

export function Monitoring({ telemetry }: MonitoringProps) {
  const { points, latest, financialLossLKR, leakDetected, serverConnected, mqttConnected } = telemetry;

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SensorStatusBar 
            lastUpdate={latest.time} 
            financialLossLKR={financialLossLKR} 
            leakDetected={leakDetected} 
            serverConnected={serverConnected}
            mqttConnected={mqttConnected}
          />
        </div>
        
        <div className="flex flex-col justify-center gap-1 rounded-4xl bg-surface px-6 py-4 ring-1 ring-line flex-1 h-full">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Live Pressure Drop</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-ink leading-none">{telemetry.currentDropRate.toFixed(3)}</span>
            <span className="text-sm font-semibold text-muted">hPa/sec</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LiveMetricCard
          title="Air pressure"
          unit="hPa"
          dataKey="pressure"
          points={points}
          band={[950, 1050]}
          domain={[900, 1100]}
          decimals={0}
          icon={GaugeIcon}
          tone="dark" />
        
        <LiveMetricCard
          title="Airflow"
          unit="mL/s"
          dataKey="flow"
          points={points}
          band={[1000, 2600]}
          domain={[0, 3600]}
          decimals={0}
          icon={WindIcon} />
        
        <LiveMetricCard
          title="Temperature"
          unit="°C"
          dataKey="temp"
          points={points}
          band={[25, 35]}
          domain={[24, 38]}
          decimals={1}
          icon={ThermometerIcon} />
      </div>

      <div className="text-center pb-2">
        <p className="text-xs text-muted">
          * The <strong className="font-semibold text-ink">Min, Avg, and Max</strong> values shown in each card are dynamically calculated over the rolling window of the last 40 sensor readings (~40 seconds).
        </p>
      </div>
    </div>
  );
}