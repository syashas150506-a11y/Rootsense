import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './assistant.js';
import type { FarmRow } from '../db/database.js';
import type { WeatherPayload } from './weather.js';

export interface CropCriticalStage {
  stage_name: string;
  day_start: number;
  day_end: number;
  criticality: 'CRITICAL' | 'HIGH' | 'MODERATE';
  water_need: string;
  key_risk: string;
  action_tip: string;
}

export interface SeedCalendarPrediction {
  crop: string;
  total_days_min: number;
  total_days_max: number;
  expected_yield: string;
  sowing_window: string;
  ideal_soil_temp: string;
  water_requirement_total: string;
  weather_advisory: string;
  stages: CropCriticalStage[];
  source: 'gemini-ai-live' | 'agronomy-reference';
  model?: string;
}

const GEMINI_CHAIN = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
];

const CALENDAR_CACHE = new Map<string, { data: SeedCalendarPrediction; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60_000;

const FALLBACK_CROPS: Record<string, Omit<SeedCalendarPrediction, 'weather_advisory' | 'source'>> = {
  Ragi: {
    crop: 'Ragi (Finger Millet)',
    total_days_min: 105,
    total_days_max: 120,
    expected_yield: '10–14 quintals/acre (2.5–3.5 t/ha)',
    sowing_window: 'June–August (Kharif) or Jan–Feb (Summer)',
    ideal_soil_temp: '24–30 °C',
    water_requirement_total: '350–450 mm across season',
    stages: [
      {
        stage_name: 'Germination & Establishment',
        day_start: 1,
        day_end: 15,
        criticality: 'HIGH',
        water_need: 'Light frequent moisture to prevent crusting',
        key_risk: 'Seedling desiccation & poor stand',
        action_tip: 'Keep top 5 cm soil uniformly moist; thin seedlings at Day 14.',
      },
      {
        stage_name: 'Active Tillering',
        day_start: 16,
        day_end: 45,
        criticality: 'CRITICAL',
        water_need: 'Moderate steady root moisture (>32%)',
        key_risk: 'Reduced tiller count under moisture stress',
        action_tip: 'Apply split nitrogen top-dressing and hand-weed around Day 25.',
      },
      {
        stage_name: 'Earhead Initiation & Flowering',
        day_start: 46,
        day_end: 75,
        criticality: 'CRITICAL',
        water_need: 'Peak water demand (>37% moisture)',
        key_risk: 'Chaffy grains & Leaf/Neck Blast fungus',
        action_tip: 'Do not allow drought stress; scout leaves early for blast lesions.',
      },
      {
        stage_name: 'Grain Filling & Dough Stage',
        day_start: 76,
        day_end: 98,
        criticality: 'HIGH',
        water_need: 'Moderate moisture for grain weight',
        key_risk: 'Shriveled grains if soil dries below 28%',
        action_tip: 'Maintain light drip cycles; avoid lodging from heavy flooding.',
      },
      {
        stage_name: 'Physiological Maturity & Harvest',
        day_start: 99,
        day_end: 115,
        criticality: 'MODERATE',
        water_need: 'Withhold irrigation 10–12 days before harvest',
        key_risk: 'Earhead shattering or pre-harvest sprouting in rain',
        action_tip: 'Harvest when 80% of earheads turn golden-brown; dry grains to <12% moisture.',
      },
    ],
  },
  Maize: {
    crop: 'Maize (Corn)',
    total_days_min: 95,
    total_days_max: 115,
    expected_yield: '22–28 quintals/acre (5.5–7.0 t/ha)',
    sowing_window: 'June–July (Kharif) or Oct–Nov (Rabi)',
    ideal_soil_temp: '22–32 °C',
    water_requirement_total: '500–650 mm across season',
    stages: [
      {
        stage_name: 'Emergence & Seedling',
        day_start: 1,
        day_end: 14,
        criticality: 'HIGH',
        water_need: 'Uniform topsoil moisture without waterlogging',
        key_risk: 'Root rot in standing water & Fall Armyworm',
        action_tip: 'Ensure proper drainage; inspect whorls at Day 12 for Fall Armyworm.',
      },
      {
        stage_name: 'Knee-High Vegetative Growth',
        day_start: 15,
        day_end: 42,
        criticality: 'HIGH',
        water_need: 'Keep root moisture above 40%',
        key_risk: 'Nitrogen deficiency & stem borer',
        action_tip: 'Apply second nitrogen split at Day 30 and earth up ridges.',
      },
      {
        stage_name: 'Tasseling & Silking (Pollination)',
        day_start: 43,
        day_end: 65,
        criticality: 'CRITICAL',
        water_need: 'Peak water sensitivity (>45% moisture)',
        key_risk: 'Up to 40% yield loss from heat or drought stress',
        action_tip: 'Never skip irrigation during silking; avoid spraying during morning pollination.',
      },
      {
        stage_name: 'Blister & Grain Filling',
        day_start: 66,
        day_end: 90,
        criticality: 'CRITICAL',
        water_need: 'Steady deep root-zone watering',
        key_risk: 'Poor cob tip filling & stalk lodging',
        action_tip: 'Maintain consistent soil moisture until milk line reaches 75%.',
      },
      {
        stage_name: 'Dry-Down & Harvest',
        day_start: 91,
        day_end: 110,
        criticality: 'MODERATE',
        water_need: 'Stop irrigation once black layer forms',
        key_risk: 'Cob rot if left wet after maturity',
        action_tip: 'Harvest when husks turn papery brown and kernels harden.',
      },
    ],
  },
  Tomato: {
    crop: 'Tomato',
    total_days_min: 95,
    total_days_max: 125,
    expected_yield: '120–180 quintals/acre (30–45 t/ha)',
    sowing_window: 'Year-round (best: June–July, Oct–Nov, Jan–Feb)',
    ideal_soil_temp: '20–28 °C',
    water_requirement_total: '450–600 mm (Drip recommended)',
    stages: [
      {
        stage_name: 'Nursery & Transplant Establishment',
        day_start: 1,
        day_end: 25,
        criticality: 'HIGH',
        water_need: 'Light daily drip moisture (>48%)',
        key_risk: 'Transplant shock & damping-off fungus',
        action_tip: 'Transplant 21–25 day seedlings in evening; apply light root drench.',
      },
      {
        stage_name: 'Vegetative & Branching',
        day_start: 26,
        day_end: 45,
        criticality: 'MODERATE',
        water_need: 'Consistent moisture without wet foliage',
        key_risk: 'Leaf curl virus (whitefly) & early blight',
        action_tip: 'Stake plants, install yellow sticky traps, apply balanced NPK.',
      },
      {
        stage_name: 'Flowering & Fruit Set',
        day_start: 46,
        day_end: 70,
        criticality: 'CRITICAL',
        water_need: 'Strict moisture stability (>53%)',
        key_risk: 'Flower drop under heat >34°C or dry spells',
        action_tip: 'Run short frequent drip pulses; apply boron & calcium spray.',
      },
      {
        stage_name: 'Fruit Enlargement & Ripening',
        day_start: 71,
        day_end: 100,
        criticality: 'CRITICAL',
        water_need: 'Even moisture — avoid dry-to-wet swings',
        key_risk: 'Blossom-end rot, fruit cracking & fruit borer',
        action_tip: 'Avoid sudden heavy watering after dryness; monitor pheromone traps.',
      },
      {
        stage_name: 'Multi-Pick Harvesting',
        day_start: 101,
        day_end: 125,
        criticality: 'HIGH',
        water_need: 'Moderate irrigation between pickings',
        key_risk: 'Sunscald & post-harvest bruising',
        action_tip: 'Harvest at breaker-to-pink stage during cool morning hours every 3–4 days.',
      },
    ],
  },
  Paddy: {
    crop: 'Paddy (Rice)',
    total_days_min: 115,
    total_days_max: 135,
    expected_yield: '20–26 quintals/acre (5.0–6.5 t/ha)',
    sowing_window: 'June–August (Kharif) or Dec–Jan (Summer)',
    ideal_soil_temp: '24–32 °C',
    water_requirement_total: '1100–1300 mm across season',
    stages: [
      {
        stage_name: 'Nursery & Transplanting',
        day_start: 1,
        day_end: 25,
        criticality: 'HIGH',
        water_need: 'Shallow 2 cm standing film after transplant',
        key_risk: 'Seedling mortality & weed competition',
        action_tip: 'Transplant 21-day seedlings; keep soil saturated continuously.',
      },
      {
        stage_name: 'Active Tillering',
        day_start: 26,
        day_end: 55,
        criticality: 'CRITICAL',
        water_need: 'Alternate wetting & drying (AWD) or 2–3 cm depth',
        key_risk: 'Low productive tillers & stem borer',
        action_tip: 'Apply top-dressed urea after draining briefly; maintain >62% moisture.',
      },
      {
        stage_name: 'Panicle Initiation & Booting',
        day_start: 56,
        day_end: 85,
        criticality: 'CRITICAL',
        water_need: 'Highest sensitivity — keep 3–5 cm standing water',
        key_risk: 'Severe spikelet sterility if soil dries out',
        action_tip: 'Never let field crack; scout for Brown Plant Hopper & Blast.',
      },
      {
        stage_name: 'Flowering & Milk-Dough Grain Fill',
        day_start: 86,
        day_end: 110,
        criticality: 'CRITICAL',
        water_need: 'Continuous saturation (>67% moisture)',
        key_risk: 'Unfilled grains & sheath blight',
        action_tip: 'Maintain thin water film until hard-dough stage.',
      },
      {
        stage_name: 'Drainage & Harvest',
        day_start: 111,
        day_end: 130,
        criticality: 'MODERATE',
        water_need: 'Drain field completely 12–15 days pre-harvest',
        key_risk: 'Lodging & grain shattering if delayed',
        action_tip: 'Harvest when 85% of panicles turn straw-yellow.',
      },
    ],
  },
};

function buildFallbackCalendar(
  cropInput: string,
  farm: FarmRow,
  weather: WeatherPayload | null
): SeedCalendarPrediction {
  const cleanKey = Object.keys(FALLBACK_CROPS).find((k) =>
    cropInput.toLowerCase().includes(k.toLowerCase())
  );
  const template = cleanKey
    ? FALLBACK_CROPS[cleanKey]
    : {
        crop: cropInput,
        total_days_min: 100,
        total_days_max: 120,
        expected_yield: 'Region-dependent (check local KVK benchmark)',
        sowing_window: 'Kharif (June–July) or Rabi (Oct–Nov)',
        ideal_soil_temp: '22–30 °C',
        water_requirement_total: '450–600 mm across season',
        stages: [
          {
            stage_name: 'Germination & Establishment',
            day_start: 1,
            day_end: 15,
            criticality: 'HIGH' as const,
            water_need: 'Light uniform topsoil moisture',
            key_risk: 'Poor emergence from dry topsoil',
            action_tip: 'Ensure fine seedbed and consistent moisture during germination.',
          },
          {
            stage_name: 'Vegetative Canopy Growth',
            day_start: 16,
            day_end: 45,
            criticality: 'HIGH' as const,
            water_need: 'Steady root-zone moisture',
            key_risk: 'Weed competition & early nutrient deficit',
            action_tip: 'Weed by Day 25 and apply split nitrogen dressing.',
          },
          {
            stage_name: 'Flowering & Pollination',
            day_start: 46,
            day_end: 75,
            criticality: 'CRITICAL' as const,
            water_need: 'Peak water demand — prevent stress',
            key_risk: 'Flower abortion & sharp yield drop',
            action_tip: 'Prioritize timely irrigation and inspect for pests.',
          },
          {
            stage_name: 'Yield Formation & Filling',
            day_start: 76,
            day_end: 100,
            criticality: 'CRITICAL' as const,
            water_need: 'Balanced moisture for size/weight',
            key_risk: 'Undersized produce under drought',
            action_tip: 'Maintain steady drip/root watering; avoid waterlogging.',
          },
          {
            stage_name: 'Maturation & Harvest',
            day_start: 101,
            day_end: 115,
            criticality: 'MODERATE' as const,
            water_need: 'Reduce irrigation prior to harvest',
            key_risk: 'Quality loss from late rain or delayed harvest',
            action_tip: 'Harvest at physiological maturity during dry morning hours.',
          },
        ],
      };

  const weatherAdvisory = weather
    ? `Current weather in ${farm.location} is ${weather.temp}°C (${weather.condition}), ${weather.humidity}% RH, ET₀ ${weather.analysis.evapotranspiration_mm} mm/day. ${weather.analysis.summary}`
    : `Tailored for ${farm.soil_type} soil in ${farm.location}.`;

  return {
    ...template,
    weather_advisory: weatherAdvisory,
    source: 'agronomy-reference',
  };
}

export async function predictSeedCalendar(
  cropName: string,
  farm: FarmRow,
  weather: WeatherPayload | null
): Promise<SeedCalendarPrediction> {
  const cleanCrop = cropName.trim() || farm.crop_type || 'Ragi';
  const cacheKey = `${cleanCrop.toLowerCase()}|${farm.soil_type.toLowerCase()}|${farm.location.toLowerCase()}`;
  const cached = CALENDAR_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const apiKey = getGeminiApiKey();
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const weatherContext = weather
      ? `Current weather: ${weather.temp}°C, ${weather.condition}, ${weather.humidity}% humidity, 72h rain ${weather.analysis.next_72h_rain_mm} mm, ET0 ${weather.analysis.evapotranspiration_mm} mm/day.`
      : 'Weather unavailable.';

    const prompt = [
      `Generate an accurate agronomic Seed Calendar and Critical Growth Stages prediction for "${cleanCrop}" grown in ${farm.location} (${farm.soil_type} soil, ${farm.irrigation_type} irrigation).`,
      weatherContext,
      'Return ONLY valid JSON matching this exact structure (no markdown fences):',
      '{',
      '  "crop": "string (display name)",',
      '  "total_days_min": number,',
      '  "total_days_max": number,',
      '  "expected_yield": "string (e.g. 12-15 quintals/acre)",',
      '  "sowing_window": "string (best sowing months for this region)",',
      '  "ideal_soil_temp": "string (e.g. 24-30 °C)",',
      '  "water_requirement_total": "string (e.g. 400-500 mm)",',
      '  "weather_advisory": "string (1-2 concise sentences factoring in current weather above)",',
      '  "stages": [',
      '    {',
      '      "stage_name": "string",',
      '      "day_start": number,',
      '      "day_end": number,',
      '      "criticality": "CRITICAL" | "HIGH" | "MODERATE",',
      '      "water_need": "string (short concise guidance)",',
      '      "key_risk": "string (main pest/disease/stress risk)",',
      '      "action_tip": "string (1 clear practical farmer action)"',
      '    }',
      '  ]',
      '}',
      'Provide 5 chronological stages covering Day 1 through harvest.',
    ].join('\n');

    for (const modelName of Array.from(new Set(GEMINI_CHAIN))) {
      try {
        const res = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        const raw = res.text?.trim();
        if (!raw) continue;

        const parsed = JSON.parse(raw) as Partial<SeedCalendarPrediction>;
        if (
          parsed.crop &&
          typeof parsed.total_days_min === 'number' &&
          typeof parsed.total_days_max === 'number' &&
          Array.isArray(parsed.stages) &&
          parsed.stages.length >= 3
        ) {
          const result: SeedCalendarPrediction = {
            crop: parsed.crop,
            total_days_min: Math.max(20, Math.round(parsed.total_days_min)),
            total_days_max: Math.max(30, Math.round(parsed.total_days_max)),
            expected_yield: parsed.expected_yield || 'Region-dependent yield',
            sowing_window: parsed.sowing_window || 'Kharif / Rabi',
            ideal_soil_temp: parsed.ideal_soil_temp || '22–30 °C',
            water_requirement_total: parsed.water_requirement_total || '450–600 mm',
            weather_advisory:
              parsed.weather_advisory ||
              `Calibrated for ${farm.location} (${farm.soil_type} soil).`,
            stages: parsed.stages.map((s) => ({
              stage_name: String(s.stage_name || 'Growth Stage'),
              day_start: Number(s.day_start) || 1,
              day_end: Number(s.day_end) || 30,
              criticality:
                s.criticality === 'CRITICAL' || s.criticality === 'HIGH'
                  ? s.criticality
                  : 'MODERATE',
              water_need: String(s.water_need || 'Moderate moisture'),
              key_risk: String(s.key_risk || 'Moisture or pest stress'),
              action_tip: String(s.action_tip || 'Monitor field regularly.'),
            })),
            source: 'gemini-ai-live',
            model: modelName,
          };

          CALENDAR_CACHE.set(cacheKey, {
            data: result,
            expiresAt: Date.now() + CACHE_TTL_MS,
          });
          return result;
        }
      } catch (err) {
        console.warn(`[SeedCalendar] Model ${modelName} failed:`, (err as Error).message);
      }
    }
  }

  const fallback = buildFallbackCalendar(cleanCrop, farm, weather);
  CALENDAR_CACHE.set(cacheKey, { data: fallback, expiresAt: Date.now() + 5 * 60_000 });
  return fallback;
}
