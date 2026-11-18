import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { FarmRepo } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_SENSE_DIR = path.resolve(__dirname, '../../../Root_sense');

export interface FastApiSensorRecord {
  device_id?: string;
  temperature?: number | null;
  humidity?: number | null;
  soil_moisture?: number | null;
  water_level?: number | null;
  water_level_cm?: number | null;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  recorded_at?: string;
}

export interface FastApiBridgeStatus {
  url: string;
  connected: boolean;
  source: string;
  last_sync_at: string | null;
  total_synced: number;
}

const FASTAPI_URL = (process.env.FASTAPI_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

let lastAttemptMs = 0;
let bridgeStatus: FastApiBridgeStatus = {
  url: FASTAPI_URL,
  connected: false,
  source: 'disconnected',
  last_sync_at: null,
  total_synced: 0,
};

export function getFastApiBridgeStatus(): FastApiBridgeStatus {
  return { ...bridgeStatus };
}

function readSupabaseConfig(): { url: string; key: string } | null {
  let url = (process.env.SUPABASE_URL || '').trim();
  let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !key) {
    const rootSenseEnv = path.join(ROOT_SENSE_DIR, '.env');
    if (fs.existsSync(rootSenseEnv)) {
      const content = fs.readFileSync(rootSenseEnv, 'utf-8');
      if (!url) url = content.match(/^SUPABASE_URL=(.+)$/m)?.[1]?.trim() || '';
      if (!key) key = content.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim() || '';
    }
  }

  return url && key ? { url: url.replace(/\/$/, ''), key } : null;
}

function ingestRecords(farmId: number, records: FastApiSensorRecord[]): number {
  let inserted = 0;
  for (const r of records) {
    const hasMoisture = typeof r.soil_moisture === 'number' && !Number.isNaN(r.soil_moisture);
    const hasTemp = typeof r.temperature === 'number' && !Number.isNaN(r.temperature);
    const hasHum = typeof r.humidity === 'number' && !Number.isNaN(r.humidity);
    const hasWater = typeof r.water_level === 'number' && !Number.isNaN(r.water_level);
    const hasNpk =
      typeof r.nitrogen === 'number' ||
      typeof r.phosphorus === 'number' ||
      typeof r.potassium === 'number';

    if (!hasMoisture && !hasTemp && !hasHum && !hasWater && !hasNpk) continue;

    const latestExisting = FarmRepo.getLatestReading(farmId);
    const moisture = hasMoisture
      ? Number(Math.max(0, Math.min(100, Number(r.soil_moisture))).toFixed(1))
      : latestExisting?.moisture ?? 0;
    const temp = hasTemp
      ? Number(Number(r.temperature).toFixed(1))
      : latestExisting?.soil_temp ?? 0;
    const humidity = hasHum
      ? Number(Math.max(0, Math.min(100, Number(r.humidity))).toFixed(1))
      : null;

    const deviceId =
      typeof r.device_id === 'string' && r.device_id.trim()
        ? r.device_id.trim()
        : 'ROOTSENSE_001';
    const ts =
      typeof r.recorded_at === 'string' && !Number.isNaN(Date.parse(r.recorded_at))
        ? new Date(r.recorded_at).toISOString()
        : new Date().toISOString();

    const resInsert = FarmRepo.insertReadingIfNew(farmId, deviceId, moisture, temp, ts, humidity, {
      water_level:
        typeof r.water_level === 'number' && !Number.isNaN(r.water_level)
          ? Number(Math.max(0, Math.min(100, r.water_level)).toFixed(1))
          : null,
      water_level_cm:
        typeof r.water_level_cm === 'number' && !Number.isNaN(r.water_level_cm)
          ? Number(r.water_level_cm.toFixed(1))
          : null,
      nitrogen:
        typeof r.nitrogen === 'number' && !Number.isNaN(r.nitrogen)
          ? Number(r.nitrogen.toFixed(1))
          : null,
      phosphorus:
        typeof r.phosphorus === 'number' && !Number.isNaN(r.phosphorus)
          ? Number(r.phosphorus.toFixed(1))
          : null,
      potassium:
        typeof r.potassium === 'number' && !Number.isNaN(r.potassium)
          ? Number(r.potassium.toFixed(1))
          : null,
    });
    if (resInsert.inserted) {
      inserted++;
    }
  }
  return inserted;
}

async function fetchFromSupabase(): Promise<FastApiSensorRecord[] | null> {
  const cfg = readSupabaseConfig();
  if (!cfg) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/sensor_readings?select=*&order=recorded_at.desc&limit=100`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as FastApiSensorRecord[];
    return Array.isArray(rows) ? [...rows].reverse() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function readDirectFastApiSqlite(): FastApiSensorRecord[] | null {
  const localDbPath = path.join(ROOT_SENSE_DIR, 'sensor_readings.db');
  if (!fs.existsSync(localDbPath)) return null;
  let conn: DatabaseSync | null = null;
  try {
    conn = new DatabaseSync(localDbPath, { open: true, readOnly: true });
    const rows = conn
      .prepare('SELECT * FROM sensor_readings ORDER BY recorded_at DESC, id DESC LIMIT 100')
      .all() as unknown as FastApiSensorRecord[];
    return rows.reverse();
  } catch {
    return null;
  } finally {
    try {
      conn?.close();
    } catch {
      // ignore
    }
  }
}

export async function syncFromFastApi(
  farmId: number,
  onNewReadings?: () => void,
  force = false
): Promise<{ inserted: number; connected: boolean }> {
  const nowMs = Date.now();
  if (!force && nowMs - lastAttemptMs < 1500) {
    return { inserted: 0, connected: bridgeStatus.connected };
  }
  lastAttemptMs = nowMs;

  // 1. Try FastAPI HTTP endpoint first (:8000)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${FASTAPI_URL}/sensor-data/history?limit=100`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = (await res.json()) as {
        readings?: FastApiSensorRecord[];
        source?: string;
      };
      const records = Array.isArray(json.readings) ? [...json.readings].reverse() : [];
      const inserted = ingestRecords(farmId, records);

      bridgeStatus = {
        url: FASTAPI_URL,
        connected: true,
        source: json.source || 'fastapi',
        last_sync_at: new Date().toISOString(),
        total_synced: bridgeStatus.total_synced + inserted,
      };
      if (inserted > 0 && onNewReadings) onNewReadings();
      return { inserted, connected: true };
    }
  } catch {
    // Fall through to Supabase / direct SQLite check
  } finally {
    clearTimeout(timer);
  }

  // 2. Try direct Supabase REST API if configured
  const supaRows = await fetchFromSupabase();
  if (supaRows !== null) {
    const inserted = ingestRecords(farmId, supaRows);
    bridgeStatus = {
      url: 'supabase-rest',
      connected: true,
      source: 'supabase',
      last_sync_at: new Date().toISOString(),
      total_synced: bridgeStatus.total_synced + inserted,
    };
    if (inserted > 0 && onNewReadings) onNewReadings();
    return { inserted, connected: true };
  }

  // 3. Fallback: read Root_sense/sensor_readings.db directly if FastAPI isn't started
  const directRows = readDirectFastApiSqlite();
  if (directRows !== null && directRows.length > 0) {
    const inserted = ingestRecords(farmId, directRows);
    bridgeStatus = {
      url: 'Root_sense/sensor_readings.db',
      connected: true,
      source: 'local-sqlite-file',
      last_sync_at: new Date().toISOString(),
      total_synced: bridgeStatus.total_synced + inserted,
    };
    if (inserted > 0 && onNewReadings) onNewReadings();
    return { inserted, connected: true };
  }

  bridgeStatus = { ...bridgeStatus, connected: false };
  return { inserted: 0, connected: false };
}

export async function forwardToFastApi(payload: {
  device_id: string;
  temperature?: number | null;
  humidity?: number | null;
  soil_moisture?: number | null;
  water_level?: number | null;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
}): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${FASTAPI_URL}/sensor-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
