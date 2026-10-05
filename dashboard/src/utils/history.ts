import { format, subHours } from 'date-fns';
import { round } from './format';

export type Range = '24h' | '7d' | '30d';
export type Metric = 'pressure' | 'flow' | 'temp';

export interface HistoryPoint {
  label: string;
  value: number;
}

export const metricConfig: Record<Metric, {label: string;unit: string;band: [number, number];domain: [number, number];}> = {
  pressure: { label: 'Pressure', unit: 'hPa', band: [950, 1050], domain: [900, 1100] },
  flow: { label: 'Airflow', unit: 'L/min', band: [60, 160], domain: [0, 220] },
  temp: { label: 'Temperature', unit: '°C', band: [20, 38], domain: [18, 42] }
};

const rangeConfig: Record<Range, {points: number;stepH: number;fmt: string;}> = {
  '24h': { points: 48, stepH: 0.5, fmt: 'HH:mm' },
  '7d': { points: 84, stepH: 2, fmt: 'EEE HH:mm' },
  '30d': { points: 60, stepH: 12, fmt: 'MMM d' }
};

export function summarise(points: HistoryPoint[], band: [number, number]) {
  if (points.length === 0) return { avg: 0, min: 0, max: 0, outOfBand: 0 };
  const values = points.map((p) => p.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const out = values.filter((v) => v < band[0] || v > band[1]).length;
  return {
    avg: round(avg, 2),
    min: round(Math.min(...values), 2),
    max: round(Math.max(...values), 2),
    outOfBand: Math.round(out / values.length * 100)
  };
}