import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import type {
  FarmRow,
  SoilReadingRow,
  ChatMessageRow,
  AlertRow,
  DeviceRow,
} from '../db/database.js';
import type { WeatherPayload } from './weather.js';
import type {
  CropStressResult,
  WaterRequirementResult,
  SensorHealthResult,
} from './agronomy.js';
import { toAcres } from './agronomy.js';
import type { TimeToStressResult } from './timeToStress.js';
import type { HeatmapResult } from './heatmap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_FILE_PATH = path.resolve(__dirname, '../../.env');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_MODEL_CHAIN = Array.from(
  new Set([
    GEMINI_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
  ])
);

const LANG_PROMPT_MAP: Record<string, string> = {
  en: 'Reply strictly in clear, simple English (unless the farmer writes to you in another language, in which case match their language).',
  kn: 'Reply strictly in clear, natural, everyday Kannada (ಕನ್ನಡ).',
  hi: 'Reply strictly in clear, simple Hindi (हिन्दी).',
  te: 'Reply strictly in clear, simple Telugu (తెలుగు).',
  ta: 'Reply strictly in clear, simple Tamil (தமிழ்).',
  ml: 'Reply strictly in clear, simple Malayalam (മലയാളം).',
  mr: 'Reply strictly in clear, simple Marathi (मराठी).',
};

export interface AssistantContext {
  farm: FarmRow;
  device?: DeviceRow;
  latest: SoilReadingRow | undefined;
  sensorHealth: SensorHealthResult;
  weather: WeatherPayload | null;
  stress: CropStressResult;
  water: WaterRequirementResult;
  timeToStress: TimeToStressResult;
  heatmap: HeatmapResult;
  activeAlerts: AlertRow[];
  history: ChatMessageRow[];
}

export function getGeminiApiKey(): string {
  const fromEnv = (process.env.GEMINI_API_KEY || '').trim();
  if (fromEnv) return fromEnv;

  // Reload directly from backend/.env if server started before .env was created
  if (fs.existsSync(ENV_FILE_PATH)) {
    const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
    if (match && match[1]) {
      const key = match[1].trim();
      process.env.GEMINI_API_KEY = key;
      return key;
    }
  }
  return '';
}

export function getGeminiStatus(): { configured: boolean; model: string } {
  return {
    configured: Boolean(getGeminiApiKey()),
    model: GEMINI_MODEL,
  };
}

export async function saveAndVerifyGeminiKey(
  rawKey: string
): Promise<{ ok: boolean; error?: string; model: string }> {
  const apiKey = rawKey.trim();
  if (!apiKey) {
    return { ok: false, error: 'API key cannot be empty.', model: GEMINI_MODEL };
  }

  // Test the key live against Gemini model chain before saving
  let verifiedModel = GEMINI_MODEL;
  let lastErr = '';
  let verified = false;
  for (const modelName of GEMINI_MODEL_CHAIN) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({
        model: modelName,
        contents: 'Reply with OK.',
      });
      verifiedModel = modelName;
      verified = true;
      break;
    } catch (err) {
      lastErr = (err as Error).message;
    }
  }
  if (!verified) {
    return {
      ok: false,
      error: `Gemini verification failed: ${lastErr}`,
      model: GEMINI_MODEL,
    };
  }

  // Persist into backend/.env and update runtime env immediately
  let envContent = '';
  if (fs.existsSync(ENV_FILE_PATH)) {
    envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
  }

  if (/^GEMINI_API_KEY=.*$/m.test(envContent)) {
    envContent = envContent.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${apiKey}`);
  } else {
    const prefix = envContent && !envContent.endsWith('\n') ? '\n' : '';
    envContent = `${envContent}${prefix}GEMINI_API_KEY=${apiKey}\n`;
  }

  fs.writeFileSync(ENV_FILE_PATH, envContent, 'utf-8');
  process.env.GEMINI_API_KEY = apiKey;

  return { ok: true, model: verifiedModel };
}

function buildSystemInstruction(language: string, ctx: AssistantContext): string {
  const langRule = LANG_PROMPT_MAP[language] || LANG_PROMPT_MAP.en;
  const acres = toAcres(ctx.farm.field_dimension, ctx.farm.field_unit).toFixed(2);

  const forecastSummary = ctx.weather?.forecast?.length
    ? ctx.weather.forecast
        .map(
          (f) =>
            `${f.day} (${f.date}): ${f.low}-${f.high}°C, ${f.icon}, rain ${f.rain_mm}mm (${f.rain_prob}%)`
        )
        .join(' | ')
    : 'Forecast unavailable';

  const alertsSummary =
    ctx.activeAlerts.length > 0
      ? ctx.activeAlerts
          .slice(0, 5)
          .map((a) => `[${a.severity.toUpperCase()}] ${a.title} - ${a.message}`)
          .join(' ; ')
      : 'No unread alerts';

  return [
    'You are Root Sense AI, an expert agronomist and personal farming companion built for farmers in Karnataka and across India.',
    'You must answer EVERY question the farmer asks related to their field, crop, soil, irrigation, fertilizers/nutrients, pests & diseases, weeds, sowing/harvest timing, weather impact, pump scheduling, yield improvement, post-harvest storage, or farming schemes.',
    'Always personalize every answer directly to the farmer’s exact farm profile, live sensor telemetry, and weather data provided below.',
    langRule,
    'Tone & Format: Practical, respectful, concise, and easy to understand (3–6 clear sentences or short bullet points) so it also reads cleanly aloud via text-to-speech.',
    'Strict Accuracy Rule: NEVER invent sensor numbers. Only cite the exact readings below. If sensor data is missing or offline, advise using crop/soil/weather principles and suggest a quick manual topsoil check.',
    '',
    '=== LIVE FARM PROFILE ===',
    `Farmer Name: ${ctx.farm.farmer_name}`,
    `Location: ${ctx.farm.location} (Lat ${ctx.farm.latitude}, Lon ${ctx.farm.longitude})`,
    `Crop Grown: ${ctx.farm.crop_type}`,
    `Growth Stage: ${ctx.farm.growth_stage}`,
    `Soil Type: ${ctx.farm.soil_type}`,
    `Field Dimension: ${ctx.farm.field_dimension} ${ctx.farm.field_unit} (~${acres} acres)`,
    `Irrigation Method: ${ctx.farm.irrigation_type}`,
    `Sowing Date: ${ctx.farm.sowing_date || 'Not specified'}`,
    '',
    '=== LIVE SOIL & SENSOR TELEMETRY ===',
    `Device: ${ctx.device?.device_id || 'RS-KA-01'} (${ctx.sensorHealth.label}, Wi-Fi: ${ctx.device?.wifi_ssid || 'Farm_WiFi'}, Signal: ${ctx.device?.signal_dbm ?? -62} dBm)`,
    `Latest Moisture: ${ctx.latest ? `${ctx.latest.moisture}% (recorded at ${ctx.latest.timestamp})` : 'No data yet'}`,
    `Field Sensor Temperature: ${ctx.latest ? `${ctx.latest.soil_temp}°C` : 'No data yet'}`,
    `Field Sensor Humidity: ${ctx.latest?.humidity !== null && ctx.latest?.humidity !== undefined ? `${ctx.latest.humidity}%` : `${ctx.weather?.humidity ?? 'N/A'}% (weather)`}`,
    `Crop Stress Status: ${ctx.stress.status} (${ctx.stress.note})`,
    `Calibrated Thresholds: Critical <= ${ctx.stress.thresholds.lowCritical}%, Warning <= ${ctx.stress.thresholds.lowWarn}%, High Saturation >= ${ctx.stress.thresholds.highWarn}%`,
    `OLS Trend & Time-to-Stress: State=${ctx.timeToStress.state}, Slope=${ctx.timeToStress.slope_per_hour ?? 'N/A'}%/hr, HoursToModerate=${ctx.timeToStress.hours_to_moderate ?? 'N/A'}, HoursToHigh=${ctx.timeToStress.hours_to_high ?? 'N/A'}, Confidence=${ctx.timeToStress.confidence_pct}%`,
    `7-Day Heatmap Insight: ${ctx.heatmap.insight}`,
    '',
    '=== WATER REQUIREMENT & WEATHER ===',
    `Irrigation Decision: ${ctx.water.decision} (Urgency: ${ctx.water.urgency}) — ${ctx.water.advice}`,
    `Estimated Volume: ${ctx.water.amount_mm ?? 0} mm (${ctx.water.amount_litres ? `${ctx.water.amount_litres.toLocaleString()} litres` : '0 litres'})`,
    `Current Weather (${ctx.weather?.source || 'unavailable'}): ${ctx.weather ? `${ctx.weather.temp}°C, ${ctx.weather.condition}, Humidity ${ctx.weather.humidity}%, Wind ${ctx.weather.wind_speed} m/s, Rain Prob ${ctx.weather.rain_prob}%, 24h Rain ${ctx.weather.rain_mm} mm` : 'Unavailable'}`,
    `5-Day Forecast: ${forecastSummary}`,
    `Active Unread Alerts: ${alertsSummary}`,
  ].join('\n');
}

function buildDeterministicFallback(message: string, ctx: AssistantContext): string {
  const q = message.toLowerCase();
  const firstName = ctx.farm.farmer_name.split(' ')[0] || 'Farmer';
  const moistureStr = ctx.latest ? `${ctx.latest.moisture}%` : 'not yet available';
  const rainProb = ctx.weather?.rain_prob ?? 20;
  const rainMm = ctx.weather?.rain_mm ?? 0;
  const temp = ctx.weather?.temp ?? 28;
  const crop = ctx.farm.crop_type;
  const soil = ctx.farm.soil_type;

  if (q.includes('irrigat') || q.includes('water') || q.includes('pump')) {
    if (ctx.water.decision === 'YES') {
      const litresNote = ctx.water.amount_litres
        ? ` (~${ctx.water.amount_litres.toLocaleString()} litres for ${ctx.farm.field_dimension} ${ctx.farm.field_unit})`
        : '';
      return `Yes ${firstName}, irrigate your ${crop} field. Current moisture is ${moistureStr}, below the ${ctx.stress.thresholds.lowWarn}% warning band. Recommended depth is ${ctx.water.amount_mm} mm${litresNote} via your ${ctx.farm.irrigation_type} system.`;
    }
    return `Based on your current soil moisture (${moistureStr}) and weather forecast (${rainProb}% rain probability, ${rainMm} mm expected), you can wait. ${ctx.water.advice}`;
  }

  if (q.includes('fertil') || q.includes('urea') || q.includes('npk') || q.includes('manure') || q.includes('nutrient')) {
    return `For ${crop} in ${soil} soil (${ctx.farm.growth_stage} stage, ${ctx.farm.field_dimension} ${ctx.farm.field_unit}), apply split nitrogen top-dressing when root moisture is optimal (currently ${moistureStr}). Avoid broadcasting urea right before heavy rain to prevent leaching.`;
  }

  if (q.includes('pest') || q.includes('disease') || q.includes('insect') || q.includes('leaf') || q.includes('yellow') || q.includes('spot')) {
    return `At ${temp}°C and ${ctx.weather?.humidity ?? 64}% humidity, inspect your ${crop} leaves early morning for fungal spots or sap-sucking pests. Maintain balanced ${ctx.farm.irrigation_type} watering (moisture is ${moistureStr}) and consider neem-oil (3 ml/L) as a preventive organic spray.`;
  }

  if (q.includes('decreas') || q.includes('drop') || q.includes('dry') || q.includes('trend')) {
    const slopeText =
      ctx.timeToStress.slope_per_hour !== null
        ? `${ctx.timeToStress.slope_per_hour}%/hour`
        : 'a gradual pace';
    const hrsText =
      ctx.timeToStress.hours_to_moderate !== null
        ? `estimated ~${ctx.timeToStress.hours_to_moderate} hours until moderate stress (${ctx.timeToStress.confidence_pct}% confidence)`
        : 'currently within safe bounds';
    return `Your ${soil} soil moisture is changing at ${slopeText} under ${temp}°C temperatures. OLS regression shows ${hrsText}. ${ctx.heatmap.insight}`;
  }

  if (q.includes('stress') || q.includes('health') || q.includes('condition')) {
    return `Your ${crop} crop health is ${ctx.stress.status} at ${moistureStr} moisture (critical limit: ${ctx.stress.thresholds.lowCritical}%, warning: ${ctx.stress.thresholds.lowWarn}%). ${ctx.stress.note}`;
  }

  if (q.includes('rain') || q.includes('weather') || q.includes('forecast')) {
    return `Forecast for ${ctx.farm.location} shows ${temp}°C (${ctx.weather?.condition || 'Partly Cloudy'}) with ${rainProb}% rain probability and ${rainMm} mm expected rainfall. ${ctx.water.advice}`;
  }

  return `Hello ${firstName}! Your ${crop} field in ${ctx.farm.location} (${soil}, ${ctx.farm.field_dimension} ${ctx.farm.field_unit}) currently has ${moistureStr} soil moisture and ${ctx.stress.status} crop health. ${ctx.water.advice}`;
}

export async function generateAssistantReply(
  message: string,
  language: string,
  ctx: AssistantContext
): Promise<{
  reply: string;
  engine: 'gemini-live' | 'agronomy-grounded';
  model?: string;
  geminiError?: string;
}> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(language, ctx);

    // Build multi-turn conversation history (last 12 stored messages)
    const priorTurns = ctx.history.slice(-12).map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.text }],
    }));

    const contents = [
      ...priorTurns,
      { role: 'user' as const, parts: [{ text: message }] },
    ];

    let lastErr = '';
    for (const modelName of GEMINI_MODEL_CHAIN) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });

        const text = response.text?.trim();
        if (text) {
          return {
            reply: text,
            engine: 'gemini-live',
            model: modelName,
          };
        }
      } catch (err) {
        lastErr = (err as Error).message;
        console.warn(`[Assistant] Model ${modelName} failed, trying next fallback:`, lastErr);
      }
    }

    return {
      reply: buildDeterministicFallback(message, ctx),
      engine: 'agronomy-grounded',
      geminiError: lastErr,
    };
  }

  return {
    reply: buildDeterministicFallback(message, ctx),
    engine: 'agronomy-grounded',
  };
}
