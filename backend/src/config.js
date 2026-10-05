const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');
let config = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.warn('config.json not found, using defaults');
}

const CFG = {
  mqtt: { 
    url: process.env.MQTT_URL || 'mqtts://sliit:sliit@ha372312.ala.us-east-1.emqxsl.com:8883', 
    topic: 'sensor/data' 
  },
  system: {
    tankVolumeL: config.tank_volume_L || 1.5,
    atmKPa: 101.325,
    tRefC: 20,
    compressorFadLpm: config.compressor_fad_Lpm || 10,
    compressorPowerKW: config.rated_kW || 1.5,
    sensorMaxKPa: 1200,
  },
  detection: {
    windowSec: 120,
    minSamples: 10,
    minTestPressureKPa: 90,
    minR2: 0.85,
    decayThresholdKPaPerMin: config.normal_drop_rate_kPa_min || 0.5,
    confirmWindows: 3,
  },
  severity: [
    { level: 'CRITICAL', minPct: 30 },
    { level: 'SEVERE',   minPct: 15 },
    { level: 'MODERATE', minPct: 5 },
    { level: 'MINOR',    minPct: 0 },
  ],
  finance: {
    tariffLkrPerKwh: config.electricity_unit_price || 40,
    hoursPerMonth: 730,
  },
};

module.exports = CFG;
