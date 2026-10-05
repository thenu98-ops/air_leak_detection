import { useCallback, useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { socket } from '../socket';
import { alerts as initialAlerts } from '../data/alerts';
import type { Alert } from '../types/telemetry';

export interface AlertsState {
  items: Alert[];
  openCount: number;
  acknowledge: (id: string) => void;
  acknowledgeAll: () => void;
}

export function useAlerts(): AlertsState {
  const [items, setItems] = useState<Alert[]>(initialAlerts);
  const lastAlertTime = useRef<number>(0);

  useEffect(() => {
    const handleTelemetry = (rec: any) => {
      if (rec.detection?.leakDetected) {
        const now = Date.now();
        // Cooldown for new alerts (e.g. 1 minute)
        if (now - lastAlertTime.current > 60000) {
          lastAlertTime.current = now;
          const newAlert: Alert = {
            id: `leak-${now}`,
            severity: rec.severity?.level === 'CRITICAL' ? 'critical' : 'warning',
            title: 'Leak Detected',
            detail: rec.severity?.reason || 'Continuous pressure drop detected.',
            source: rec.deviceId || 'ESP32-01',
            time: format(now, 'HH:mm'),
            acknowledged: false,
          };
          setItems(prev => [newAlert, ...prev]);
        }
      }
    };
    socket.on('telemetry', handleTelemetry);
    return () => {
      socket.off('telemetry', handleTelemetry);
    };
  }, []);

  const acknowledge = useCallback((id: string) => {
    setItems((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const acknowledgeAll = useCallback(() => {
    setItems((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  }, []);

  return { items, openCount: items.filter((a) => !a.acknowledged).length, acknowledge, acknowledgeAll };
}