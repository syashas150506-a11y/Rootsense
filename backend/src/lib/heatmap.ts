import type { FarmRow, SoilReadingRow } from '../db/database.js';
import { getEffectiveThresholds } from './agronomy.js';

export interface HeatmapSlot {
  slot: string;
  avgMoisture: number | null;
  tone: 'empty' | 'critical' | 'warn' | 'optimal';
}

export interface HeatmapDayRow {
  dayLabel: string;
  dateIso: string;
  slots: HeatmapSlot[];
}

export interface HeatmapResult {
  state: 'OK' | 'INSUFFICIENT_DATA';
  moderate: number;
  high: number;
  rows: HeatmapDayRow[];
  driest_slot: string | null;
  insight: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [
  { label: '00-04', start: 0, end: 4 },
  { label: '04-08', start: 4, end: 8 },
  { label: '08-12', start: 8, end: 12 },
  { label: '12-16', start: 12, end: 16 },
  { label: '16-20', start: 16, end: 20 },
  { label: '20-24', start: 20, end: 24 },
];

export function buildFieldHeatmap(
  farm: FarmRow,
  readings: SoilReadingRow[],
  days = 7
): HeatmapResult {
  const thresholds = getEffectiveThresholds(farm.crop_type, farm.soil_type, farm.growth_stage);
  const clampedDays = Math.max(1, Math.min(14, days));

  if (readings.length < 2) {
    return {
      state: 'INSUFFICIENT_DATA',
      moderate: thresholds.lowWarn,
      high: thresholds.lowCritical,
      rows: [],
      driest_slot: null,
      insight: 'Need at least 2 sensor readings to build diurnal heatmap.',
    };
  }

  // Group by IST date (UTC+5:30) and 4-hour bucket
  const IST_OFFSET_MS = 5.5 * 3600_000;
  const bucketMap = new Map<string, number[]>();
  const slotTotals = new Map<string, number[]>();

  for (const r of readings) {
    const istDate = new Date(new Date(r.timestamp).getTime() + IST_OFFSET_MS);
    const dateKey = istDate.toISOString().slice(0, 10);
    const hour = istDate.getUTCHours();
    const slotObj = TIME_SLOTS.find((s) => hour >= s.start && hour < s.end) || TIME_SLOTS[0];
    const key = `${dateKey}|${slotObj.label}`;
    const arr = bucketMap.get(key) || [];
    arr.push(r.moisture);
    bucketMap.set(key, arr);

    const sArr = slotTotals.get(slotObj.label) || [];
    sArr.push(r.moisture);
    slotTotals.set(slotObj.label, sArr);
  }

  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const rows: HeatmapDayRow[] = [];

  for (let d = clampedDays - 1; d >= 0; d--) {
    const dt = new Date(nowIst.getTime() - d * 86400_000);
    const dateIso = dt.toISOString().slice(0, 10);
    const dayLabel = DAY_NAMES[dt.getUTCDay()];

    const slots: HeatmapSlot[] = TIME_SLOTS.map((slotObj) => {
      const vals = bucketMap.get(`${dateIso}|${slotObj.label}`);
      if (!vals || vals.length === 0) {
        return { slot: slotObj.label, avgMoisture: null, tone: 'empty' };
      }
      const avg = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
      let tone: HeatmapSlot['tone'] = 'optimal';
      if (avg <= thresholds.lowCritical) tone = 'critical';
      else if (avg <= thresholds.lowWarn) tone = 'warn';
      return { slot: slotObj.label, avgMoisture: avg, tone };
    });

    rows.push({ dayLabel, dateIso, slots });
  }

  // Find driest slot overall
  let driestSlot: string | null = null;
  let driestAvg = Infinity;
  for (const [slotLabel, vals] of slotTotals.entries()) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg < driestAvg) {
      driestAvg = avg;
      driestSlot = slotLabel;
    }
  }

  const insight = driestSlot
    ? `Driest root-zone window detected between ${driestSlot}:00 IST (avg ${driestAvg.toFixed(1)}%).`
    : 'Diurnal moisture distribution balanced across recorded slots.';

  return {
    state: 'OK',
    moderate: thresholds.lowWarn,
    high: thresholds.lowCritical,
    rows,
    driest_slot: driestSlot,
    insight,
  };
}
