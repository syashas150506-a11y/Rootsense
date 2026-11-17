import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { FarmRepo, getDbPath } from './db/database.js';
import {
  evaluateCropHealth,
  evaluateCropStress,
  evaluateSensorHealth,
  evaluateWaterRequirement,
  detectFallingFastMoisture,
} from './lib/agronomy.js';
import { computeTimeToStress } from './lib/timeToStress.js';
import { buildFieldHeatmap } from './lib/heatmap.js';
import { fetchKarnatakaWeather } from './lib/weather.js';
import {
  generateAssistantReply,
  getGeminiStatus,
  saveAndVerifyGeminiKey,
} from './lib/assistant.js';
import {
  syncFromFastApi,
  forwardToFastApi,
  getFastApiBridgeStatus,
} from './lib/fastapiBridge.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

// Helper to derive and persist field alerts when telemetry arrives
function syncFieldAlerts(farmId: number): void {
  const farm = FarmRepo.getActiveFarm();
  const readings = FarmRepo.getReadingHistory(farmId, 48);
  const latest = readings[readings.length - 1];
  if (!latest) return;

  const stress = evaluateCropStress(farm, latest, null);
  if (stress.status === 'High') {
    FarmRepo.insertAlert(farmId, {
      code: 'STRESS_HIGH',
      severity: 'critical',
      title: 'High crop water stress detected.',
      message: `Soil moisture (${latest.moisture}%) is below the ${stress.thresholds.lowCritical}% critical threshold for ${farm.crop_type}.`,
      params: { crop: farm.crop_type, moisture: latest.moisture },
    });
  } else if (stress.status === 'Moderate') {
    FarmRepo.insertAlert(farmId, {
      code: 'STRESS_MODERATE',
      severity: 'warning',
      title: 'Moderate water stress approaching.',
      message: `Soil moisture (${latest.moisture}%) has entered the warning zone (${stress.thresholds.lowWarn}%).`,
      params: { crop: farm.crop_type, moisture: latest.moisture },
    });
  }

  if (detectFallingFastMoisture(readings)) {
    FarmRepo.insertAlert(farmId, {
      code: 'FALLING_FAST',
      severity: 'warning',
      title: 'Soil moisture is decreasing rapidly.',
      message: 'A sharp moisture drop (>3.2%/hr) was detected in the last 4 hours.',
      params: { moisture: latest.moisture },
    });
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Root Sense Backend API',
    database: 'SQLite (node:sqlite)',
    db_path: getDbPath(),
    fastapi_bridge: getFastApiBridgeStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Unified Dashboard Endpoint for fast mobile hydration
app.get('/api/dashboard', async (_req, res) => {
  try {
    const farm = FarmRepo.getActiveFarm();
    await syncFromFastApi(farm.id, () => syncFieldAlerts(farm.id));
    const device = FarmRepo.getDevice(farm.id) || FarmRepo.upsertDevice(farm.id, {});
    const history = FarmRepo.getReadingHistory(farm.id, 48);
    const latest = history[history.length - 1];
    const weather = await fetchKarnatakaWeather(farm.location);
    const sensorHealth = evaluateSensorHealth(latest);
    const cropStress = evaluateCropStress(farm, latest, weather);
    const cropHealth = evaluateCropHealth(farm, history, weather);
    const waterRequirement = evaluateWaterRequirement(farm, latest, weather);
    const timeToStress = computeTimeToStress(farm, history, weather);
    const alerts = FarmRepo.getAlerts(farm.id, 50);

    res.json({
      farm,
      device,
      latest: latest || null,
      sensorHealth,
      weather,
      cropStress,
      cropHealth,
      waterRequirement,
      timeToStress,
      telemetryBridge: getFastApiBridgeStatus(),
      unreadAlerts: alerts.filter((a) => a.read === 0).length,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Farm Profile Routes
app.get('/api/farm', (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const device = FarmRepo.getDevice(farm.id);
  res.json({ ...farm, device_id: device?.device_id || 'RS-KA-01' });
});

app.post('/api/farm', (req, res) => {
  try {
    const body = req.body || {};
    const updated = FarmRepo.upsertFarm({
      farmer_name: body.farmer_name ?? body.name,
      location: body.location,
      crop_type: body.crop_type ?? body.cropGrown,
      soil_type: body.soil_type ?? body.soilType,
      growth_stage: body.growth_stage ?? body.growthStage,
      field_dimension:
        body.field_dimension !== undefined
          ? Number(body.field_dimension)
          : body.fieldDimension !== undefined
          ? Number(body.fieldDimension)
          : undefined,
      field_unit: body.field_unit ?? body.fieldUnit,
      irrigation_type: body.irrigation_type ?? body.irrigationType,
      sowing_date: body.sowing_date,
      language: body.language,
      appearance: body.appearance,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Device Provisioning & Status Routes
app.get('/api/device', (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const device = FarmRepo.getDevice(farm.id) || FarmRepo.upsertDevice(farm.id, {});
  const latest = FarmRepo.getLatestReading(farm.id);
  const sensorHealth = evaluateSensorHealth(latest);
  res.json({
    ...device,
    moisture: latest?.moisture ?? null,
    soil_temp: latest?.soil_temp ?? null,
    sensor_health: sensorHealth,
  });
});

app.post('/api/device/connect', (req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const body = req.body || {};
  const device = FarmRepo.upsertDevice(farm.id, {
    device_id: body.device_id || 'RS-KA-01',
    wifi_ssid: body.wifi_ssid || 'Farm_WiFi',
    status: 'Online',
    signal_dbm: typeof body.signal_dbm === 'number' ? body.signal_dbm : -62,
    battery_pct: typeof body.battery_pct === 'number' ? body.battery_pct : 94,
    last_sync_at: new Date().toISOString(),
  });
  res.json({ ok: true, device });
});

// Soil Telemetry Routes
app.get('/api/soil/latest', async (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  await syncFromFastApi(farm.id, () => syncFieldAlerts(farm.id));
  const latest = FarmRepo.getLatestReading(farm.id);
  const health = evaluateSensorHealth(latest);
  res.json({
    moisture: latest?.moisture ?? null,
    soil_temp: latest?.soil_temp ?? null,
    humidity: latest?.humidity ?? null,
    timestamp: latest?.timestamp ?? null,
    device_id: latest?.device_id ?? 'ROOTSENSE_001',
    sensor_status: health.status,
  });
});

app.get('/api/soil/history', (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const readings = FarmRepo.getReadingHistory(farm.id, 48);

  // Also compute 7-day daily averages for chart convenience
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const weekReadings = FarmRepo.getReadingsSince(farm.id, sevenDaysAgo);
  const byDay = new Map<string, number[]>();
  for (const r of weekReadings) {
    const dayKey = r.timestamp.slice(0, 10);
    const arr = byDay.get(dayKey) || [];
    arr.push(r.moisture);
    byDay.set(dayKey, arr);
  }

  const dailySummary = Array.from(byDay.entries())
    .slice(-7)
    .map(([date, vals]) => ({
      date,
      dayNum: date.slice(8, 10),
      avgMoisture: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
    }));

  res.json({
    readings,
    dailySummary,
  });
});

app.post('/api/soil/reading', async (req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const device = FarmRepo.getDevice(farm.id);
  const { moisture, soil_temp, humidity, timestamp, device_id } = req.body || {};

  const numMoisture = Number(moisture);
  if (moisture === undefined || Number.isNaN(numMoisture) || numMoisture < 0 || numMoisture > 100) {
    res.status(400).json({ error: 'moisture must be a valid number between 0 and 100' });
    return;
  }

  const roundedMoisture = Number(numMoisture.toFixed(1));
  const numTemp =
    soil_temp !== undefined && !Number.isNaN(Number(soil_temp))
      ? Number(Number(soil_temp).toFixed(1))
      : 27.0;
  const numHumidity =
    humidity !== undefined && humidity !== null && !Number.isNaN(Number(humidity))
      ? Number(Math.max(0, Math.min(100, Number(humidity))).toFixed(1))
      : null;

  let ts = new Date().toISOString();
  if (typeof timestamp === 'string' && !Number.isNaN(Date.parse(timestamp))) {
    ts = new Date(timestamp).toISOString();
  }

  const resolvedDeviceId =
    typeof device_id === 'string' && device_id.trim()
      ? device_id.trim()
      : device?.device_id || 'ROOTSENSE_001';

  const saved = FarmRepo.insertReading(
    farm.id,
    resolvedDeviceId,
    roundedMoisture,
    numTemp,
    ts,
    numHumidity
  );

  // Mirror to FastAPI / Supabase in background if FastAPI is running
  void forwardToFastApi({
    device_id: resolvedDeviceId,
    temperature: numTemp,
    humidity: numHumidity ?? 64.0,
    soil_moisture: roundedMoisture,
  });

  syncFieldAlerts(farm.id);
  res.status(201).json(saved);
});

// FastAPI-compatible hardware telemetry endpoint: POST /api/sensor-data & POST /sensor-data
const handleFastApiSensorPayload = (req: express.Request, res: express.Response) => {
  const farm = FarmRepo.getActiveFarm();
  const body = req.body || {};
  const numMoisture = Number(body.soil_moisture ?? body.moisture);
  const numTemp = Number(body.temperature ?? body.soil_temp ?? 27.0);
  const numHumidity =
    body.humidity !== undefined && body.humidity !== null ? Number(body.humidity) : null;

  if (Number.isNaN(numMoisture) || numMoisture < 0 || numMoisture > 100) {
    res.status(400).json({ error: 'soil_moisture must be between 0 and 100' });
    return;
  }

  const deviceId =
    typeof body.device_id === 'string' && body.device_id.trim()
      ? body.device_id.trim()
      : 'ROOTSENSE_001';
  const ts =
    typeof body.recorded_at === 'string' && !Number.isNaN(Date.parse(body.recorded_at))
      ? new Date(body.recorded_at).toISOString()
      : new Date().toISOString();

  const { inserted, row } = FarmRepo.insertReadingIfNew(
    farm.id,
    deviceId,
    Number(numMoisture.toFixed(1)),
    Number.isNaN(numTemp) ? 27.0 : Number(numTemp.toFixed(1)),
    ts,
    numHumidity !== null && !Number.isNaN(numHumidity)
      ? Number(Math.max(0, Math.min(100, numHumidity)).toFixed(1))
      : null
  );

  if (inserted) {
    syncFieldAlerts(farm.id);
  }

  res.status(201).json({
    message: 'Sensor data synced to Root Sense app backend',
    inserted,
    irrigation_status: numMoisture < 30 ? 'WATER NEEDED' : 'SOIL MOISTURE OK',
    data: row,
  });
};

app.post('/api/sensor-data', handleFastApiSensorPayload);
app.post('/sensor-data', handleFastApiSensorPayload);

app.get('/api/soil/heatmap', (req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const days = Math.max(1, Math.min(14, Number(req.query.days) || 7));
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const readings = FarmRepo.getReadingsSince(farm.id, since);
  const heatmap = buildFieldHeatmap(farm, readings, days);
  res.json(heatmap);
});

app.get('/api/sensor/health', (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const latest = FarmRepo.getLatestReading(farm.id);
  res.json(evaluateSensorHealth(latest));
});

// Weather Route (Live MET Norway)
app.get('/api/weather', async (_req, res) => {
  try {
    const farm = FarmRepo.getActiveFarm();
    const weather = await fetchKarnatakaWeather(farm.location);
    res.json(weather);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// Deterministic Agronomy Analytics Routes
app.get('/api/crop/stress', async (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const latest = FarmRepo.getLatestReading(farm.id);
  const weather = await fetchKarnatakaWeather(farm.location).catch(() => null);
  res.json(evaluateCropStress(farm, latest, weather));
});

app.get('/api/crop/health', async (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const readings = FarmRepo.getReadingHistory(farm.id, 48);
  const weather = await fetchKarnatakaWeather(farm.location).catch(() => null);
  res.json(evaluateCropHealth(farm, readings, weather));
});

app.get('/api/water/requirement', async (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const latest = FarmRepo.getLatestReading(farm.id);
  const weather = await fetchKarnatakaWeather(farm.location).catch(() => null);
  res.json(evaluateWaterRequirement(farm, latest, weather));
});

app.get('/api/crop/time-to-stress', async (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const readings = FarmRepo.getReadingHistory(farm.id, 48);
  const weather = await fetchKarnatakaWeather(farm.location).catch(() => null);
  res.json(computeTimeToStress(farm, readings, weather));
});

// Alerts Routes
app.get('/api/alerts', (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const rows = FarmRepo.getAlerts(farm.id, 50);
  res.json(
    rows.map((r) => ({
      id: String(r.id),
      code: r.code,
      severity: r.severity,
      title: r.title,
      message: r.message,
      read: r.read === 1,
      created_at: r.created_at,
    }))
  );
});

app.post('/api/alerts/:id/read', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid alert id' });
    return;
  }
  const updated = FarmRepo.markAlertRead(id);
  if (!updated) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  res.json({
    id: String(updated.id),
    read: updated.read === 1,
  });
});

app.post('/api/alerts/read-all', (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  FarmRepo.markAllAlertsRead(farm.id);
  res.json({ ok: true });
});

// AI Assistant Routes (with persistent SQL multi-turn history & live Gemini API)
app.get('/api/assistant/status', (_req, res) => {
  res.json(getGeminiStatus());
});

app.post('/api/assistant/config', async (req, res) => {
  const { apiKey } = req.body || {};
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    res.status(400).json({ ok: false, error: 'apiKey is required' });
    return;
  }
  const result = await saveAndVerifyGeminiKey(apiKey);
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

app.get('/api/assistant/history', (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  const messages = FarmRepo.getChatMessages(farm.id, 50);
  res.json(
    messages.map((m) => ({
      id: String(m.id),
      sender: m.sender,
      text: m.text,
      language: m.language,
      created_at: m.created_at,
    }))
  );
});

app.delete('/api/assistant/history', (_req, res) => {
  const farm = FarmRepo.getActiveFarm();
  FarmRepo.clearChatMessages(farm.id);
  res.json({ ok: true });
});

app.post('/api/assistant/chat', async (req, res) => {
  try {
    const farm = FarmRepo.getActiveFarm();
    const { message, language } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const lang = typeof language === 'string' && language.trim() ? language : farm.language || 'en';
    const cleanMsg = message.trim();

    // Fetch prior multi-turn chat history BEFORE inserting the new user message
    const priorHistory = FarmRepo.getChatMessages(farm.id, 24);

    // Persist user message in SQLite
    const userMsg = FarmRepo.insertChatMessage(farm.id, 'user', cleanMsg, lang);

    // Build complete grounded live field context
    const device = FarmRepo.getDevice(farm.id);
    const readings = FarmRepo.getReadingHistory(farm.id, 48);
    const latest = readings[readings.length - 1];
    const sensorHealth = evaluateSensorHealth(latest);
    const weather = await fetchKarnatakaWeather(farm.location).catch(() => null);
    const stress = evaluateCropStress(farm, latest, weather);
    const water = evaluateWaterRequirement(farm, latest, weather);
    const timeToStress = computeTimeToStress(farm, readings, weather);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
    const heatmap = buildFieldHeatmap(farm, FarmRepo.getReadingsSince(farm.id, sevenDaysAgo), 7);
    const activeAlerts = FarmRepo.getAlerts(farm.id, 20).filter((a) => a.read === 0);

    const { reply, engine, model, geminiError } = await generateAssistantReply(cleanMsg, lang, {
      farm,
      device,
      latest,
      sensorHealth,
      weather,
      stress,
      water,
      timeToStress,
      heatmap,
      activeAlerts,
      history: priorHistory,
    });

    // Persist assistant reply in SQLite
    const aiMsg = FarmRepo.insertChatMessage(farm.id, 'assistant', reply, lang);

    res.json({
      reply,
      engine,
      model,
      geminiError,
      userMessage: {
        id: String(userMsg.id),
        sender: userMsg.sender,
        text: userMsg.text,
        created_at: userMsg.created_at,
      },
      assistantMessage: {
        id: String(aiMsg.id),
        sender: aiMsg.sender,
        text: aiMsg.text,
        created_at: aiMsg.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌱 Root Sense Backend API running on http://localhost:${PORT}`);
  console.log(`🗄️  SQLite Database: ${getDbPath()}`);
  console.log(`📡 FastAPI Sensor Bridge: ${getFastApiBridgeStatus().url}`);
  console.log(
    `🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Live API Key Configured' : 'Deterministic Grounded Agronomy Fallback (set GEMINI_API_KEY in backend/.env for Gemini)'}\n`
  );

  // Initial sync + periodic 5s live hardware sensor sync from FastAPI
  const runBridgeSync = () => {
    const activeFarm = FarmRepo.getActiveFarm();
    void syncFromFastApi(activeFarm.id, () => syncFieldAlerts(activeFarm.id), true);
  };
  runBridgeSync();
  setInterval(runBridgeSync, 5000);
});
