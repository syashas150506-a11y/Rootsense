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

export const LANG_PROMPT_MAP: Record<string, string> = {
  auto: 'CRITICAL: Detect the exact language used by the farmer (Kannada, Hindi, English, Telugu, Tamil, Malayalam, or Marathi) and reply ENTIRELY in that same language and script.',
  en: 'Reply strictly in clear, simple English (unless the farmer writes in another language, in which case match their language).',
  kn: 'Reply strictly in clear, natural, everyday Kannada script (ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ). Do not reply in English.',
  hi: 'Reply strictly in clear, natural Hindi in Devanagari script (हिन्दी में उत्तर दें). Do not reply in English.',
  te: 'Reply strictly in clear, natural Telugu (తెలుగులో సమాధానం ఇవ్వండి).',
  ta: 'Reply strictly in clear, natural Tamil (தமிழில் பதிலளிக்கவும்).',
  ml: 'Reply strictly in clear, natural Malayalam (മലയാളത്തിൽ മറുപടി നൽകുക).',
  mr: 'Reply strictly in clear, natural Marathi (मराठीत उत्तर द्या).',
};

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  kn: 'Kannada (ಕನ್ನಡ)',
  hi: 'Hindi (हिन्दी)',
  te: 'Telugu (తెలుగు)',
  ta: 'Tamil (தமிழ்)',
  ml: 'Malayalam (മലയാളം)',
  mr: 'Marathi (मराठी)',
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

/** Detect language from script and keywords */
export function detectLanguageFromText(text: string): { code: string; name: string } {
  if (!text || typeof text !== 'string') return { code: 'en', name: 'English' };

  // Kannada Unicode block
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return { code: 'kn', name: 'Kannada' };
  }
  // Devanagari Unicode block (Hindi / Marathi)
  if (/[\u0900-\u097F]/.test(text)) {
    return { code: 'hi', name: 'Hindi' };
  }
  // Telugu Unicode block
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return { code: 'te', name: 'Telugu' };
  }
  // Tamil Unicode block
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return { code: 'ta', name: 'Tamil' };
  }
  // Malayalam Unicode block
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return { code: 'ml', name: 'Malayalam' };
  }

  // Romanized Kannada check
  const lower = text.toLowerCase();
  const kannadaRomanWords = [
    'ragi', 'bele', 'neeru', 'mannu', 'beku', 'enu', 'estu', 'yavaga',
    'madabeku', 'tumba', 'nanna', 'hola', 'krishi', 'hasu', 'kodu', 'hale',
  ];
  if (kannadaRomanWords.some((w) => new RegExp(`\\b${w}\\b`).test(lower))) {
    return { code: 'kn', name: 'Kannada' };
  }

  // Romanized Hindi check
  const hindiRomanWords = [
    'paani', 'fasal', 'khet', 'kitna', 'khad', 'kab', 'kya', 'kaise',
    'kisan', 'mitti', 'dawa', 'chhidkaw', 'kharab', 'meri', 'mera',
  ];
  if (hindiRomanWords.some((w) => new RegExp(`\\b${w}\\b`).test(lower))) {
    return { code: 'hi', name: 'Hindi' };
  }

  return { code: 'en', name: 'English' };
}

export function normalizeLangCode(rawLang?: string | null): string {
  if (!rawLang) return 'en';
  const l = rawLang.toLowerCase().trim();
  if (l.startsWith('kn') || l.includes('kannada')) return 'kn';
  if (l.startsWith('hi') || l.includes('hindi')) return 'hi';
  if (l.startsWith('te') || l.includes('telugu')) return 'te';
  if (l.startsWith('ta') || l.includes('tamil')) return 'ta';
  if (l.startsWith('ml') || l.includes('malayalam')) return 'ml';
  if (l.startsWith('mr') || l.includes('marathi')) return 'mr';
  return 'en';
}

export function getGeminiApiKey(): string {
  const fromEnv = (process.env.GEMINI_API_KEY || '').trim();
  if (fromEnv) return fromEnv;

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

export function getGroqApiKey(): string {
  const fromEnv = (process.env.GROQ_API_KEY || '').trim();
  if (fromEnv) return fromEnv;

  if (fs.existsSync(ENV_FILE_PATH)) {
    const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    const match = content.match(/^GROQ_API_KEY=(.+)$/m);
    if (match && match[1]) {
      const key = match[1].trim();
      process.env.GROQ_API_KEY = key;
      return key;
    }
  }
  return '';
}

export function getGeminiStatus(): { configured: boolean; model: string; groqConfigured: boolean } {
  return {
    configured: Boolean(getGeminiApiKey()),
    model: GEMINI_MODEL,
    groqConfigured: Boolean(getGroqApiKey()),
  };
}

export async function saveAndVerifyGeminiKey(
  rawKey: string
): Promise<{ ok: boolean; error?: string; model: string }> {
  const apiKey = rawKey.trim();
  if (!apiKey) {
    return { ok: false, error: 'API key cannot be empty.', model: GEMINI_MODEL };
  }

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

// =========================================================================
// SPEECH TO TEXT (STT) TRANSCRIPTION WITH AUTO-LANGUAGE DETECTION
// =========================================================================

/** Transcribe audio using Groq Whisper API (whisper-large-v3-turbo) */
async function transcribeWithGroq(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string
): Promise<{ text: string; language: string; languageName: string } | null> {
  try {
    const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`;
    const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : mimeType.includes('wav') ? 'wav' : 'webm';
    const filename = `audio.${ext}`;

    const parts: (Buffer | string)[] = [];
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3-turbo\r\n`);
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`);
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`);
    parts.push(audioBuffer);
    parts.push(`\r\n--${boundary}--\r\n`);

    const bodyBuffer = Buffer.concat(parts.map((p) => (typeof p === 'string' ? Buffer.from(p) : p)));

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyBuffer,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[STT] Groq Whisper error response:', errText);
      return null;
    }

    const data = (await res.json()) as { text?: string; language?: string };
    const text = data.text?.trim() || '';
    if (!text) return null;

    const code = normalizeLangCode(data.language);
    return {
      text,
      language: code,
      languageName: LANGUAGE_NAMES[code] || 'Detected Language',
    };
  } catch (err) {
    console.warn('[STT] Groq Whisper request failed:', (err as Error).message);
    return null;
  }
}

/** Transcribe audio using Gemini Multimodal Audio with Auto Language Detection */
async function transcribeWithGemini(
  base64Audio: string,
  mimeType: string,
  apiKey: string
): Promise<{ text: string; language: string; languageName: string } | null> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = [
    'You are a high-precision Speech-to-Text audio transcriber and Language Detector for Indian farmers.',
    'Listen carefully to this audio file of a farmer speaking.',
    'TASK:',
    '1. Transcribe the speech verbatim into text in the original script of the spoken language (Kannada script ಕನ್ನಡ if spoken in Kannada, Devanagari script हिन्दी if spoken in Hindi, English if spoken in English, Telugu తెలుగు, Tamil தமிழ், etc.).',
    '2. Automatically detect which language was spoken.',
    '3. If the audio contains only background noise, static, silence, or no intelligible words, return {"text": "", "language": "en", "language_name": "English"}.',
    'OUTPUT: Return strictly valid JSON with no markdown formatting:',
    '{"text": "transcribed speech in native script", "language": "kn|hi|en|te|ta|ml|mr", "language_name": "Kannada|Hindi|English|Telugu|Tamil|Malayalam|Marathi"}',
  ].join('\n');

  // Prioritize active high-speed models that support audio
  const modelsToTry = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-2.5-flash',
  ];

  const safeMime = mimeType && mimeType.startsWith('audio/') ? mimeType : 'audio/m4a';

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: safeMime,
                  data: base64Audio,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const resText = response.text?.trim();
      if (resText) {
        const cleaned = resText.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        const text = (parsed.text || '').trim();
        // Ignore silent or empty transcripts
        if (!text || text.toLowerCase() === 'silence' || text.toLowerCase() === 'none') {
          return null;
        }
        const code = normalizeLangCode(parsed.language);
        return {
          text,
          language: code,
          languageName: parsed.language_name || LANGUAGE_NAMES[code] || 'Language',
        };
      }
    } catch (err) {
      console.warn(`[STT] Gemini model ${model} audio transcription failed:`, (err as Error).message);
    }
  }

  return null;
}

/** Unified Speech-to-Text API: Groq Whisper -> Gemini Audio */
export async function transcribeAudio(
  base64Audio: string,
  mimeType = 'audio/m4a',
  requestedLang?: string
): Promise<{
  ok: boolean;
  text: string;
  language: string;
  languageName: string;
  engine: string;
  error?: string;
}> {
  const safeMime = mimeType && mimeType.startsWith('audio/') ? mimeType : 'audio/m4a';
  const audioBuffer = Buffer.from(base64Audio, 'base64');

  // 1. Try Groq Whisper (Whisper-large-v3-turbo) if GROQ_API_KEY is available
  const groqKey = getGroqApiKey();
  if (groqKey) {
    const groqResult = await transcribeWithGroq(audioBuffer, safeMime, groqKey);
    if (groqResult && groqResult.text && groqResult.text.trim()) {
      return {
        ok: true,
        text: groqResult.text.trim(),
        language: groqResult.language,
        languageName: groqResult.languageName,
        engine: 'groq-whisper-v3',
      };
    }
  }

  // 2. Try Google Gemini Multimodal Audio Transcription
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    const geminiResult = await transcribeWithGemini(base64Audio, safeMime, geminiKey);
    if (geminiResult && geminiResult.text && geminiResult.text.trim()) {
      return {
        ok: true,
        text: geminiResult.text.trim(),
        language: geminiResult.language,
        languageName: geminiResult.languageName,
        engine: 'gemini-multimodal-audio',
      };
    }
  }

  // 3. If speech was not recognized or audio was empty, return failure instead of fake questions
  return {
    ok: false,
    text: '',
    language: requestedLang || 'en',
    languageName: LANGUAGE_NAMES[requestedLang || 'en'] || 'English',
    engine: 'none',
    error: 'Could not recognize words clearly. Please hold the mic closer and speak clearly.',
  };
}

// =========================================================================
// SYSTEM INSTRUCTION & MULTILINGUAL RESPONSE GENERATION
// =========================================================================

function buildSystemInstruction(language: string, ctx: AssistantContext): string {
  const langRule = LANG_PROMPT_MAP[language] || LANG_PROMPT_MAP.auto;
  const acres = toAcres(ctx.farm.field_dimension, ctx.farm.field_unit).toFixed(2);

  const forecastSummary = ctx.weather?.forecast?.length
    ? ctx.weather.forecast
        .map(
          (f) =>
            `${f.day} (${f.date}): ${f.low}-${f.high}°C, ${f.condition}, rain ${f.rain_mm}mm (${f.rain_prob}%), ET0 ${f.et0_mm}mm/day, UV ${f.uv_max}, wind max ${f.wind_max_kmh}km/h`
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
    'You are Root Sense AI, an expert precision agronomist and farming companion built for farmers in Karnataka and across India.',
    '=== CRITICAL DIRECTIVE: EXCLUSIVE FARM DATA GROUNDING & HIGH ACCURACY ===',
    '1. You MUST answer the farmer’s specific question strictly and exclusively tailored to their exact farm data below.',
    '2. DO NOT provide generic, textbook, or one-size-fits-all advice. Every answer MUST be grounded in their specific:',
    `   - Crop: ${ctx.farm.crop_type} (Current Growth Stage: ${ctx.farm.growth_stage}, Sown on: ${ctx.farm.sowing_date || 'N/A'})`,
    `   - Soil Type: ${ctx.farm.soil_type}`,
    `   - Location: ${ctx.farm.location}`,
    `   - Farm Size: ${ctx.farm.field_dimension} ${ctx.farm.field_unit} (~${acres} acres)`,
    `   - Irrigation Type: ${ctx.farm.irrigation_type}`,
    `   - Live Soil Moisture: ${ctx.latest ? `${ctx.latest.moisture}%` : '32%'} (Warning threshold: ${ctx.stress.thresholds.lowWarn}%, Critical: ${ctx.stress.thresholds.lowCritical}%)`,
    `   - Real-Time Weather: ${ctx.weather ? `${ctx.weather.temp}°C, ${ctx.weather.condition}, Humidity ${ctx.weather.humidity}%, Rain probability: ${ctx.weather.rain_prob}%, Rain expected: ${ctx.weather.rain_mm} mm` : '28°C'}`,
    '3. ACCURACY ENFORCEMENT: Directly quote their actual live numbers (e.g. "Your moisture is currently 32%", "With 64% humidity in Tumakuru...") in your explanation.',
    '4. ZERO HALLUCINATION: Never invent sensor readings or crop facts. If asked about something outside the farm context, politely guide them back to their field and crop.',
    '',
    '=== CRITICAL LANGUAGE AUTO-DETECTION & MIRRORING RULE ===',
    '1. Examine the exact language of the farmer’s latest question.',
    '2. ALWAYS reply in the EXACT SAME language and script that the farmer used:',
    '   - If the user asks in KANNADA (ಕನ್ನಡ ಲಿಪಿ) or romanized Kannada, you MUST reply entirely in natural, fluent KANNADA script (ಕನ್ನಡದಲ್ಲಿಯೇ ಉತ್ತರಿಸಿ).',
    '   - If the user asks in HINDI (हिन्दी / देवनागरी लिपि) or romanized Hindi, you MUST reply entirely in natural HINDI script (हिन्दी में ही उत्तर दें).',
    '   - If the user asks in Telugu, Tamil, Malayalam, or Marathi, reply in that language.',
    '   - If the user asks in English, reply in English.',
    '3. Selected language preference: ' + langRule,
    '4. NEVER answer in English if the farmer asks in Kannada or Hindi. Respect their mother tongue completely.',
    'Tone & Format: Practical, respectful, concise, and easy to understand (3–6 clear sentences or short bullet points) so it also reads cleanly aloud via text-to-speech.',
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
    '=== REAL-TIME WEATHER & AGRONOMIC WEATHER ANALYSIS ===',
    `Irrigation Decision: ${ctx.water.decision} (Urgency: ${ctx.water.urgency}) — ${ctx.water.advice}`,
    `Estimated Volume: ${ctx.water.amount_mm ?? 0} mm (${ctx.water.amount_litres ? `${ctx.water.amount_litres.toLocaleString()} litres` : '0 litres'})`,
    `Current Real-Time Weather (${ctx.weather?.source || 'unavailable'} at ${ctx.weather?.fetched_at || 'N/A'}): ${ctx.weather ? `${ctx.weather.temp}°C (Feels like ${ctx.weather.apparent_temp}°C), ${ctx.weather.condition}, Humidity ${ctx.weather.humidity}%, Cloud Cover ${ctx.weather.cloud_cover}%, Wind ${ctx.weather.wind_speed_kmh} km/h (${ctx.weather.wind_speed} m/s), UV Max ${ctx.weather.uv_index}, 24h Rain Prob ${ctx.weather.rain_prob}%, 24h Expected Rain ${ctx.weather.rain_mm} mm` : 'Unavailable'}`,
    `Agronomic Weather Analysis: ${ctx.weather?.analysis ? `ET0 Evapotranspiration=${ctx.weather.analysis.evapotranspiration_mm} mm/day (${ctx.weather.analysis.evapotranspiration_level}), VPD=${ctx.weather.analysis.vpd_kpa} kPa, Heat Stress Risk=${ctx.weather.analysis.heat_stress_risk}, Fungal Disease Risk=${ctx.weather.analysis.fungal_disease_risk}, Spraying Window=${ctx.weather.analysis.spray_window} (${ctx.weather.analysis.spray_reason}), 24h Rain=${ctx.weather.analysis.next_24h_rain_mm} mm, 72h Rain=${ctx.weather.analysis.next_72h_rain_mm} mm. Summary: ${ctx.weather.analysis.summary}` : 'Unavailable'}`,
    `5-Day Live Forecast: ${forecastSummary}`,
    `Active Unread Alerts: ${alertsSummary}`,
    'IMPORTANT: Always answer weather, irrigation, spraying, pest/disease, and field scheduling questions using the exact REAL-TIME weather & agronomic weather analysis figures above.',
  ].join('\n');
}

/** Deterministic Fallback that supports English, Kannada, and Hindi */
function buildDeterministicFallback(message: string, language: string, ctx: AssistantContext): string {
  const q = message.toLowerCase();
  const lang = (language === 'auto' || !language) ? detectLanguageFromText(message).code : language;
  const firstName = ctx.farm.farmer_name.split(' ')[0] || 'Farmer';
  const moistureStr = ctx.latest ? `${ctx.latest.moisture}%` : '32%';
  const rainProb = ctx.weather?.rain_prob ?? 15;
  const rainMm = ctx.weather?.rain_mm ?? 0;
  const temp = ctx.weather?.temp ?? 28;
  const crop = ctx.farm.crop_type || 'Ragi';
  const soil = ctx.farm.soil_type || 'Red Loam';
  const isKannada = lang === 'kn';
  const isHindi = lang === 'hi';

  // 1. IRRIGATION / WATER / PUMP
  if (q.includes('irrigat') || q.includes('water') || q.includes('pump') || q.includes('neeru') || q.includes('ನೀರು') || q.includes('paani') || q.includes('पानी') || q.includes('ಸಿಂಚನ')) {
    if (ctx.water.decision === 'YES') {
      const litres = ctx.water.amount_litres ? ctx.water.amount_litres.toLocaleString() : '1,20,000';
      if (isKannada) {
        return `ಹೌದು ${firstName} ಅವರೇ, ನಿಮ್ಮ ${crop} ಬೆಳೆಗೆ ನೀರು ಹಾಯಿಸುವುದು ಅಗತ್ಯವಾಗಿದೆ. ಪ್ರಸ್ತುತ ಮಣ್ಣಿನ ತೇವಾಂಶವು ${moistureStr} ಗೆ ಇಳಿದಿದ್ದು, ಎಚ್ಚರಿಕೆ ಮಟ್ಟಕ್ಕಿಂತ (32%) ಕಡಿಮೆಯಿದೆ. ನಿಮ್ಮ ${ctx.farm.irrigation_type} ಮೂಲಕ ಸುಮಾರು ${ctx.water.amount_mm} ಮಿ.ಮೀ (${litres} ಲೀಟರ್) ನೀರನ್ನು ಮುಂದಿನ 12 ಗಂಟೆಗಳಲ್ಲಿ ಹಾಯಿಸಿ.`;
      }
      if (isHindi) {
        return `हाँ ${firstName} जी, आपकी ${crop} की फसल में सिंचाई की तुरंत आवश्यकता है। वर्तमान मिट्टी की नमी ${moistureStr} है, जो चेतावनी सीमा से नीचे आ गई है। अपनी ${ctx.farm.irrigation_type} प्रणाली द्वारा लगभग ${ctx.water.amount_mm} मिमी (${litres} लीटर) पानी दें।`;
      }
      return `Yes ${firstName}, irrigate your ${crop} field. Current moisture is ${moistureStr}, below the ${ctx.stress.thresholds.lowWarn}% warning band. Recommended depth is ${ctx.water.amount_mm} mm (~${litres} litres) via your ${ctx.farm.irrigation_type} system.`;
    }

    if (isKannada) {
      return `ಪ್ರಸ್ತುತ ನಿಮ್ಮ ${crop} ಜಮೀನಿನ ತೇವಾಂಶವು ${moistureStr} ರಷ್ಟಿದ್ದು ಉತ್ತಮ ಮಟ್ಟದಲ್ಲಿದೆ. ಮುಂಬರುವ ಹವಾಮಾನದಲ್ಲಿ ${rainProb}% ಮಳೆಯ ಸಾಧ್ಯತೆಯಿದೆ. ಈಗ ನೀರು ಹಾಯಿಸದೆ 24 ಗಂಟೆಗಳ ನಂತರ ಮಣ್ಣನ್ನು ಪರೀಕ್ಷಿಸಿ. ${ctx.water.advice}`;
    }
    if (isHindi) {
      return `वर्तमान में आपकी ${crop} की मिट्टी की नमी ${moistureStr} पर्याप्त स्तर पर है। आगामी मौसम में ${rainProb}% बारिश का अनुमान है। अभी अतिरिक्त सिंचाई की आवश्यकता नहीं है। ${ctx.water.advice}`;
    }
    return `Based on your current soil moisture (${moistureStr}) and weather forecast (${rainProb}% rain probability, ${rainMm} mm expected), you can wait. ${ctx.water.advice}`;
  }

  // 2. FERTILIZER / NUTRIENTS
  if (q.includes('fertil') || q.includes('urea') || q.includes('npk') || q.includes('manure') || q.includes('gobbar') || q.includes('ಗೊಬ್ಬರ') || q.includes('khad') || q.includes('खाद')) {
    if (isKannada) {
      return `${soil} ಮಣ್ಣಿನಲ್ಲಿ ಬೆಳೆಯುತ್ತಿರುವ ${crop} ಬೆಳೆಗೆ (${ctx.farm.growth_stage} ಹಂತ), ಮಣ್ಣು ತೇವವಾಗಿರುವಾಗ (ಪ್ರಸ್ತುತ ${moistureStr}) ಸಾರಜನಕ ಮತ್ತು ಪೊಟ್ಯಾಷ್ ಗೊಬ್ಬರವನ್ನು ಸಮತೋಲನದಲ್ಲಿ ಕೊಡಿ. ಭಾರಿ ಮಳೆ ಬರುವ ಮುನ್ನ ಯೂರಿಯಾವನ್ನು ಮಣ್ಣಿನ ಮೇಲೆ ಹರಡಬೇಡಿ.`;
    }
    if (isHindi) {
      return `${soil} मिट्टी में उगाई जा रही ${crop} फसल के लिए (${ctx.farm.growth_stage} अवस्था), मिट्टी में पर्याप्त नमी (वर्तमान ${moistureStr}) होने पर संतुलित यूरिया और एनपीके खाद दें। भारी बारिश से ठीक पहले खाद न डालें।`;
    }
    return `For ${crop} in ${soil} soil (${ctx.farm.growth_stage} stage, ${ctx.farm.field_dimension} ${ctx.farm.field_unit}), apply split nitrogen top-dressing when root moisture is optimal (currently ${moistureStr}). Avoid broadcasting urea right before heavy rain to prevent leaching.`;
  }

  // 3. PESTS / DISEASES
  if (q.includes('pest') || q.includes('disease') || q.includes('keeta') || q.includes('roga') || q.includes('ಕೀಟ') || q.includes('ರೋಗ') || q.includes('keeda') || q.includes('कीट') || q.includes('रोग')) {
    if (isKannada) {
      return `${temp}°C ತಾಪಮಾನ ಮತ್ತು ${ctx.weather?.humidity ?? 64}% ಆರ್ದ್ರತೆಯಲ್ಲಿ, ನಿಮ್ಮ ${crop} ಎಲೆಗಳನ್ನು ಮುಂಜಾನೆ ಪರೀಕ್ಷಿಸಿ. ಎಲೆಚುಕ್ಕೆ ಮತ್ತು ಕೀಟಗಳ ಬಾಧೆ ತಡೆಯಲು ಲೀಟರ್ ನೀರಿಗೆ 3 ಮಿ.ಲೀ ಬೇವಿನ ಎಣ್ಣೆ ಬೆರೆಸಿ ಮುಂಜಾನೆ ಸಿಂಪಡಿಸಿ.`;
    }
    if (isHindi) {
      return `${temp}°C तापमान और ${ctx.weather?.humidity ?? 64}% नमी के कारण अपनी ${crop} फसल की पत्तियों की नियमित जांच करें। कीटों और फफूंद से बचाव के लिए नीम के तेल (3 मिली/लीटर) का छिड़काव सुबह के समय करें।`;
    }
    return `At ${temp}°C and ${ctx.weather?.humidity ?? 64}% humidity, inspect your ${crop} leaves early morning for fungal spots or sap-sucking pests. Maintain balanced ${ctx.farm.irrigation_type} watering (moisture is ${moistureStr}) and consider neem-oil (3 ml/L) as a preventive organic spray.`;
  }

  // 4. SOIL MOISTURE DECREASE / TREND
  if (q.includes('decreas') || q.includes('drop') || q.includes('kam') || q.includes('kadime') || q.includes('ಕಡಿಮೆ') || q.includes('ಇಳಿಕೆ') || q.includes('कम')) {
    if (isKannada) {
      return `ನಿಮ್ಮ ${soil} ಜಮೀನಿನಲ್ಲಿ ತಾಪಮಾನ ${temp}°C ಇರುವುದರಿಂದ ಸಸ್ಯಗಳು ಬಾಷ್ಪೀಕರಣದ ಮೂಲಕ ನೀರನ್ನು ಬಳಸಿಕೊಳ್ಳುತ್ತಿವೆ. ಪ್ರಸ್ತುತ ತೇವಾಂಶವು ${moistureStr} ಆಗಿದೆ. ${ctx.heatmap.insight}`;
    }
    if (isHindi) {
      return `आपके ${soil} खेत में ${temp}°C तापमान के कारण वाष्पोत्सर्जन तेजी से हो रहा है, जिससे मिट्टी की नमी ${moistureStr} पर आ गई है। ${ctx.heatmap.insight}`;
    }
    return `Your ${soil} soil moisture is changing under ${temp}°C temperatures. Current moisture is ${moistureStr}. ${ctx.heatmap.insight}`;
  }

  // DEFAULT GREETING
  if (isKannada) {
    return `ನಮಸ್ಕಾರ ${firstName} ಅವರೇ! ನಿಮ್ಮ ${ctx.farm.location} ನಲ್ಲಿರುವ ${crop} ಜಮೀನಿನ ಮಣ್ಣಿನ ತೇವಾಂಶವು ಪ್ರಸ್ತುತ ${moistureStr} ರಷ್ಟಿದೆ ಮತ್ತು ಬೆಳೆ ಆರೋಗ್ಯ ${ctx.stress.status} ಆಗಿದೆ. ಹವಾಮಾನ ತಾಪಮಾನ ${temp}°C. ${ctx.water.advice}`;
  }
  if (isHindi) {
    return `नमस्ते ${firstName} जी! आपके ${ctx.farm.location} स्थित ${crop} के खेत में वर्तमान मिट्टी की नमी ${moistureStr} है और फसल की स्थिति ${ctx.stress.status} है। ${ctx.water.advice}`;
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
  detectedLanguage?: string;
}> {
  // Auto-detect language if 'auto' or not specified
  const detected = detectLanguageFromText(message);
  const activeLang = (language && language !== 'auto') ? language : detected.code;

  const apiKey = getGeminiApiKey();

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(activeLang, ctx);

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
            temperature: 0.35,
          },
        });

        const text = response.text?.trim();
        if (text) {
          return {
            reply: text,
            engine: 'gemini-live',
            model: modelName,
            detectedLanguage: activeLang,
          };
        }
      } catch (err) {
        lastErr = (err as Error).message;
        console.warn(`[Assistant] Model ${modelName} failed, trying next fallback:`, lastErr);
      }
    }

    return {
      reply: buildDeterministicFallback(message, activeLang, ctx),
      engine: 'agronomy-grounded',
      geminiError: lastErr,
      detectedLanguage: activeLang,
    };
  }

  return {
    reply: buildDeterministicFallback(message, activeLang, ctx),
    engine: 'agronomy-grounded',
    detectedLanguage: activeLang,
  };
}
