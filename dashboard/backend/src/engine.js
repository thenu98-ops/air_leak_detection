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
    const pComp = Number.isFinite(msg.pressure_comp_kPa)
      ? msg.pressure_comp_kPa
      : compensate(msg.pressure_kPa, msg.temp_C);

    s.samples.push({ ts, p: pComp, flow: msg.flow_Lpm || 0 });
    const cutoff = ts - D.windowSec * 1000;
    while (s.samples.length && s.samples[0].ts < cutoff) s.samples.shift();

    return this._evaluate(s, msg, ts, pComp);
  }

  _evaluate(s, msg, ts, pComp) {
    const D = this.cfg.detection, S = this.cfg.system;
    const out = {
      deviceId: msg.deviceId, ts, pressureKPa: round(pComp), tempC: msg.temp_C,
      testValid: false, leakDetected: false, confidence: 0,
      slopeKPaPerMin: null, r2: null, leakRateLpm: 0,
      decayLeakLpm: 0, flowLeakLpm: 0,
      indicators: { decay: false },
    };

    const span = s.samples.length > 1 ? s.samples[s.samples.length - 1].ts - s.samples[0].ts : 0;
    const valid = s.samples.length >= D.minSamples &&
                  span >= D.windowSec * 1000 * 0.6 && pComp >= D.minTestPressureKPa;
    out.testValid = valid;

    if (valid) {
      const t0 = s.samples[0].ts;
      const { slope, r2 } = linearFit(s.samples.map(a => ({ x: (a.ts - t0) / 60000, y: a.p })));
      out.slopeKPaPerMin = round(slope, 3);
      out.r2 = round(r2, 3);
      
      out.indicators.decay = slope < -D.decayThresholdKPaPerMin && r2 >= D.minR2;
      
      if (out.indicators.decay) {
        const excessDropRate = Math.abs(slope) - D.decayThresholdKPaPerMin;
        out.decayLeakLpm = S.tankVolumeL * excessDropRate / S.atmKPa;
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
  const tier = cfg.severity.find(t => leakPct >= t.minPct);
  const timeToEmptyMin = det.slopeKPaPerMin < 0 ? det.pressureKPa / Math.abs(det.slopeKPaPerMin) : null;
  return {
    level: tier.level,
    leakPct: round(leakPct, 1),
    timeToEmptyMin: round(timeToEmptyMin, 0),
    reason: `Leak ${round(det.leakRateLpm, 3)} L/min = ${round(leakPct, 1)}% of compressor capacity`,
  };
}

module.exports = { LeakDetectionEngine, classifySeverity };
