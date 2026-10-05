const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
require('dotenv').config({ path: require('path').join(__dirname, '../../dashboard/atlas-credentials.env') });

const CFG = require('./config');
const { repo } = require('./db');
const { LeakDetectionEngine, classifySeverity } = require('./engine');
const { FinancialTracker } = require('./finance');
const { AlertManager, ACTION } = require('./alerts');

const engine = new LeakDetectionEngine(CFG);
const finance = new FinancialTracker(CFG);
const alerts = new AlertManager(CFG);

// MQTT topic the backend publishes leak commands to (ESP32 subscribes to this)
const COMMAND_TOPIC = 'sensor/command';

// Track per-device leak state so we only publish when it changes
const lastLeakState = new Map();

const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.get('/api/status/:id', async (req, res) => {
  const data = await repo.latest(req.params.id);
  res.json(data || {});
});

app.get('/api/history/:id', async (req, res) => {
  const data = await repo.getHistory(req.params.id, 200);
  res.json(data.reverse());
});

let mqttConnected = false;

io.on('connection', (socket) => {
  socket.emit('mqtt_status', { connected: mqttConnected });
});

const client = mqtt.connect(CFG.mqtt.url);
client.on('connect', () => { 
  mqttConnected = true;
  io.emit('mqtt_status', { connected: true });
  client.subscribe(CFG.mqtt.topic); 
  console.log('MQTT connected'); 
});

client.on('offline', () => {
  mqttConnected = false;
  io.emit('mqtt_status', { connected: false });
  console.log('MQTT offline');
});

client.on('error', (err) => {
  mqttConnected = false;
  io.emit('mqtt_status', { connected: false, error: err.message });
  console.error('MQTT error:', err);
});

client.on('message', async (topic, payload) => {
  // Ignore messages on the command topic (we publish those, not consume them)
  if (topic === COMMAND_TOPIC) return;

  let rawMsg;
  try { rawMsg = JSON.parse(payload.toString()); } catch { return; }

  let msg = {};
  if (rawMsg.device_id && rawMsg.pressure !== undefined) {
    msg = {
      deviceId: rawMsg.device_id,
      ts: Date.now(),
      pressure_kPa: rawMsg.pressure / 10,
      temp_C: rawMsg.temperature,
      flow_Lpm: rawMsg.airflow,
      pumpOn: false,
      emergencyStop: false
    };
  } else {
    msg = rawMsg;
    msg.deviceId = topic.split('/')[1] || 'unknown';
    msg.ts = msg.ts || Date.now();
  }

  if (!Number.isFinite(msg.pressure_kPa) || !Number.isFinite(msg.temp_C)) return;

  const detection = engine.ingest(msg);
  const severity = classifySeverity(detection, msg);
  const fin = finance.update(msg.deviceId, detection, msg.ts);
  const rec = {
    deviceId: msg.deviceId, ts: msg.ts, raw: msg,
    detection, severity, finance: fin, action: ACTION[severity.level],
  };

  try {
    await repo.save(rec);
    io.emit('telemetry', rec);
    await alerts.handle(rec);

    // --- Publish leak state back to ESP32 via MQTT ---
    // Only publish when the state changes to avoid flooding the broker
    const currentLeak = detection.leakDetected || false;
    const prevLeak = lastLeakState.get(msg.deviceId) || false;

    if (currentLeak !== prevLeak) {
      lastLeakState.set(msg.deviceId, currentLeak);
      const command = JSON.stringify({
        device_id: msg.deviceId,
        leakDetected: currentLeak,
        severity: severity.level,
        ts: Date.now()
      });
      client.publish(COMMAND_TOPIC, command, { qos: 1 }, (err) => {
        if (err) {
          console.error('Failed to publish leak command:', err);
        } else {
          console.log(`Published leak command to ${COMMAND_TOPIC}: leakDetected=${currentLeak}`);
        }
      });
    }
  } catch (e) { console.error('pipeline error', e); }
});

server.listen(process.env.PORT || 3000, () => console.log('Dashboard API on :' + (process.env.PORT || 3000)));
