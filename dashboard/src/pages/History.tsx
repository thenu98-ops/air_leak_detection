import React, { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Panel } from '../components/Panel';
import { SegmentedControl } from '../components/SegmentedControl';
import { metricConfig, summarise, type Metric, type HistoryPoint } from '../utils/history';
import { format } from 'date-fns';
import { round } from '../utils/format';
import { AlertTriangleIcon } from 'lucide-react';

export function History() {
  const [metric, setMetric] = useState<Metric>('pressure');
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const cfg = metricConfig[metric];

  React.useEffect(() => {
    fetch('http://localhost:3000/api/history/esp32-01')
      .then(res => res.json())
      .then((history: any[]) => {
        setDbHistory(history);
      })
      .catch(console.error);
  }, []);

  const data = useMemo(() => {
    if (dbHistory.length === 0) return [];
    return dbHistory.map(rec => {
      let value = 0;
      if (metric === 'pressure') value = (rec.detection?.pressureKPa || 0) * 10;
      else if (metric === 'flow') value = rec.raw?.flow_Lpm || 0;
      else value = rec.raw?.temp_C || 0;
      return {
        label: format(new Date(rec.ts), 'HH:mm:ss'),
        value: round(value, 2)
      };
    });
  }, [dbHistory, metric]);

  const stats = useMemo(() => summarise(data, cfg.band), [data, cfg.band]);

  const leakEvents = useMemo(() => {
    return dbHistory.filter(rec => rec.detection?.leakDetected);
  }, [dbHistory]);

  return (
    <div className="space-y-4">
      <Panel
        title={`${cfg.label} History`}
        subtitle={`Recent data readings over time`}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <SegmentedControl<Metric>
              label="Metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: 'pressure', label: 'Pressure' },
                { value: 'flow', label: 'Airflow' },
                { value: 'temp', label: 'Temp' }
              ]} 
            />
          </div>
        }>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_200px]">
          <div className="h-80" role="img" aria-label={`${cfg.label} history`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="#E1E7E2" strokeDasharray="3 4" vertical={false} />
                <ReferenceArea y1={cfg.band[0]} y2={cfg.band[1]} fill="#046C3A" fillOpacity={0.05} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#5B6B62', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40} />
                
                <YAxis domain={cfg.domain} tick={{ fill: '#5B6B62', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, border: '1px solid #E1E7E2', fontSize: 12 }}
                  formatter={(v: number) => [`${v} ${cfg.unit}`, cfg.label]} />
                
                <Line type="monotone" dataKey="value" stroke="#046C3A" strokeWidth={2} dot={false} animationDuration={250} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-line">
            {[
              ['Average', stats.avg, cfg.unit],
              ['Minimum', stats.min, cfg.unit],
              ['Maximum', stats.max, cfg.unit],
              ['Outside band', stats.outOfBand, '% of time']
            ].map(([label, value, unit]) =>
              <div key={label as string} className="lg:py-3.5 lg:first:pt-0">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-ink">
                  {value} <span className="text-xs font-normal text-muted">{unit}</span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </Panel>

      <Panel title="Leak Detection Log" subtitle="Recorded leaks in the current dataset">
        <div className="-mx-2 overflow-x-auto">
          {leakEvents.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <AlertTriangleIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No leaks detected in recorded history.</p>
            </div>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th scope="col" className="px-2 pb-3 font-medium">Time</th>
                  <th scope="col" className="px-2 pb-3 font-medium">Severity</th>
                  <th scope="col" className="px-2 pb-3 font-medium">Reason</th>
                  <th scope="col" className="px-2 pb-3 font-medium">Money Lost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leakEvents.map((e, idx) => (
                  <tr key={idx}>
                    <td className="whitespace-nowrap px-2 py-3.5 font-mono text-xs text-ink">{format(new Date(e.ts), 'MMM d, HH:mm:ss')}</td>
                    <td className="px-2 py-3.5 font-medium text-danger">{e.severity?.level || 'UNKNOWN'}</td>
                    <td className="px-2 py-3.5 text-muted">{e.severity?.reason || 'Continuous pressure drop identified.'}</td>
                    <td className="whitespace-nowrap px-2 py-3.5 font-mono text-xs text-warn">LKR {e.finance?.financialLossLKR?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
    </div>
  );
}