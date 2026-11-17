import type { FarmRow, SoilReadingRow } from '../db/database.js';
import type { WeatherPayload } from './weather.js';

export interface Thresholds {
  lowCritical: number;
  lowWarn: number;
  highWarn: number;
}

const CROP_BASE_THRESHOLDS: Record<string, Thresholds> = {
  Ragi: { lowCritical: 22, lowWarn: 32, highWarn: 75 },
  Maize: { lowCritical: 28, lowWarn: 40, highWarn: 80 },
  Tomato: { lowCritical: 35, lowWarn: 48, highWarn: 82 },
  Paddy: { lowCritical: 48, lowWarn: 62, highWarn: 94 },
};

const STAGE_OFFSETS: Record<string, number> = {
  Early: 2,
  Vegetative: 0,
  'Flowering/Fruiting': 5,
};

const SOIL_OFFSETS: Record<string, number> = {
  'Red Loam': 0,
  'Black Cotton': 4,
  Laterite: -2,
  'Sandy Loam': -3,
  'Clay Loam': 3,
};

export function getEffectiveThresholds(
  cropType: string,
  soilType: string,
  growthStage = 'Vegetative'
): Thresholds {
  const base = CROP_BASE_THRESHOLDS[cropType] || { lowCritical: 28, lowWarn: 38, highWarn: 80 };
  const stageOffset = STAGE_OFFSETS[growthStage] ?? 0;
  const soilOffset = SOIL_OFFSETS[soilType] ?? 0;
  const totalOffset = stageOffset + soilOffset;

  return {
    lowCritical: Math.max(10, Math.min(80, base.lowCritical + totalOffset)),
    lowWarn: Math.max(15, Math.min(88, base.lowWarn + totalOffset)),
    highWarn: Math.max(60, Math.min(98, base.highWarn + soilOffset)),
  };
}

export function toAcres(dimension: number, unit: string): number {
  if (!dimension || dimension <= 0) return 0;
  switch (unit) {
    case 'Hectares':
      return dimension * 2.47105;
    case 'Gunthas':
      return dimension / 40;
    case 'Sq. Meters':
      return dimension / 4046.86;
    case 'Acres':
    default:
      return dimension;
  }
}

export interface SensorHealthResult {
  status: 'green' | 'yellow' | 'red' | 'gray';
  label: 'Online' | 'Delayed' | 'Offline' | 'No Data';
  last_seen: string | null;
  age_seconds: number | null;
  message: string;
}

export function evaluateSensorHealth(latest?: SoilReadingRow): SensorHealthResult {
  if (!latest) {
    return {
      status: 'gray',
      label: 'No Data',
      last_seen: null,
      age_seconds: null,
      message: 'No soil moisture readings received yet.',
    };
  }

  const ageMs = Math.max(0, Date.now() - new Date(latest.timestamp).getTime());
  const ageSec = Math.round(ageMs / 1000);
  const ageMin = ageMs / 60_000;

  if (ageMin <= 2) {
    return {
      status: 'green',
      label: 'Online',
      last_seen: latest.timestamp,
      age_seconds: ageSec,
      message: 'Sensor is actively transmitting live data.',
    };
  }
  if (ageMin <= 10) {
    return {
      status: 'yellow',
      label: 'Delayed',
      last_seen: latest.timestamp,
      age_seconds: ageSec,
      message: 'Telemetry is slightly delayed. Monitoring connection.',
    };
  }
  return {
    status: 'red',
    label: 'Offline',
    last_seen: latest.timestamp,
    age_seconds: ageSec,
    message: 'Check ESP32 power and Wi-Fi connection.',
  };
}

export function detectFallingFastMoisture(readings: SoilReadingRow[]): boolean {
  if (readings.length < 2) return false;
  const latest = readings[readings.length - 1];
  const latestMs = new Date(latest.timestamp).getTime();
  const fourHoursMs = 4 * 3600_000;

  for (let i = readings.length - 2; i >= 0; i--) {
    const pt = readings[i];
    const diffMs = latestMs - new Date(pt.timestamp).getTime();
    if (diffMs > fourHoursMs) break;
    const diffHours = diffMs / 3600_000;
    if (diffHours < 0.08) continue;
    const drop = pt.moisture - latest.moisture;
    const rate = drop / diffHours;
    if (drop >= 5 && rate >= 3.2) {
      return true;
    }
  }
  return false;
}

export interface CropStressResult {
  status: 'Healthy' | 'Moderate' | 'High' | 'Unknown';
  reason: string;
  note: string;
  thresholds: Thresholds;
}

export function evaluateCropStress(
  farm: FarmRow,
  latest: SoilReadingRow | undefined,
  weather: WeatherPayload | null
): CropStressResult {
  const thresholds = getEffectiveThresholds(farm.crop_type, farm.soil_type, farm.growth_stage);

  if (!latest) {
    return {
      status: 'Unknown',
      reason: 'NO_DATA',
      note: 'Waiting for first moisture reading from sensor.',
      thresholds,
    };
  }

  const m = latest.moisture;
  const hotDry = Boolean(weather && weather.temp >= 33 && weather.humidity < 50);

  if (m <= thresholds.lowCritical) {
    return {
      status: 'High',
      reason: 'BELOW_CRITICAL',
      note: `Root moisture (${m}%) is below critical limit (${thresholds.lowCritical}%) for ${farm.crop_type}.`,
      thresholds,
    };
  }

  if (m <= thresholds.lowWarn || (hotDry && m <= thresholds.lowWarn + 4)) {
    return {
      status: 'Moderate',
      reason: hotDry ? 'HOT_DRY_WARN' : 'BELOW_WARNING',
      note: `Moisture (${m}%) is nearing stress band (${thresholds.lowWarn}%). Plan irrigation soon.`,
      thresholds,
    };
  }

  return {
    status: 'Healthy',
    reason: 'OPTIMAL_BAND',
    note: 'Your crop is in good condition.',
    thresholds,
  };
}

export interface WaterRequirementResult {
  decision: 'YES' | 'WAIT' | 'MONITOR' | 'NO' | 'UNKNOWN';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  amount_mm: number | null;
  amount_litres: number | null;
  reason_codes: string[];
  advice: string;
}

export function evaluateWaterRequirement(
  farm: FarmRow,
  latest: SoilReadingRow | undefined,
  weather: WeatherPayload | null
): WaterRequirementResult {
  if (!latest) {
    return {
      decision: 'UNKNOWN',
      urgency: 'NONE',
      amount_mm: null,
      amount_litres: null,
      reason_codes: ['SENSOR_OFFLINE'],
      advice: 'Connect your field sensor to compute exact irrigation volume.',
    };
  }

  const thresholds = getEffectiveThresholds(farm.crop_type, farm.soil_type, farm.growth_stage);
  const m = latest.moisture;
  const rainLikely = Boolean(weather && (weather.rain_prob >= 45 || weather.rain_mm >= 3.0));
  const hot = Boolean(weather && weather.temp >= 33);
  const reasons: string[] = [];

  if (m <= thresholds.lowWarn) reasons.push('MOISTURE_LOW');
  if (rainLikely) reasons.push('RAIN_LIKELY');
  else reasons.push('NO_RAIN');
  if (hot) reasons.push('HOT');

  const acres = toAcres(farm.field_dimension, farm.field_unit);

  if (m <= thresholds.lowCritical) {
    const rawMm = Math.round((thresholds.lowWarn + 10 - m) * 1.4);
    const amountMm = Math.max(8, Math.min(45, rawMm));
    const amountLitres = acres > 0 ? Math.round(amountMm * acres * 4046.86) : null;
    return {
      decision: 'YES',
      urgency: 'HIGH',
      amount_mm: amountMm,
      amount_litres: amountLitres,
      reason_codes: reasons,
      advice: `Irrigate immediately with ~${amountMm} mm to protect ${farm.crop_type} roots.`,
    };
  }

  if (m <= thresholds.lowWarn) {
    const rawMm = Math.round((thresholds.lowWarn + 8 - m) * 1.2);
    const amountMm = Math.max(8, Math.min(45, rawMm));
    const amountLitres = acres > 0 ? Math.round(amountMm * acres * 4046.86) : null;

    if (rainLikely) {
      return {
        decision: 'WAIT',
        urgency: 'MEDIUM',
        amount_mm: amountMm,
        amount_litres: amountLitres,
        reason_codes: reasons,
        advice: 'Rain is expected soon. Consider delaying irrigation to conserve water.',
      };
    }

    return {
      decision: 'YES',
      urgency: 'MEDIUM',
      amount_mm: amountMm,
      amount_litres: amountLitres,
      reason_codes: reasons,
      advice: `Schedule irrigation (~${amountMm} mm) within the next 12 hours.`,
    };
  }

  if (rainLikely) {
    return {
      decision: 'WAIT',
      urgency: 'LOW',
      amount_mm: 0,
      amount_litres: 0,
      reason_codes: reasons,
      advice: `Rain is forecast (${weather?.rain_prob ?? 50}% chance, ~${weather?.rain_mm ?? 0} mm in 24h). Delay irrigation to conserve water.`,
    };
  }

  const et0 = weather?.analysis?.evapotranspiration_mm;
  const etNote = et0 ? ` Daily crop water loss (ET₀) is ${et0} mm/day.` : '';
  return {
    decision: 'NO',
    urgency: 'NONE',
    amount_mm: 0,
    amount_litres: 0,
    reason_codes: reasons,
    advice: `Soil moisture (${m}%) is healthy for ${farm.crop_type}. No irrigation needed today.${etNote}`,
  };
}

export interface CropHealthResult {
  status: 'Healthy' | 'Moderate' | 'High' | 'Unknown';
  factors: string[];
  confidence_note: string;
}

export function evaluateCropHealth(
  farm: FarmRow,
  readings: SoilReadingRow[],
  weather: WeatherPayload | null
): CropHealthResult {
  const latest = readings[readings.length - 1];
  const stress = evaluateCropStress(farm, latest, weather);
  const sensorHealth = evaluateSensorHealth(latest);
  const factors: string[] = [];

  if (sensorHealth.status === 'red' || sensorHealth.status === 'gray') {
    factors.push('SENSOR_OFFLINE');
  }
  if (latest && latest.moisture <= stress.thresholds.lowWarn) {
    factors.push('LOW_MOISTURE');
  }
  if (detectFallingFastMoisture(readings)) {
    factors.push('FALLING_FAST');
  }
  if (weather && weather.temp >= 33 && weather.humidity < 50) {
    factors.push('HOT_DRY');
  }
  if (!weather || weather.rain_prob < 30) {
    factors.push('NO_RAIN');
  }

  return {
    status: stress.status,
    factors,
    confidence_note: `Calibrated for ${farm.crop_type} in ${farm.soil_type} (${farm.growth_stage} stage).`,
  };
}
