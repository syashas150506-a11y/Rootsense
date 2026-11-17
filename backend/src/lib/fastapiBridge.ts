import { FarmRepo } from '../db/database.js';

export interface FastApiSensorRecord {
  device_id?: string;
  temperature?: number;
  humidity?: number;
  soil_moisture?: number;
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

export async function syncFromFastApi(
  farmId: number,
  onNewReadings?: () => void,
  force = false
): Promise<{ inserted: number; connected: boolean }> {
  const nowMs = Date.now();
  if (!force && nowMs - lastAttemptMs < 2000) {
    return { inserted: 0, connected: bridgeStatus.connected };
  }
  lastAttemptMs = nowMs;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${FASTAPI_URL}/sensor-data/history?limit=100`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`FastAPI HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      readings?: FastApiSensorRecord[];
      source?: string;
    };

    const records = Array.isArray(json.readings) ? [...json.readings].reverse() : [];
    let inserted = 0;

    for (const r of records) {
      if (typeof r.soil_moisture !== 'number' || Number.isNaN(r.soil_moisture)) continue;
      const moisture = Number(Math.max(0, Math.min(100, r.soil_moisture)).toFixed(1));
      const temp =
        typeof r.temperature === 'number' && !Number.isNaN(r.temperature)
          ? Number(r.temperature.toFixed(1))
          : 27.0;
      const humidity =
        typeof r.humidity === 'number' && !Number.isNaN(r.humidity)
          ? Number(Math.max(0, Math.min(100, r.humidity)).toFixed(1))
          : null;
      const deviceId =
        typeof r.device_id === 'string' && r.device_id.trim()
          ? r.device_id.trim()
          : 'ROOTSENSE_001';
      const ts =
        typeof r.recorded_at === 'string' && !Number.isNaN(Date.parse(r.recorded_at))
          ? new Date(r.recorded_at).toISOString()
          : new Date().toISOString();

      const resInsert = FarmRepo.insertReadingIfNew(
        farmId,
        deviceId,
        moisture,
        temp,
        ts,
        humidity
      );
      if (resInsert.inserted) {
        inserted++;
      }
    }

    bridgeStatus = {
      url: FASTAPI_URL,
      connected: true,
      source: json.source || 'fastapi',
      last_sync_at: new Date().toISOString(),
      total_synced: bridgeStatus.total_synced + inserted,
    };

    if (inserted > 0 && onNewReadings) {
      onNewReadings();
    }

    return { inserted, connected: true };
  } catch {
    bridgeStatus = {
      ...bridgeStatus,
      connected: false,
    };
    return { inserted: 0, connected: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function forwardToFastApi(payload: {
  device_id: string;
  temperature: number;
  humidity: number;
  soil_moisture: number;
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
