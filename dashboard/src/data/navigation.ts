import { ActivityIcon, AlertTriangleIcon, HistoryIcon, ZapIcon, SettingsIcon } from 'lucide-react';
import type { View } from '../types/telemetry';

export const navItems: {id: View;label: string;icon: typeof ActivityIcon;}[] = [
  { id: 'monitoring', label: 'Live Monitoring', icon: ActivityIcon },
  { id: 'leak_detection', label: 'Leak Detection', icon: AlertTriangleIcon },
  { id: 'energy_maintenance', label: 'Energy & Maintenance', icon: ZapIcon },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'configuration', label: 'Configurations', icon: SettingsIcon }
];