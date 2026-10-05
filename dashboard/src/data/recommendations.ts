import type { Recommendation } from '../types/telemetry';

export const recommendations: Recommendation[] = [
{
  id: 'RC-01',
  priority: 'high',
  title: 'Inspect pipeline downstream of the sensor for leaks',
  summary:
  'Airflow stays 3× above baseline overnight while pressure keeps dropping. This pattern matches a coupling or seal leak.',
  source: 'ESP32-01 · Main line',
  savings: 486,
  due: 'Within 48 h',
  confidence: 0.91,
  steps: [
  'Run an ultrasonic leak survey along the pipe, couplers and FRL units',
  'Replace worn couplers and seals found during the survey',
  'Confirm idle airflow returns below 0.6 m³/min']

},
{
  id: 'RC-02',
  priority: 'high',
  title: 'Lower compressor setpoint from 7.2 to 6.9 bar',
  summary: 'Measured pressure never needs to exceed 6.6 bar. Each 0.1 bar reduction saves about 0.7% compressor energy.',
  source: 'Compressor C-01',
  savings: 212,
  due: 'This week',
  confidence: 0.84,
  steps: [
  'Lower the setpoint in 0.1 bar steps during shift A',
  'Watch the pressure reading on ESP32-01 for 3 days',
  'Lock the new setpoint in the compressor controller']

},
{
  id: 'RC-03',
  priority: 'medium',
  title: 'Service dryer and aftercooler',
  summary: 'Line temperature is rising 1.2 °C per day. Warm air carries more moisture into the pipeline.',
  source: 'ESP32-01 · Main line',
  savings: 138,
  due: 'In 6 days',
  confidence: 0.78,
  steps: ['Clean the aftercooler fins', 'Replace dryer pre-filter', 'Check temperature returns below 32 °C']
},
{
  id: 'RC-04',
  priority: 'medium',
  title: 'Schedule compressor oil and separator service',
  summary: 'Compressor is at 3,788 running hours. Service is due at 4,000 h to keep efficiency.',
  source: 'Compressor C-01',
  savings: 96,
  due: 'In 212 run hours',
  confidence: 0.95,
  steps: ['Book service technician', 'Replace oil, oil filter and separator', 'Log service in the maintenance record']
},
{
  id: 'RC-05',
  priority: 'low',
  title: 'Switch off compressor outside shift hours',
  summary: 'Airflow of 0.6 m³/min continues after shift end with no production running.',
  source: 'ESP32-01 · Main line',
  savings: 254,
  due: 'Next month',
  confidence: 0.72,
  steps: ['Add a shift schedule to the compressor controller', 'Keep a minimum pressure for critical tools', 'Compare idle airflow after 1 week']
},
{
  id: 'RC-06',
  priority: 'low',
  title: 'Recalibrate airflow sensor on ESP32-01',
  summary: 'Readings drift 4% from compressor output estimates. This affects leak detection accuracy.',
  source: 'ESP32-01',
  savings: 0,
  due: 'Next month',
  confidence: 0.67,
  steps: ['Compare against a reference meter', 'Apply the new calibration factor over the air', 'Verify readings match']
}];