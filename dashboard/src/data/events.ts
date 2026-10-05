import type { HistoryEvent } from '../types/telemetry';

export const historyEvents: HistoryEvent[] = [
{ id: 'EV-1', date: 'Sep 24, 03:18', event: 'Pressure dropping fast', source: 'ESP32-01', duration: 'Ongoing', status: 'critical' },
{ id: 'EV-2', date: 'Sep 24, 02:10', event: 'Idle airflow above baseline', source: 'ESP32-01', duration: '1 h 20 min', status: 'warning' },
{ id: 'EV-3', date: 'Sep 23, 14:02', event: 'Pressure below normal range', source: 'ESP32-01', duration: '6 min', status: 'warning' },
{ id: 'EV-4', date: 'Sep 22, 09:40', event: 'Temperature above 35 °C', source: 'ESP32-01', duration: '12 min', status: 'warning' },
{ id: 'EV-5', date: 'Sep 20, 07:05', event: 'Leak repaired, airflow normalised', source: 'ESP32-01', duration: '—', status: 'normal' }];