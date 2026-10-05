const { round } = require('./helpers');

class FinancialTracker {
  constructor(cfg) { this.cfg = cfg; this.devices = new Map(); }

  _st(id, ts) {
    if (!this.devices.has(id)) this.devices.set(id, { rateLpm: 0, lastTs: ts, wastedL: 0, leakSeconds: 0 });
    return this.devices.get(id);
  }

  update(id, det, ts) {
    const st = this._st(id, ts);
    const dtMin = Math.max(0, (ts - st.lastTs) / 60000);
    st.wastedL += st.rateLpm * dtMin;
    if (st.rateLpm > 0) st.leakSeconds += dtMin * 60;
    st.lastTs = ts;
    if (det.testValid) st.rateLpm = det.leakDetected ? det.leakRateLpm : 0;
    return this.snapshot(id);
  }

  snapshot(id) {
    const { system: S, finance: F } = this.cfg;
    const st = this.devices.get(id);
    if (!st) return null;
    
    const runMin = st.wastedL / S.compressorFadLpm;
    const kWh = (runMin / 60) * S.compressorPowerKW;
    const lkr = kWh * F.tariffLkrPerKwh;
    
    const monthlyKwh = (st.rateLpm / S.compressorFadLpm) * S.compressorPowerKW * F.hoursPerMonth;
    return {
      currentLeakLpm: round(st.rateLpm, 3),
      wastedVolumeL: round(st.wastedL, 2),
      wastedRunTimeMin: round(runMin, 2),
      energyLossKWh: round(kWh, 4),
      financialLossLKR: round(lkr, 2),
      leakDurationMin: round(st.leakSeconds / 60, 1),
      projectedMonthlyKWh: round(monthlyKwh, 2),
      projectedMonthlyLKR: round(monthlyKwh * F.tariffLkrPerKwh, 2),
    };
  }
}

module.exports = { FinancialTracker };
