import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { resolveDistrictCoords } from '../lib/districts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FarmRow {
  id: number;
  farmer_name: string;
  location: string;
  latitude: number;
  longitude: number;
  crop_type: string;
  soil_type: string;
  growth_stage: string;
  field_dimension: number;
  field_unit: string;
  irrigation_type: string;
  sowing_date: string | null;
  language: string;
  appearance: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceRow {
  id: number;
  farm_id: number;
  device_id: string;
  wifi_ssid: string;
  status: string;
  signal_dbm: number;
  battery_pct: number;
  last_sync_at: string | null;
  created_at: string;
}

export interface SoilReadingRow {
  id: number;
  farm_id: number;
  device_id: string;
  moisture: number;
  soil_temp: number;
  timestamp: string;
}

export interface AlertRow {
  id: number;
  farm_id: number;
  code: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  params_json: string | null;
  read: number;
  created_at: string;
}

export interface ChatMessageRow {
  id: number;
  farm_id: number;
  sender: 'user' | 'assistant';
  text: string;
  language: string;
  created_at: string;
}

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'rootsense.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Run relational SQL schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schemaSql);

export function getDbPath(): string {
  return dbPath;
}

export function seedIfEmpty(): void {
  const existing = db.prepare('SELECT id FROM farms LIMIT 1').get() as { id: number } | undefined;
  if (existing) return;

  const now = new Date();
  const nowIso = now.toISOString();
  const coords = resolveDistrictCoords('Tumakuru, Karnataka');

  const farmResult = db
    .prepare(
      `INSERT INTO farms (
        farmer_name, location, latitude, longitude, crop_type, soil_type,
        growth_stage, field_dimension, field_unit, irrigation_type,
        sowing_date, language, appearance, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      'Ramesh Gowda',
      'Tumakuru, Karnataka',
      coords.latitude,
      coords.longitude,
      'Ragi',
      'Red Loam',
      'Vegetative',
      2.5,
      'Acres',
      'Drip',
      new Date(now.getTime() - 28 * 86400_000).toISOString().slice(0, 10),
      'en',
      'light',
      nowIso,
      nowIso
    );

  const farmId = Number(farmResult.lastInsertRowid);

  // Seed default ESP32 device
  db.prepare(
    `INSERT INTO devices (
      farm_id, device_id, wifi_ssid, status, signal_dbm, battery_pct, last_sync_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(farmId, 'RS-KA-01', 'Farm_WiFi', 'Online', -62, 94, nowIso, nowIso);

  // Seed 7 days of realistic soil readings (every 3 hours, plus recent hourly drying trend ending at 38.5%)
  const insertReadingStmt = db.prepare(
    `INSERT INTO soil_readings (farm_id, device_id, moisture, soil_temp, timestamp)
     VALUES (?, ?, ?, ?, ?)`
  );

  // 7-day historical points (days 6 down to 1 ago)
  const dayBaselines = [36.2, 39.4, 37.8, 43.1, 41.2, 40.3];
  for (let daysAgo = 6; daysAgo >= 1; daysAgo--) {
    const base = dayBaselines[6 - daysAgo];
    for (const hour of [6, 10, 14, 18, 22]) {
      const ts = new Date(now.getTime() - daysAgo * 86400_000);
      ts.setHours(hour, 0, 0, 0);
      // Midday afternoon is slightly drier
      const diurnalDip = hour === 14 ? -3.2 : hour === 10 ? -1.1 : hour === 18 ? -1.8 : 0.9;
      const moisture = Number(Math.max(20, Math.min(70, base + diurnalDip)).toFixed(1));
      const soilTemp = Number((25.5 + (hour === 14 ? 3.4 : hour === 18 ? 1.8 : 0.4)).toFixed(1));
      insertReadingStmt.run(farmId, 'RS-KA-01', moisture, soilTemp, ts.toISOString());
    }
  }

  // Last 12 hours: smooth realistic drying slope (-0.54%/hr) ending at 38.5% 45 seconds ago
  // For Ragi + Red Loam (lowWarn = 32%), (38.5 - 32) / 0.54 ≈ 12 hours until stress!
  const recentHours = [10, 8, 6, 4, 2, 1, 0];
  for (const hAgo of recentHours) {
    const ts =
      hAgo === 0
        ? new Date(now.getTime() - 45_000) // 45 seconds ago
        : new Date(now.getTime() - hAgo * 3600_000);
    const moisture = Number((38.5 + hAgo * 0.54).toFixed(1));
    const soilTemp = Number((27.0 + (hAgo % 2 === 0 ? 0.3 : -0.2)).toFixed(1));
    insertReadingStmt.run(farmId, 'RS-KA-01', moisture, soilTemp, ts.toISOString());
  }

  // Seed initial notifications
  const insertAlertStmt = db.prepare(
    `INSERT INTO alerts (farm_id, code, severity, title, message, params_json, read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertAlertStmt.run(
    farmId,
    'STRESS_SOON',
    'critical',
    'High crop water stress detected.',
    'Your soil moisture is approaching the stress threshold.',
    JSON.stringify({ crop: 'Ragi', moisture: 38.5, hours: 12 }),
    0,
    new Date(now.getTime() - 10 * 60_000).toISOString()
  );
  insertAlertStmt.run(
    farmId,
    'FALLING_FAST',
    'warning',
    'Soil moisture is decreasing rapidly.',
    'A steady moisture drop was observed over the last 6 hours.',
    JSON.stringify({ dropPct: 3.2, hours: 6 }),
    0,
    new Date(now.getTime() - 60 * 60_000).toISOString()
  );
  insertAlertStmt.run(
    farmId,
    'RAIN_WAIT',
    'info',
    'Rain expected within next 24 hours.',
    'Light to moderate rainfall is likely tomorrow. Consider delaying irrigation.',
    JSON.stringify({ rainProb: 20, rainMm: 2.4 }),
    0,
    new Date(now.getTime() - 3 * 3600_000).toISOString()
  );
  insertAlertStmt.run(
    farmId,
    'SENSOR_OFFLINE',
    'warning',
    'Your ESP32 device had a brief sync delay.',
    'Device RS-KA-01 reconnected cleanly over Farm_WiFi.',
    JSON.stringify({ deviceId: 'RS-KA-01' }),
    1,
    new Date(now.getTime() - 5 * 3600_000).toISOString()
  );

  // Seed initial AI assistant messages
  const insertChatStmt = db.prepare(
    `INSERT INTO chat_messages (farm_id, sender, text, language, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  insertChatStmt.run(
    farmId,
    'user',
    'Should I irrigate today?',
    'en',
    new Date(now.getTime() - 120_000).toISOString()
  );
  insertChatStmt.run(
    farmId,
    'assistant',
    'Based on your current soil moisture (38.5%) and the weather forecast (20% rain probability), you can wait. Rain is likely tomorrow, which may reduce the need for irrigation.',
    'en',
    new Date(now.getTime() - 115_000).toISOString()
  );
}

// Run seed on import so database is ready immediately
seedIfEmpty();

export const FarmRepo = {
  getActiveFarm(): FarmRow {
    let farm = db.prepare('SELECT * FROM farms ORDER BY id ASC LIMIT 1').get() as
      | FarmRow
      | undefined;
    if (!farm) {
      seedIfEmpty();
      farm = db.prepare('SELECT * FROM farms ORDER BY id ASC LIMIT 1').get() as unknown as FarmRow;
    }
    return farm;
  },

  upsertFarm(input: {
    farmer_name?: string;
    location?: string;
    crop_type?: string;
    soil_type?: string;
    growth_stage?: string;
    field_dimension?: number;
    field_unit?: string;
    irrigation_type?: string;
    sowing_date?: string | null;
    language?: string;
    appearance?: string;
  }): FarmRow {
    const current = this.getActiveFarm();
    const location = input.location?.trim() || current.location;
    const coords = resolveDistrictCoords(location);
    const updatedAt = new Date().toISOString();

    db.prepare(
      `UPDATE farms SET
        farmer_name = ?,
        location = ?,
        latitude = ?,
        longitude = ?,
        crop_type = ?,
        soil_type = ?,
        growth_stage = ?,
        field_dimension = ?,
        field_unit = ?,
        irrigation_type = ?,
        sowing_date = ?,
        language = ?,
        appearance = ?,
        updated_at = ?
      WHERE id = ?`
    ).run(
      input.farmer_name?.trim() || current.farmer_name,
      location,
      coords.latitude,
      coords.longitude,
      input.crop_type || current.crop_type,
      input.soil_type || current.soil_type,
      input.growth_stage || current.growth_stage,
      typeof input.field_dimension === 'number' && !Number.isNaN(input.field_dimension)
        ? input.field_dimension
        : current.field_dimension,
      input.field_unit || current.field_unit,
      input.irrigation_type || current.irrigation_type,
      input.sowing_date !== undefined ? input.sowing_date : current.sowing_date,
      input.language || current.language,
      input.appearance || current.appearance,
      updatedAt,
      current.id
    );

    return this.getActiveFarm();
  },

  getDevice(farmId: number): DeviceRow | undefined {
    return db
      .prepare('SELECT * FROM devices WHERE farm_id = ? ORDER BY id ASC LIMIT 1')
      .get(farmId) as DeviceRow | undefined;
  },

  upsertDevice(
    farmId: number,
    input: {
      device_id?: string;
      wifi_ssid?: string;
      status?: string;
      signal_dbm?: number;
      battery_pct?: number;
      last_sync_at?: string;
    }
  ): DeviceRow {
    const existing = this.getDevice(farmId);
    const nowIso = new Date().toISOString();

    if (existing) {
      db.prepare(
        `UPDATE devices SET
          device_id = ?,
          wifi_ssid = ?,
          status = ?,
          signal_dbm = ?,
          battery_pct = ?,
          last_sync_at = ?
        WHERE id = ?`
      ).run(
        input.device_id || existing.device_id,
        input.wifi_ssid || existing.wifi_ssid,
        input.status || existing.status,
        input.signal_dbm ?? existing.signal_dbm,
        input.battery_pct ?? existing.battery_pct,
        input.last_sync_at || nowIso,
        existing.id
      );
      return this.getDevice(farmId)!;
    }

    db.prepare(
      `INSERT INTO devices (
        farm_id, device_id, wifi_ssid, status, signal_dbm, battery_pct, last_sync_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      farmId,
      input.device_id || 'RS-KA-01',
      input.wifi_ssid || 'Farm_WiFi',
      input.status || 'Online',
      input.signal_dbm ?? -62,
      input.battery_pct ?? 94,
      input.last_sync_at || nowIso,
      nowIso
    );

    return this.getDevice(farmId)!;
  },

  insertReading(
    farmId: number,
    deviceId: string,
    moisture: number,
    soilTemp: number,
    timestamp: string
  ): SoilReadingRow {
    const res = db
      .prepare(
        `INSERT INTO soil_readings (farm_id, device_id, moisture, soil_temp, timestamp)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(farmId, deviceId, moisture, soilTemp, timestamp);

    // Update device last_sync_at & Online status
    db.prepare(
      `UPDATE devices SET status = 'Online', last_sync_at = ? WHERE farm_id = ?`
    ).run(timestamp, farmId);

    return db
      .prepare('SELECT * FROM soil_readings WHERE id = ?')
      .get(Number(res.lastInsertRowid)) as unknown as SoilReadingRow;
  },

  getLatestReading(farmId: number): SoilReadingRow | undefined {
    return db
      .prepare(
        'SELECT * FROM soil_readings WHERE farm_id = ? ORDER BY timestamp DESC, id DESC LIMIT 1'
      )
      .get(farmId) as SoilReadingRow | undefined;
  },

  getReadingHistory(farmId: number, limit = 48): SoilReadingRow[] {
    const rows = db
      .prepare(
        'SELECT * FROM soil_readings WHERE farm_id = ? ORDER BY timestamp DESC, id DESC LIMIT ?'
      )
      .all(farmId, limit) as unknown as SoilReadingRow[];
    return rows.reverse();
  },

  getReadingsSince(farmId: number, isoSince: string): SoilReadingRow[] {
    return db
      .prepare(
        'SELECT * FROM soil_readings WHERE farm_id = ? AND timestamp >= ? ORDER BY timestamp ASC'
      )
      .all(farmId, isoSince) as unknown as SoilReadingRow[];
  },

  getAlerts(farmId: number, limit = 50): AlertRow[] {
    return db
      .prepare(
        'SELECT * FROM alerts WHERE farm_id = ? ORDER BY created_at DESC, id DESC LIMIT ?'
      )
      .all(farmId, limit) as unknown as AlertRow[];
  },

  insertAlert(
    farmId: number,
    alert: {
      code: string;
      severity: 'critical' | 'warning' | 'info';
      title: string;
      message: string;
      params?: Record<string, unknown>;
    }
  ): AlertRow | null {
    // Avoid duplicating identical unread alert code within last 15 minutes
    const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
    const recent = db
      .prepare(
        'SELECT id FROM alerts WHERE farm_id = ? AND code = ? AND read = 0 AND created_at >= ? LIMIT 1'
      )
      .get(farmId, alert.code, cutoff) as { id: number } | undefined;

    if (recent) return null;

    const nowIso = new Date().toISOString();
    const res = db
      .prepare(
        `INSERT INTO alerts (farm_id, code, severity, title, message, params_json, read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
      )
      .run(
        farmId,
        alert.code,
        alert.severity,
        alert.title,
        alert.message,
        alert.params ? JSON.stringify(alert.params) : null,
        nowIso
      );

    return db
      .prepare('SELECT * FROM alerts WHERE id = ?')
      .get(Number(res.lastInsertRowid)) as unknown as AlertRow;
  },

  markAlertRead(alertId: number): AlertRow | undefined {
    db.prepare('UPDATE alerts SET read = 1 WHERE id = ?').run(alertId);
    return db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId) as
      | AlertRow
      | undefined;
  },

  markAllAlertsRead(farmId: number): void {
    db.prepare('UPDATE alerts SET read = 1 WHERE farm_id = ?').run(farmId);
  },

  getChatMessages(farmId: number, limit = 50): ChatMessageRow[] {
    return db
      .prepare(
        'SELECT * FROM chat_messages WHERE farm_id = ? ORDER BY id ASC LIMIT ?'
      )
      .all(farmId, limit) as unknown as ChatMessageRow[];
  },

  insertChatMessage(
    farmId: number,
    sender: 'user' | 'assistant',
    text: string,
    language = 'en'
  ): ChatMessageRow {
    const nowIso = new Date().toISOString();
    const res = db
      .prepare(
        `INSERT INTO chat_messages (farm_id, sender, text, language, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(farmId, sender, text, language, nowIso);

    return db
      .prepare('SELECT * FROM chat_messages WHERE id = ?')
      .get(Number(res.lastInsertRowid)) as unknown as ChatMessageRow;
  },

  clearChatMessages(farmId: number): void {
    db.prepare('DELETE FROM chat_messages WHERE farm_id = ?').run(farmId);
  },
};
