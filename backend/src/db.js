const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/compressor';
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const telemetrySchema = new mongoose.Schema({
  deviceId: String,
  ts: Date,
  raw: mongoose.Schema.Types.Mixed,
  detection: mongoose.Schema.Types.Mixed,
  severity: mongoose.Schema.Types.Mixed,
  finance: mongoose.Schema.Types.Mixed,
  action: String,
});
const Telemetry = mongoose.model('Telemetry', telemetrySchema);

const repo = {
  async save(rec) {
    try {
      const doc = new Telemetry({ ...rec, ts: new Date(rec.ts) });
      await doc.save();
    } catch (e) {
      console.error('Failed to save to MongoDB:', e);
    }
  },
  async latest(id) {
    return await Telemetry.findOne({ deviceId: id }).sort({ ts: -1 }).lean();
  },
  async getHistory(id, limit = 200) {
    return await Telemetry.find({ deviceId: id }).sort({ ts: -1 }).limit(limit).lean();
  }
};

module.exports = { repo, Telemetry };
