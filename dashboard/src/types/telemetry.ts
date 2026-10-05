export type Status = 'normal' | 'warning' | 'critical';
export type View = 'monitoring' | 'leak_detection' | 'energy_maintenance' | 'history';

export interface TelemetryPoint {
  time: string;
  pressure: number;
  flow: number;
  temp: number;
}

export type Severity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  source: string;
  time: string;
  acknowledged: boolean;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  priority: Priority;
  title: string;
  summary: string;
  source: string;
  savings: number;
  due: string;
  confidence: number;
  steps: string[];
}

export interface HistoryEvent {
  id: string;
  date: string;
  event: string;
  source: string;
  duration: string;
  status: Status;
}