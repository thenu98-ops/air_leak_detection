const CFG = require('./config');
const { round, linearFit, compensate } = require('./helpers');

class LeakDetectionEngine {
  constructor(cfg) { this.cfg = cfg; this.devices = new Map(); }

  _state(id) {
    if (!this.devices.has(id)) {
      this.devices.set(id, {
        samples: [], pumpOffSince: null, prevPumpOn: null, confirmCount: 0,
        cycle: { startTs: null, startP: null, secPerKPa: [], baseline: null, lastRatio: null },
      });
    }
    return this.devices.get(id);
  }

  ingest(msg) {
    const { detection: D } = this.cfg;
    const s = this._state(msg.deviceId);
    const ts = msg.ts || Date.now();
    // Use raw pressure without temperature compensation as requested
    const pRaw = msg.pressure_kPa;

    s.samples.push({ ts, p: pRaw, flow: msg.flow_Lpm || 0 });
    const cutoff = ts - D.windowSec * 1000;
    while (s.samples.length && s.samples[0].ts < cutoff) s.samples.shift();

    return this._evaluate(s, msg, ts, pRaw);
  }

  _evaluate(s, msg, ts, pRaw) {
    const D = this.cfg.detection, S = this.cfg.system;
    const out = {
      deviceId: msg.deviceId, ts, pressureKPa: round(pRaw), tempC: msg.temp_C,
      testValid: false, leakDetected: false, confidence: 0,
      slopeHPaPerSec: null, r2: null, leakRateLpm: 0,
      decayLeakLpm: 0, flowLeakLpm: 0,
      indicators: { decay: false },
    };

    const span = s.samples.length > 1 ? s.samples[s.samples.length - 1].ts - s.samples[0].ts : 0;
    const valid = s.samples.length >= D.minSamples &&
                  span >= D.windowSec * 1000 * 0.6 && pRaw >= D.minTestPressureKPa;
    
    // Debug print valid state to help user diagnose if 0.000 is because it's invalid
    if (!valid && s.samples.length > 0) {
        console.log(`[Leak Engine Debug] Waiting for valid window... Samples: ${s.samples.length}/${D.minSamples} | Span: ${span}ms | Pressure: ${pRaw}kPa`);
    }
                  
    out.testValid = valid;

    if (valid) {
      const t0 = s.samples[0].ts;
      // x in seconds, y in hPa
      const { slope, r2 } = linearFit(s.samples.map(a => ({ x: (a.ts - t0) / 1000, y: a.p * 10 })));
      out.slopeHPaPerSec = round(slope, 3);
      out.r2 = round(r2, 3);
      
      const dropRate = slope < 0 ? Math.abs(slope) : 0;
      const isLeakDrop = dropRate > D.leakThresholdHPaPerSec && dropRate <= D.usageThresholdHPaPerSec;
      
      // Debug print for threshold tuning
      console.log(`[Leak Engine Debug] Raw Slope: ${round(slope, 3)} hPa/sec | DropRate: ${round(dropRate, 3)} hPa/sec | R2: ${round(r2, 3)} | Leak Threshold: ${D.leakThresholdHPaPerSec} | Usage Threshold: ${D.usageThresholdHPaPerSec} | IsLeakZone: ${isLeakDrop}`);
      
      out.indicators.decay = isLeakDrop && r2 >= D.minR2;
      
      if (out.indicators.decay) {
        const excessDropRateHPaSec = dropRate - D.leakThresholdHPaPerSec;
        // Convert hPa/sec to kPa/min for the LPM calculation
        const excessDropRateKPaMin = excessDropRateHPaSec * 6;
        out.decayLeakLpm = S.tankVolumeL * excessDropRateKPaMin / S.atmKPa;
      }

      if (out.indicators.decay) s.confirmCount++; else s.confirmCount = 0;
      const confirmed = s.confirmCount >= D.confirmWindows;
      
      out.leakDetected = confirmed;
      out.leakRateLpm = confirmed ? out.decayLeakLpm : 0;
      out.confidence = round(Math.min(1, out.indicators.decay ? 0.5 * Math.min(1, r2) : 0), 2);
    }
    return out;
  }
}

function classifySeverity(det, msg, cfg = CFG) {
  if (msg.emergencyStop) {
    return { level: 'CRITICAL', leakPct: null, timeToEmptyMin: 0,
             reason: 'ESP32 emergency stop (rapid pressure loss)' };
  }
  if (!det.leakDetected) return { level: 'NONE', leakPct: 0, timeToEmptyMin: null, reason: 'No leak' };

  const leakPct = (det.leakRateLpm / cfg.system.compressorFadLpm) * 100;
  // det.slopeHPaPerSec is negative during a leak. Convert hPa/sec to kPa/min for time estimation.
  const slopeKPaMin = det.slopeHPaPerSec * 6;
  const timeToEmptyMin = slopeKPaMin < 0 ? det.pressureKPa / Math.abs(slopeKPaMin) : null;
  return {
    level: tier.level,
    leakPct: round(leakPct, 1),
    timeToEmptyMin: round(timeToEmptyMin, 0),
    reason: `Leak ${round(det.leakRateLpm, 3)} L/min = ${round(leakPct, 1)}% of compressor capacity`,
  };
}

module.exports = { LeakDetectionEngine, classifySeverity };
