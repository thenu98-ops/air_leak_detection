import type { Alert } from '../types/telemetry';

export const alerts: Alert[] = [
{
  id: 'AL-1042',
  severity: 'critical',
  title: 'Pressure dropping fast',
  detail: 'Pressure fell 0.45 bar in 10 min while airflow stayed high. Possible leak downstream.',
  source: 'ESP32-01 · Main line',
  time: '4 min ago',
  acknowledged: false
},
{
  id: 'AL-1041',
  severity: 'warning',
  title: 'Night-time airflow above baseline',
  detail: '1.9 m³/min at 02:10 against a 0.6 m³/min idle baseline.',
  source: 'ESP32-01 · Main line',
  time: '3 h ago',
  acknowledged: false
},
{
  id: 'AL-1039',
  severity: 'warning',
  title: 'Line temperature rising',
  detail: 'Temperature trending +1.2 °C per day this week. Check dryer and aftercooler.',
  source: 'ESP32-01 · Main line',
  time: 'Today, 06:15',
  acknowledged: false
},
{
  id: 'AL-1036',
  severity: 'warning',
  title: 'Pressure below normal range',
  detail: '6.38 bar for 6 min (limit 6.50 bar). Returned to normal.',
  source: 'ESP32-01 · Main line',
  time: 'Yesterday, 14:02',
  acknowledged: true
},
{
  id: 'AL-1034',
  severity: 'info',
  title: 'Device reconnected',
  detail: 'MQTT session resumed after 18 s offline. No data lost (QoS 1).',
  source: 'ESP32-01',
  time: 'Yesterday, 22:47',
  acknowledged: true
},
{
  id: 'AL-1030',
  severity: 'info',
  title: 'Firmware update applied',
  detail: 'fw 2.3.1 installed over the air.',
  source: 'ESP32-01',
  time: '2 days ago',
  acknowledged: true
}];


export const alertThresholds = [
{ label: 'Pressure low', value: '< 6.50 bar' },
{ label: 'Pressure drop rate', value: '> 0.30 bar / 10 min' },
{ label: 'Airflow deviation from baseline', value: '> 15 %' },
{ label: 'Line temperature', value: '> 35 °C' },
{ label: 'Device offline', value: '> 60 s' }];