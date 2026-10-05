import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { socket } from '../socket';
import type { TelemetryPoint } from '../types/telemetry';
import { round } from '../utils/format';

const WINDOW = 40;

export interface LiveTelemetry {
  points: TelemetryPoint[];
  latest: TelemetryPoint;
  previous: TelemetryPoint;
  latencyMs: number;
  messages: number;
  financialLossLKR: number;
  energyLossKWh: number;
  serverConnected: boolean;
  mqttConnected: boolean;
  leakDetected: boolean;
  severity: any;
  action: string;
  leakRateLpm: number;
}

export function useLiveTelemetry(): LiveTelemetry {
  const initialPoints = Array.from({ length: WINDOW }).map((_, i) => ({
    time: '', pressure: 0, flow: 0, temp: 0
  }));
  const [points, setPoints] = useState<TelemetryPoint[]>(initialPoints);
  const [latencyMs, setLatencyMs] = useState(0);
  const [messages, setMessages] = useState(0);
  const [financialLossLKR, setFinancialLossLKR] = useState(0);
  const [energyLossKWh, setEnergyLossKWh] = useState(0);
  const [serverConnected, setServerConnected] = useState(socket.connected);
  const [mqttConnected, setMqttConnected] = useState(false);
  const sensorTimeout = useRef<any>(null);
  const [leakDetected, setLeakDetected] = useState(false);
  const [severity, setSeverity] = useState<any>(null);
  const [action, setAction] = useState<string>('');
  const [leakRateLpm, setLeakRateLpm] = useState<number>(0);

  useEffect(() => {
    // Fetch initial history
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    fetch(`${BACKEND_URL}/api/history/esp32-01`)
      .then(res => res.json())
      .then((history: any[]) => {
        const pts = history.map((rec) => ({
          time: format(new Date(rec.ts), 'HH:mm:ss'),
          pressure: round((rec.detection?.pressureKPa || 0) * 10, 0), // kPa to hPa
          flow: round(rec.raw?.flow_Lpm || 0, 2),
          temp: round(rec.raw?.temp_C || 0, 1),
        })).slice(-WINDOW);
        setPoints(pts);
      })
      .catch(console.error);

    // Listen to live telemetry
    const handleTelemetry = (rec: any) => {
      setMqttConnected(true);
      if (sensorTimeout.current) clearTimeout(sensorTimeout.current);
      sensorTimeout.current = setTimeout(() => {
        setMqttConnected(false);
      }, 5000);

      setMessages((m) => m + 1);
      setLatencyMs(Date.now() - new Date(rec.ts).getTime());

      
      if (rec.finance) {
        setFinancialLossLKR(rec.finance.financialLossLKR || 0);
        setEnergyLossKWh(rec.finance.energyLossKWh || 0);
      }
      
      if (rec.detection) {
        setLeakDetected(rec.detection.leakDetected || false);
        setLeakRateLpm(rec.detection.leakRateLpm || 0);
      }
      
      if (rec.severity) {
        setSeverity(rec.severity);
      }
      
      if (rec.action) {
        setAction(rec.action);
      }

      setPoints((prev) => {
        const nextPoint = {
          time: format(new Date(rec.ts), 'HH:mm:ss'),
          pressure: round((rec.detection?.pressureKPa || 0) * 10, 0), // kPa to hPa
          flow: round(rec.raw?.flow_Lpm || 0, 2),
          temp: round(rec.raw?.temp_C || 0, 1),
        };
        const next = [...prev, nextPoint];
        if (next.length > WINDOW) return next.slice(next.length - WINDOW);
        return next;
      });
    };

    const onConnect = () => setServerConnected(true);
    const onDisconnect = () => {
      setServerConnected(false);
      setMqttConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('telemetry', handleTelemetry);
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('telemetry', handleTelemetry);
      if (sensorTimeout.current) clearTimeout(sensorTimeout.current);
    };
  }, []);

  const fallbackPoint: TelemetryPoint = { time: '', pressure: 0, flow: 0, temp: 0 };
  return { 
    points, 
    latest: points[points.length - 1] || fallbackPoint, 
    previous: points[points.length - 2] || fallbackPoint, 
    latencyMs, 
    messages,
    financialLossLKR,
    serverConnected,
    mqttConnected,
    energyLossKWh,
    leakDetected,
    severity,
    action,
    leakRateLpm
  };
}