const RANK = { NONE: 0, MINOR: 1, MODERATE: 2, SEVERE: 3, CRITICAL: 4 };
const ACTION = {
  NONE: 'Healthy',
  MINOR: 'Log and monitor; check fittings at next service',
  MODERATE: 'Schedule maintenance: soap-test joints and fittings',
  SEVERE: 'Repair promptly; reduce use of the system',
  CRITICAL: 'Shut down and depressurise; inspect immediately',
};

class AlertManager {
  constructor(cfg) {
    this.cfg = cfg; 
    this.last = new Map();
  }

  async handle(rec) {
    const lvl = rec.severity.level;
    const key = rec.deviceId;
    const prev = this.last.get(key) || { rank: 0, ts: 0 };
    const escalated = RANK[lvl] > prev.rank;
    
    if (RANK[lvl] > RANK.NONE) {
      this.last.set(key, { rank: RANK[lvl], ts: rec.ts });
      // Alerts are only pushed to the dashboard via websockets
    }
  }
}

module.exports = { AlertManager, ACTION, RANK };
