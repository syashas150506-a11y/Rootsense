import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

function resolveHostIp(): string {
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  // On Expo Go / dev builds running on physical devices, extract LAN IP from Metro hostUri
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return `http://${resolveHostIp()}:3001`;
}

function resolveDefaultFastApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_FASTAPI_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return `http://${resolveHostIp()}:8000`;
}

const FASTAPI_URL_STORAGE_KEY = '@rootsense_fastapi_url_v1';

export const API_BASE_URL = resolveBaseUrl();
let activeFastApiUrl = resolveDefaultFastApiUrl();

export function getFastApiBaseUrl(): string {
  return activeFastApiUrl;
}

export async function hydrateFastApiUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(FASTAPI_URL_STORAGE_KEY);
    if (saved && saved.trim()) {
      activeFastApiUrl = saved.trim().replace(/\/$/, '');
    }
  } catch {
    // keep default
  }
  return activeFastApiUrl;
}

export async function setFastApiBaseUrl(url: string): Promise<string> {
  const clean = url.trim().replace(/\/$/, '') || resolveDefaultFastApiUrl();
  activeFastApiUrl = clean;
  await AsyncStorage.setItem(FASTAPI_URL_STORAGE_KEY, clean).catch(() => {});
  return activeFastApiUrl;
}

async function requestAbsoluteJson<T>(
  fullUrl: string,
  options?: RequestInit,
  timeoutMs = 10000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${bodyText || res.statusText}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestJson<T>(
  path: string,
  options?: RequestInit,
  timeoutMs = 10000
): Promise<T> {
  return requestAbsoluteJson<T>(`${API_BASE_URL}${path}`, options, timeoutMs);
}

export interface FastApiReadingRecord {
  id?: number;
  device_id: string;
  temperature: number | null;
  humidity: number | null;
  soil_moisture: number | null;
  water_level?: number | null;
  water_level_cm?: number | null;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  recorded_at: string;
}

export const FastApiClient = {
  getHealth: () =>
    requestAbsoluteJson<{ message: string; status: string; database: string }>(
      `${activeFastApiUrl}/`,
      undefined,
      4000
    ),

  getLatest: () =>
    requestAbsoluteJson<{ latest_reading: FastApiReadingRecord[]; source?: string }>(
      `${activeFastApiUrl}/sensor-data/latest`,
      undefined,
      4500
    ),

  getHistory: (limit = 100) =>
    requestAbsoluteJson<{ readings: FastApiReadingRecord[]; source?: string }>(
      `${activeFastApiUrl}/sensor-data/history?limit=${limit}`,
      undefined,
      5000
    ),

  postSensorData: (payload: {
    device_id?: string;
    temperature?: number;
    humidity?: number;
    soil_moisture?: number;
    water_level?: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
  }) =>
    requestAbsoluteJson<{
      message: string;
      database_status: string;
      irrigation_status: string;
      data: FastApiReadingRecord;
    }>(
      `${activeFastApiUrl}/sensor-data`,
      {
        method: 'POST',
        body: JSON.stringify({
          device_id: payload.device_id || 'ROOTSENSE_001',
          ...payload,
        }),
      },
      6000
    ),
};

export interface ApiFarmRow {
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

export interface ApiDeviceRow {
  id: number;
  farm_id: number;
  device_id: string;
  wifi_ssid: string;
  status: string;
  signal_dbm: number;
  battery_pct: number;
  last_sync_at: string | null;
}

export interface ApiSoilReading {
  id: number;
  farm_id: number;
  device_id: string;
  moisture: number;
  soil_temp: number;
  humidity: number | null;
  timestamp: string;
}

export interface ApiDailyForecast {
  day: string;
  date: string;
  icon: 'sunny' | 'partly-sunny' | 'cloudy' | 'rainy';
  condition?: string;
  high: number;
  low: number;
  rain_mm: number;
  rain_prob: number;
  et0_mm?: number;
  uv_max?: number;
  wind_max_kmh?: number;
}

export interface ApiWeatherAnalysis {
  evapotranspiration_mm: number;
  evapotranspiration_level: 'Low' | 'Moderate' | 'High';
  vpd_kpa: number;
  heat_stress_risk: 'Low' | 'Moderate' | 'High';
  fungal_disease_risk: 'Low' | 'Moderate' | 'High';
  spray_window: 'Good' | 'Caution' | 'Avoid';
  spray_reason: string;
  next_24h_rain_mm: number;
  next_72h_rain_mm: number;
  summary: string;
}

export interface ApiWeather {
  temp: number;
  apparent_temp?: number;
  condition: string;
  icon?: 'sunny' | 'partly-sunny' | 'cloudy' | 'rainy';
  humidity: number;
  cloud_cover?: number;
  wind_speed: number;
  wind_speed_kmh?: number;
  uv_index?: number;
  rain_prob: number;
  rain_mm: number;
  location_name: string;
  latitude?: number;
  longitude?: number;
  source: 'open-meteo-live' | 'met-norway-live';
  forecast: ApiDailyForecast[];
  analysis?: ApiWeatherAnalysis;
  fetched_at: string;
}

export interface ApiSensorHealth {
  status: 'green' | 'yellow' | 'red' | 'gray';
  label: 'Online' | 'Delayed' | 'Offline' | 'No Data';
  last_seen: string | null;
  age_seconds: number | null;
  message: string;
}

export interface ApiCropStress {
  status: 'Healthy' | 'Moderate' | 'High' | 'Unknown';
  reason: string;
  note: string;
  thresholds: {
    lowCritical: number;
    lowWarn: number;
    highWarn: number;
  };
}

export interface ApiWaterRequirement {
  decision: 'YES' | 'WAIT' | 'MONITOR' | 'NO' | 'UNKNOWN';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  amount_mm: number | null;
  amount_litres: number | null;
  reason_codes: string[];
  advice: string;
}

export interface ApiTimeToStress {
  state: 'ALREADY_HIGH' | 'ALREADY_MODERATE' | 'INSUFFICIENT_DATA' | 'DRYING' | 'STABLE' | 'WETTING';
  current: number | null;
  hours_to_moderate: number | null;
  hours_to_high: number | null;
  slope_per_hour: number | null;
  readings_used: number;
  fit_quality: number | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_pct: number;
  rain_before: boolean;
  projection: Array<{ hours_ahead: number; moisture: number }>;
}

export interface ApiSensorSnapshot {
  device_id: string | null;
  moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  water_level: number | null;
  water_level_cm: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  timestamp: string | null;
}

export interface ApiDashboardResponse {
  farm: ApiFarmRow;
  device: ApiDeviceRow;
  latest: ApiSoilReading | null;
  sensorSnapshot?: ApiSensorSnapshot;
  sensorHealth: ApiSensorHealth;
  weather: ApiWeather;
  cropStress: ApiCropStress;
  waterRequirement: ApiWaterRequirement;
  timeToStress: ApiTimeToStress;
  unreadAlerts: number;
}

export interface ApiSoilHistoryResponse {
  readings: ApiSoilReading[];
  dailySummary: Array<{
    date: string;
    dayNum: string;
    avgMoisture: number;
  }>;
}

export interface ApiHeatmapResponse {
  state: 'OK' | 'INSUFFICIENT_DATA';
  moderate: number;
  high: number;
  rows: Array<{
    dayLabel: string;
    dateIso: string;
    slots: Array<{
      slot: string;
      avgMoisture: number | null;
      tone: 'empty' | 'critical' | 'warn' | 'optimal';
    }>;
  }>;
  driest_slot: string | null;
  insight: string;
}

export interface ApiAlertItem {
  id: string;
  code: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ApiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language?: string;
  created_at: string;
}

export interface ApiCropCriticalStage {
  stage_name: string;
  day_start: number;
  day_end: number;
  criticality: 'CRITICAL' | 'HIGH' | 'MODERATE';
  water_need: string;
  key_risk: string;
  action_tip: string;
}

export interface ApiSeedCalendar {
  crop: string;
  total_days_min: number;
  total_days_max: number;
  expected_yield: string;
  sowing_window: string;
  ideal_soil_temp: string;
  water_requirement_total: string;
  weather_advisory: string;
  stages: ApiCropCriticalStage[];
  source: 'gemini-ai-live' | 'agronomy-reference';
  model?: string;
}

export const RootSenseApi = {
  getDashboard: () => requestJson<ApiDashboardResponse>('/api/dashboard'),

  saveFarm: (payload: {
    farmer_name?: string;
    location?: string;
    crop_type?: string;
    soil_type?: string;
    growth_stage?: string;
    field_dimension?: number;
    field_unit?: string;
    irrigation_type?: string;
  }) =>
    requestJson<ApiFarmRow>('/api/farm', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  connectDevice: (payload: { wifi_ssid: string; device_id?: string }) =>
    requestJson<{ ok: boolean; device: ApiDeviceRow }>('/api/device/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSoilHistory: () => requestJson<ApiSoilHistoryResponse>('/api/soil/history'),

  getSoilHeatmap: (days = 7) => requestJson<ApiHeatmapResponse>(`/api/soil/heatmap?days=${days}`),

  postSoilReading: (moisture: number, soil_temp?: number, humidity?: number) =>
    requestJson<ApiSoilReading>('/api/soil/reading', {
      method: 'POST',
      body: JSON.stringify({ moisture, soil_temp, humidity }),
    }),

  getAlerts: () => requestJson<ApiAlertItem[]>('/api/alerts'),

  markAlertRead: (id: string) =>
    requestJson<{ id: string; read: boolean }>(`/api/alerts/${id}/read`, {
      method: 'POST',
    }),

  markAllAlertsRead: () =>
    requestJson<{ ok: boolean }>('/api/alerts/read-all', {
      method: 'POST',
    }),

  getSeedCalendar: (crop: string) =>
    requestJson<ApiSeedCalendar>(
      `/api/seed-calendar?crop=${encodeURIComponent(crop)}`,
      undefined,
      30000
    ),

  getAssistantStatus: () =>
    requestJson<{ configured: boolean; model: string }>('/api/assistant/status'),

  configureGeminiKey: (apiKey: string) =>
    requestJson<{ ok: boolean; error?: string; model: string }>('/api/assistant/config', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    }),

  getAssistantHistory: () => requestJson<ApiChatMessage[]>('/api/assistant/history'),

  clearAssistantHistory: () =>
    requestJson<{ ok: boolean }>('/api/assistant/history', {
      method: 'DELETE',
    }),

  sendAssistantChat: (message: string, language = 'en') =>
    requestJson<{
      reply: string;
      engine: 'gemini-live' | 'agronomy-grounded';
      model?: string;
      geminiError?: string;
      userMessage: ApiChatMessage;
      assistantMessage: ApiChatMessage;
    }>(
      '/api/assistant/chat',
      {
        method: 'POST',
        body: JSON.stringify({ message, language }),
      },
      45000
    ),
};
