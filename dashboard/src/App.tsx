import React, { useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { AlertTriangleIcon } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Monitoring } from './pages/Monitoring';
import { History } from './pages/History';
import { LeakDetection } from './pages/LeakDetection';
import { EnergyMaintenance } from './pages/EnergyMaintenance';
import { useLiveTelemetry } from './hooks/useLiveTelemetry';
import type { View } from './types/telemetry';

export function App() {
  const [view, setView] = useState<View>('monitoring');
  const telemetry = useLiveTelemetry();

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen w-full bg-canvas font-sans text-ink">
        <Sidebar view={view} onChange={setView} openAlerts={telemetry.leakDetected ? 1 : 0} mqttConnected={telemetry.mqttConnected} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar 
            view={view} 
            onChange={setView} 
            latencyMs={telemetry.latencyMs} 
            serverConnected={telemetry.serverConnected}
            openAlerts={telemetry.leakDetected ? 1 : 0} 
          />
          <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
                
                {view === 'monitoring' && <Monitoring telemetry={telemetry} />}
                {view === 'leak_detection' && <LeakDetection telemetry={telemetry} />}
                {view === 'energy_maintenance' && <EnergyMaintenance telemetry={telemetry} />}
                {view === 'history' && <History />}
              </motion.div>
            </AnimatePresence>

            {/* Global Leak Alert Popup */}
            <AnimatePresence>
              {telemetry.leakDetected && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="fixed bottom-6 right-6 z-50 p-6 rounded-2xl shadow-2xl bg-danger text-white max-w-sm flex flex-col gap-2"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangleIcon size={32} />
                    <h3 className="text-xl font-bold">Leak Detected</h3>
                  </div>
                  <p className="opacity-90">A continuous pressure drop has been identified.</p>
                  {telemetry.severity && (
                    <div className="mt-2 p-3 bg-black/20 rounded-xl">
                      <p className="font-semibold text-lg">Severity: {telemetry.severity.level}</p>
                      <p className="text-sm opacity-80">{telemetry.severity.reason}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}