import type { FarmRow, SoilReadingRow } from '../db/database.js';
import type { WeatherPayload } from './weather.js';
import { getEffectiveThresholds } from './agronomy.js';

export type TimeToStressState =
  | 'ALREADY_HIGH'
  | 'ALREADY_MODERATE'
  | 'INSUFFICIENT_DATA'
  | 'DRYING'
  | 'STABLE'
  | 'WETTING';

export interface TimeToStressResult {
  state: TimeToStressState;
  current: number | null;
  hours_to_moderate: number | null;
  hours_to_high: number | null;
  slope_per_hour: number | null;
  readings_used: number;
  fit_quality: number | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_pct: number;
  rain_before: boolean;
  projection: { hours_ahead: number; moisture: number }[];
}

export function computeTimeToStress(
  farm: FarmRow,
  readings: SoilReadingRow[],
  weather: WeatherPayload | null
): TimeToStressResult {
  const thresholds = getEffectiveThresholds(farm.crop_type, farm.soil_type, farm.growth_stage);
  const valid = readings
    .filter((r) => typeof r.moisture === 'number' && !Number.isNaN(r.moisture))
    .slice(-48);

  if (valid.length === 0) {
    return {
      state: 'INSUFFICIENT_DATA',
      current: null,
      hours_to_moderate: null,
      hours_to_high: null,
      slope_per_hour: null,
      readings_used: 0,
      fit_quality: null,
      confidence: 'LOW',
      confidence_pct: 0,
      rain_before: false,
      projection: [],
    };
  }

  const latest = valid[valid.length - 1];
  const current = latest.moisture;

  if (current <= thresholds.lowCritical) {
    return {
      state: 'ALREADY_HIGH',
      current,
      hours_to_moderate: 0,
      hours_to_high: 0,
      slope_per_hour: null,
      readings_used: valid.length,
      fit_quality: 1,
      confidence: 'HIGH',
      confidence_pct: 95,
      rain_before: false,
      projection: [],
    };
  }

  if (current <= thresholds.lowWarn) {
    return {
      state: 'ALREADY_MODERATE',
      current,
      hours_to_moderate: 0,
      hours_to_high: null,
      slope_per_hour: null,
      readings_used: valid.length,
      fit_quality: 1,
      confidence: 'HIGH',
      confidence_pct: 90,
      rain_before: false,
      projection: [],
    };
  }

  // Use recent 18h window for active OLS slope so historical rain spikes don't blur current drying
  const latestMs = new Date(latest.timestamp).getTime();
  const recentWindow = valid.filter(
    (r) => latestMs - new Date(r.timestamp).getTime() <= 18 * 3600_000
  );
  const pts = recentWindow.length >= 3 ? recentWindow : valid;

  const t0 = new Date(pts[0].timestamp).getTime();
  const spanHours = (new Date(pts[pts.length - 1].timestamp).getTime() - t0) / 3600_000;

  if (pts.length < 3 || spanHours < 0.25) {
    return {
      state: 'INSUFFICIENT_DATA',
      current,
      hours_to_moderate: null,
      hours_to_high: null,
      slope_per_hour: null,
      readings_used: pts.length,
      fit_quality: null,
      confidence: 'LOW',
      confidence_pct: 35,
      rain_before: false,
      projection: [],
    };
  }

  // Ordinary Least Squares (OLS) linear regression
  const xs = pts.map((p) => (new Date(p.timestamp).getTime() - t0) / 3600_000);
  const ys = pts.map((p) => p.moisture);
  const n = pts.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  const slope = sxx > 0 ? sxy / sxx : 0;
  const rSquared =
    sxx > 0 && syy > 0 ? Math.min(1, Math.max(0, (sxy * sxy) / (sxx * syy))) : 1;

  let state: TimeToStressState = 'STABLE';
  if (slope >= 0.15) state = 'WETTING';
  else if (slope <= -0.1) state = 'DRYING';

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (n >= 6 && rSquared >= 0.75) confidence = 'HIGH';
  else if (n >= 4 && rSquared >= 0.45) confidence = 'MEDIUM';

  const confidencePct = Math.round(
    Math.max(40, Math.min(96, rSquared * 65 + Math.min(n, 10) * 2.5))
  );

  let hoursToModerate: number | null = null;
  let hoursToHigh: number | null = null;
  const projection: { hours_ahead: number; moisture: number }[] = [];

  if (state === 'DRYING') {
    const rate = Math.abs(slope);
    hoursToModerate = Math.max(1, Math.round((current - thresholds.lowWarn) / rate));
    hoursToHigh = Math.max(1, Math.round((current - thresholds.lowCritical) / rate));

    for (const h of [2, 6, 12, 24]) {
      projection.push({
        hours_ahead: h,
        moisture: Number(Math.max(5, current + slope * h).toFixed(1)),
      });
    }
  }

  const rainBefore = Boolean(
    weather && weather.rain_prob >= 40 && hoursToModerate !== null && hoursToModerate >= 6
  );

  return {
    state,
    current,
    hours_to_moderate: hoursToModerate,
    hours_to_high: hoursToHigh,
    slope_per_hour: Number(slope.toFixed(3)),
    readings_used: n,
    fit_quality: Number(rSquared.toFixed(3)),
    confidence,
    confidence_pct: confidencePct,
    rain_before: rainBefore,
    projection,
  };
}
