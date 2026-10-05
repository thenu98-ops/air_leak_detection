import React from 'react';
import { GaugeIcon, ThermometerIcon, WindIcon } from 'lucide-react';
import { LiveMetricCard } from '../components/monitoring/LiveMetricCard';
import { SensorStatusBar } from '../components/monitoring/SensorStatusBar';
import type { LiveTelemetry } from '../hooks/useLiveTelemetry';

interface MonitoringProps {
  telemetry: LiveTelemetry;
}

export function Monitoring({ telemetry }: MonitoringProps) {
  const { points, latest, financialLossLKR, leakDetected, serverConnected, mqttConnected } = telemetry;

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8rem)]">
      <SensorStatusBar 
        lastUpdate={latest.time} 
        financialLossLKR={financialLossLKR} 
        leakDetected={leakDetected} 
        serverConnected={serverConnected}
        mqttConnected={mqttConnected}
      />
      
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
          unit="L/min"
          dataKey="flow"
          points={points}
          band={[60, 160]}
          domain={[0, 220]}
          decimals={1}
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
          * The <strong className="font-semibold text-ink">Min, Avg, and Max</strong> values shown in each card are dynamically calculated over the rolling window of the last 40 sensor readings (~120 seconds).
        </p>
      </div>
    </div>
  );
}