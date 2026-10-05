import React from "react";
import { Area, AreaChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TelemetryPoint } from "../../types/telemetry";
type MetricKey = 'pressure' | 'flow' | 'temp';
interface LiveMetricCardProps {
  title: string;
  unit: string;
  dataKey: MetricKey;
  points: TelemetryPoint[];
  band: [number, number];
  domain: [number, number];
  decimals: number;
  icon: React.ElementType;
  tone?: 'dark' | 'light';
  size?: 'large' | 'regular';
  className?: string;
}
export function LiveMetricCard({
  title,
  unit,
  dataKey,
  points,
  band,
  domain,
  decimals,
  icon: Icon,
  tone = 'light',
  size = 'regular',
  className
}: LiveMetricCardProps) {
  const dark = tone === 'dark';
  const values = points.map((p) => p[dataKey]);
  const latest = values[values.length - 1];
  const delta = latest - values[values.length - 2];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const inBand = latest >= band[0] && latest <= band[1];
  const stroke = dark ? '#C4F25E' : '#046C3A';
  const tick = dark ? 'rgba(255,255,255,0.45)' : '#5B6B62';
  const muted = dark ? 'text-white/60' : 'text-muted';
  const chip = dark ? 'bg-white/5' : 'bg-canvas';
  return <section aria-label={`${title} live`} className={twMerge('flex flex-col rounded-4xl p-6 md:p-8', dark ? 'bg-brand-deep text-white' : 'bg-surface text-ink ring-1 ring-line', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm ${muted}`}>
            <Icon className={`h-4 w-4 ${dark ? 'text-signal' : 'text-brand'}`} aria-hidden="true" />
            <h2>{title}</h2>
          </div>
          <div className="mt-3 flex items-end gap-2.5">
            <p className={`font-mono font-semibold leading-none tabular-nums ${size === 'large' ? 'text-6xl md:text-7xl' : 'text-5xl'}`}>
              {latest.toFixed(decimals)}
            </p>
            <p className={`pb-1 text-lg ${dark ? 'text-white/70' : 'text-muted'}`}>{unit}</p>
            <span className={`mb-1.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-xs tabular-nums ${dark ? 'bg-signal/15 text-signal' : 'bg-brand-soft text-brand'}`}>
              {delta >= 0 ? <ArrowUpRightIcon className="h-3 w-3" aria-hidden="true" /> : <ArrowDownRightIcon className="h-3 w-3" aria-hidden="true" />}
              {Math.abs(delta).toFixed(decimals)}
            </span>
          </div>
          <p className={`mt-3 flex items-center gap-2 text-sm ${muted}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${inBand ? dark ? 'bg-signal' : 'bg-brand' : 'bg-warn'}`} aria-hidden="true" />
            {inBand ? 'Within' : 'Outside'} normal range {band[0]}–{band[1]} {unit}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2">
          {[['Min', min], ['Avg', avg], ['Max', max]].map(([label, v]) => <div key={label as string} className={`rounded-3xl px-4 py-3 ${chip}`}>
              <dt className={`text-xs ${muted}`}>{label}</dt>
              <dd className="mt-1 font-mono text-base font-semibold tabular-nums">{(v as number).toFixed(decimals)}</dd>
            </div>)}
        </dl>
      </div>

      <div className="mt-6 flex-1 min-h-0" role="img" aria-label={`${title} over the last 120 seconds`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{
          top: 8,
          right: 4,
          left: -18,
          bottom: 0
        }}>
            <ReferenceArea y1={band[0]} y2={band[1]} fill={dark ? '#FFFFFF' : '#046C3A'} fillOpacity={dark ? 0.04 : 0.05} />
            <XAxis dataKey="time" tick={{
            fill: tick,
            fontSize: 11
          }} axisLine={false} tickLine={false} interval={9} />
            <YAxis domain={domain} tick={{
            fill: tick,
            fontSize: 11
          }} axisLine={false} tickLine={false} tickCount={4} />
            <Tooltip cursor={{
            stroke: dark ? 'rgba(255,255,255,0.2)' : '#E1E7E2'
          }} contentStyle={{
            background: dark ? '#0D1B14' : '#FFFFFF',
            border: dark ? 'none' : '1px solid #E1E7E2',
            borderRadius: 14,
            color: dark ? '#fff' : '#0D1B14',
            fontSize: 12
          }} labelStyle={{
            color: dark ? 'rgba(255,255,255,0.6)' : '#5B6B62'
          }} formatter={(v: number) => [`${v.toFixed(decimals)} ${unit}`, title]} />
            <Area type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2} fill={stroke} fillOpacity={0.1} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>;
}