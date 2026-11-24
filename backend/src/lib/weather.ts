import { resolveDistrictCoords } from './districts.js';

export interface DailyForecastItem {
  day: string;
  date: string;
  icon: 'sunny' | 'partly-sunny' | 'cloudy' | 'rainy';
  condition: string;
  high: number;
  low: number;
  rain_mm: number;
  rain_prob: number;
  et0_mm: number;
  uv_max: number;
  wind_max_kmh: number;
}

export interface WeatherAnalysis {
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

export interface WeatherPayload {
  temp: number;
  apparent_temp: number;
  condition: string;
  icon: 'sunny' | 'partly-sunny' | 'cloudy' | 'rainy';
  humidity: number;
  cloud_cover: number;
  wind_speed: number; // m/s
  wind_speed_kmh: number;
  uv_index: number;
  rain_prob: number;
  rain_mm: number; // next 24h expected rainfall
  location_name: string;
  latitude: number;
  longitude: number;
  source: 'open-meteo-live' | 'met-norway-live';
  forecast: DailyForecastItem[];
  analysis: WeatherAnalysis;
  fetched_at: string;
}

interface CacheEntry {
  data: WeatherPayload;
  expiresAt: number;
}

const WEATHER_CACHE = new Map<string, CacheEntry>();
const GEOCODE_CACHE = new Map<string, { name: string; latitude: number; longitude: number }>();
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes for fresh real-time telemetry
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function decodeWmoCode(code: number): {
  condition: string;
  icon: 'sunny' | 'partly-sunny' | 'cloudy' | 'rainy';
} {
  if (code === 0) return { condition: 'Clear Sky', icon: 'sunny' };
  if (code === 1) return { condition: 'Mostly Clear', icon: 'sunny' };
  if (code === 2) return { condition: 'Partly Cloudy', icon: 'partly-sunny' };
  if (code === 3) return { condition: 'Overcast', icon: 'cloudy' };
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: 'cloudy' };
  if (code >= 51 && code <= 57) return { condition: 'Light Drizzle', icon: 'rainy' };
  if (code >= 61 && code <= 63) return { condition: 'Light Rain', icon: 'rainy' };
  if (code >= 65 && code <= 67) return { condition: 'Heavy Rain', icon: 'rainy' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: 'rainy' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: 'rainy' };
  return { condition: 'Partly Cloudy', icon: 'partly-sunny' };
}

function computeVpdKpa(tempC: number, rhPct: number): number {
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const vpd = svp * (1 - Math.max(0, Math.min(100, rhPct)) / 100);
  return Number(Math.max(0, vpd).toFixed(2));
}

function buildAgronomicAnalysis(params: {
  temp: number;
  dayMaxTemp: number;
  humidity: number;
  windKmh: number;
  rainProb: number;
  next24hRainMm: number;
  next72hRainMm: number;
  et0Mm: number;
}): WeatherAnalysis {
  const { temp, dayMaxTemp, humidity, windKmh, rainProb, next24hRainMm, next72hRainMm, et0Mm } =
    params;

  const vpdKpa = computeVpdKpa(temp, humidity);

  const etLevel: WeatherAnalysis['evapotranspiration_level'] =
    et0Mm >= 5.0 ? 'High' : et0Mm >= 3.5 ? 'Moderate' : 'Low';

  let heatRisk: WeatherAnalysis['heat_stress_risk'] = 'Low';
  if (dayMaxTemp >= 35 || (dayMaxTemp >= 33 && humidity < 45) || vpdKpa >= 2.2) {
    heatRisk = 'High';
  } else if (dayMaxTemp >= 31 || vpdKpa >= 1.5) {
    heatRisk = 'Moderate';
  }

  let fungalRisk: WeatherAnalysis['fungal_disease_risk'] = 'Low';
  if (humidity >= 80 && temp >= 18 && temp <= 31 && (next24hRainMm >= 2 || rainProb >= 55)) {
    fungalRisk = 'High';
  } else if (humidity >= 72 || next24hRainMm >= 1.5 || rainProb >= 40) {
    fungalRisk = 'Moderate';
  }

  let sprayWindow: WeatherAnalysis['spray_window'] = 'Good';
  let sprayReason = `Calm winds (${windKmh.toFixed(1)} km/h) and low rain wash-off risk (${rainProb}%).`;
  if (rainProb >= 50 || next24hRainMm >= 2.5) {
    sprayWindow = 'Avoid';
    sprayReason = `High rain wash-off risk (${rainProb}%, ${next24hRainMm} mm expected in 24h).`;
  } else if (windKmh >= 18) {
    sprayWindow = 'Avoid';
    sprayReason = `High wind speed (${windKmh.toFixed(1)} km/h) will cause spray drift.`;
  } else if (windKmh >= 12 || rainProb >= 30) {
    sprayWindow = 'Caution';
    sprayReason = `Moderate wind (${windKmh.toFixed(1)} km/h) or light shower chance (${rainProb}%). Spray early morning.`;
  }

  const rainPart =
    next24hRainMm >= 2.0 || rainProb >= 45
      ? `Rain is likely within 24h (${rainProb}%, ~${next24hRainMm} mm), helping replenish soil moisture.`
      : next72hRainMm >= 3.0
      ? `Dry today (${rainProb}% rain), with ~${next72hRainMm} mm rainfall forecast over the next 3 days.`
      : `Dry spell ahead with minimal rain (${next72hRainMm} mm over 72h) and ${et0Mm.toFixed(1)} mm/day crop water loss (ET₀).`;

  const actionPart =
    heatRisk === 'High'
      ? `High daytime heat (${dayMaxTemp}°C) elevates evaporation—schedule irrigation at dawn or dusk.`
      : fungalRisk === 'High'
      ? `Elevated humidity (${humidity}%) increases fungal blight risk—avoid overhead evening watering.`
      : `Spray window is ${sprayWindow.toLowerCase()} (${windKmh.toFixed(1)} km/h wind) with ${heatRisk.toLowerCase()} heat stress.`;

  return {
    evapotranspiration_mm: Number(et0Mm.toFixed(2)),
    evapotranspiration_level: etLevel,
    vpd_kpa: vpdKpa,
    heat_stress_risk: heatRisk,
    fungal_disease_risk: fungalRisk,
    spray_window: sprayWindow,
    spray_reason: sprayReason,
    next_24h_rain_mm: Number(next24hRainMm.toFixed(1)),
    next_72h_rain_mm: Number(next72hRainMm.toFixed(1)),
    summary: `${rainPart} ${actionPart}`,
  };
}

export async function geocodeLocation(
  locationInput?: string
): Promise<{ name: string; latitude: number; longitude: number }> {
  const clean = (locationInput || '').trim();
  if (!clean) {
    const def = resolveDistrictCoords();
    return { name: `${def.name}, Karnataka`, latitude: def.latitude, longitude: def.longitude };
  }

  const cacheKey = clean.toLowerCase();
  const cached = GEOCODE_CACHE.get(cacheKey);
  if (cached) return cached;

  // Check known Karnataka districts first for instant accuracy
  const district = resolveDistrictCoords(clean);
  if (clean.toLowerCase().includes(district.name.toLowerCase())) {
    const resolved = {
      name: clean,
      latitude: district.latitude,
      longitude: district.longitude,
    };
    GEOCODE_CACHE.set(cacheKey, resolved);
    return resolved;
  }

  // Query free Open-Meteo Geocoding API for any custom city/town/village
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const queryTerm = clean.split(',')[0].trim();
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryTerm)}&count=1&language=en&format=json`;
    const res = await fetch(url, { signal: controller.signal });
    if (res.ok) {
      const json = (await res.json()) as {
        results?: {
          name: string;
          admin1?: string;
          latitude: number;
          longitude: number;
        }[];
      };
      const top = json.results?.[0];
      if (top) {
        const resolved = {
          name: top.admin1 ? `${top.name}, ${top.admin1}` : top.name,
          latitude: top.latitude,
          longitude: top.longitude,
        };
        GEOCODE_CACHE.set(cacheKey, resolved);
        return resolved;
      }
    }
  } catch {
    // fallback below
  } finally {
    clearTimeout(timer);
  }

  return {
    name: clean,
    latitude: district.latitude,
    longitude: district.longitude,
  };
}

async function fetchOpenMeteo(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<WeatherPayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m` +
      `&hourly=precipitation_probability,precipitation` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,uv_index_max,wind_speed_10m_max` +
      `&timezone=Asia%2FKolkata&forecast_days=5`;

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        apparent_temperature?: number;
        precipitation?: number;
        weather_code?: number;
        cloud_cover?: number;
        wind_speed_10m?: number;
      };
      hourly?: {
        time?: string[];
        precipitation_probability?: number[];
        precipitation?: number[];
      };
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_sum?: number[];
        precipitation_probability_max?: number[];
        et0_fao_evapotranspiration?: number[];
        uv_index_max?: number[];
        wind_speed_10m_max?: number[];
      };
    };

    const cur = json.current;
    const daily = json.daily;
    if (!cur || !daily?.time?.length) {
      throw new Error('Incomplete Open-Meteo response');
    }

    const curDecoded = decodeWmoCode(cur.weather_code ?? 2);
    const windKmh = Number((cur.wind_speed_10m ?? 7).toFixed(1));
    const windMs = Number((windKmh / 3.6).toFixed(1));

    // Calculate exact next 24 hours precipitation & peak probability from hourly series
    let next24hRainMm = 0;
    let next24hRainProb = daily.precipitation_probability_max?.[0] ?? 0;

    if (json.hourly?.time?.length) {
      const nowMs = Date.now();
      let count24 = 0;
      let maxProb = 0;
      for (let i = 0; i < json.hourly.time.length && count24 < 24; i++) {
        // Open-Meteo returns IST local timestamps when timezone=Asia/Kolkata
        const tMs = Date.parse(`${json.hourly.time[i]}+05:30`);
        if (tMs >= nowMs - 3600_000) {
          next24hRainMm += json.hourly.precipitation?.[i] ?? 0;
          maxProb = Math.max(maxProb, json.hourly.precipitation_probability?.[i] ?? 0);
          count24++;
        }
      }
      next24hRainProb = Math.round(maxProb);
    }

    const forecast: DailyForecastItem[] = daily.time.slice(0, 5).map((dateStr, idx) => {
      const dt = new Date(`${dateStr}T12:00:00Z`);
      const dec = decodeWmoCode(daily.weather_code?.[idx] ?? 2);
      return {
        day: DAY_NAMES[dt.getUTCDay()],
        date: dateStr,
        icon: dec.icon,
        condition: dec.condition,
        high: Math.round(daily.temperature_2m_max?.[idx] ?? 28),
        low: Math.round(daily.temperature_2m_min?.[idx] ?? 18),
        rain_mm: Number((daily.precipitation_sum?.[idx] ?? 0).toFixed(1)),
        rain_prob: Math.round(daily.precipitation_probability_max?.[idx] ?? 0),
        et0_mm: Number((daily.et0_fao_evapotranspiration?.[idx] ?? 4.2).toFixed(2)),
        uv_max: Number((daily.uv_index_max?.[idx] ?? 6).toFixed(1)),
        wind_max_kmh: Number((daily.wind_speed_10m_max?.[idx] ?? 10).toFixed(1)),
      };
    });

    const next72hRainMm = forecast
      .slice(0, 3)
      .reduce((acc, d) => acc + d.rain_mm, 0);

    const todayEt0 = forecast[0]?.et0_mm ?? 4.2;
    const todayMax = forecast[0]?.high ?? Math.round(cur.temperature_2m ?? 28);
    const todayUv = forecast[0]?.uv_max ?? 6;
    const tempRounded = Math.round(cur.temperature_2m ?? 26);
    const humidityRounded = Math.round(cur.relative_humidity_2m ?? 60);

    const analysis = buildAgronomicAnalysis({
      temp: cur.temperature_2m ?? tempRounded,
      dayMaxTemp: todayMax,
      humidity: humidityRounded,
      windKmh,
      rainProb: next24hRainProb,
      next24hRainMm,
      next72hRainMm,
      et0Mm: todayEt0,
    });

    return {
      temp: tempRounded,
      apparent_temp: Math.round(cur.apparent_temperature ?? tempRounded),
      condition: curDecoded.condition,
      icon: curDecoded.icon,
      humidity: humidityRounded,
      cloud_cover: Math.round(cur.cloud_cover ?? 25),
      wind_speed: windMs,
      wind_speed_kmh: windKmh,
      uv_index: todayUv,
      rain_prob: next24hRainProb,
      rain_mm: Number(next24hRainMm.toFixed(1)),
      location_name: locationName,
      latitude,
      longitude,
      source: 'open-meteo-live',
      forecast,
      analysis,
      fetched_at: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMetNorwaySecondary(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<WeatherPayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RootSenseAgronomyApp/1.0 github.com/rootsense',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`MET Norway HTTP ${res.status}`);

    const json = (await res.json()) as {
      properties?: {
        timeseries?: {
          time: string;
          data: {
            instant: {
              details: {
                air_temperature?: number;
                relative_humidity?: number;
                wind_speed?: number;
                cloud_area_fraction?: number;
              };
            };
            next_1_hours?: {
              summary?: { symbol_code?: string };
              details?: { precipitation_amount?: number };
            };
          };
        }[];
      };
    };

    const series = json.properties?.timeseries || [];
    if (!series.length) throw new Error('Empty MET Norway series');

    const nowPt = series[0];
    const det = nowPt.data.instant.details;
    const temp = Math.round(det.air_temperature ?? 26);
    const humidity = Math.round(det.relative_humidity ?? 60);
    const windMs = Number((det.wind_speed ?? 2.5).toFixed(1));
    const windKmh = Number((windMs * 3.6).toFixed(1));
    const next24hRain = Number(
      series
        .slice(0, 24)
        .reduce((s, p) => s + (p.data.next_1_hours?.details?.precipitation_amount ?? 0), 0)
        .toFixed(1)
    );
    const rainProb = next24hRain >= 3 ? 75 : next24hRain > 0.2 ? 45 : 10;

    const forecast: DailyForecastItem[] = Array.from({ length: 5 }, (_, idx) => {
      const dt = new Date(Date.now() + idx * 86400_000);
      return {
        day: DAY_NAMES[dt.getDay()],
        date: dt.toISOString().slice(0, 10),
        icon: next24hRain > 0.5 && idx === 0 ? 'rainy' : 'partly-sunny',
        condition: next24hRain > 0.5 && idx === 0 ? 'Light Rain' : 'Partly Cloudy',
        high: temp + 4,
        low: Math.max(12, temp - 6),
        rain_mm: idx === 0 ? next24hRain : 0,
        rain_prob: idx === 0 ? rainProb : 15,
        et0_mm: 4.3,
        uv_max: 6.5,
        wind_max_kmh: windKmh,
      };
    });

    const analysis = buildAgronomicAnalysis({
      temp,
      dayMaxTemp: temp + 4,
      humidity,
      windKmh,
      rainProb,
      next24hRainMm: next24hRain,
      next72hRainMm: next24hRain,
      et0Mm: 4.3,
    });

    return {
      temp,
      apparent_temp: temp,
      condition: next24hRain > 0.5 ? 'Light Rain' : 'Partly Cloudy',
      icon: next24hRain > 0.5 ? 'rainy' : 'partly-sunny',
      humidity,
      cloud_cover: Math.round(det.cloud_area_fraction ?? 35),
      wind_speed: windMs,
      wind_speed_kmh: windKmh,
      uv_index: 6.5,
      rain_prob: rainProb,
      rain_mm: next24hRain,
      location_name: locationName,
      latitude,
      longitude,
      source: 'met-norway-live',
      forecast,
      analysis,
      fetched_at: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchKarnatakaWeather(
  locationInput?: string,
  explicitLat?: number,
  explicitLon?: number
): Promise<WeatherPayload> {
  let lat = explicitLat;
  let lon = explicitLon;
  let locationName = locationInput?.trim() || 'Tumakuru, Karnataka';

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    const geo = await geocodeLocation(locationInput);
    lat = geo.latitude;
    lon = geo.longitude;
    locationName = locationInput?.trim() || geo.name;
  }

  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = WEATHER_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.data, location_name: locationName };
  }

  try {
    const live = await fetchOpenMeteo(lat, lon, locationName);
    WEATHER_CACHE.set(cacheKey, { data: live, expiresAt: Date.now() + CACHE_TTL_MS });
    return live;
  } catch (openMeteoErr) {
    console.warn(
      '[Weather] Open-Meteo error, trying MET Norway secondary live API:',
      (openMeteoErr as Error).message
    );
    const metLive = await fetchMetNorwaySecondary(lat, lon, locationName);
    WEATHER_CACHE.set(cacheKey, { data: metLive, expiresAt: Date.now() + CACHE_TTL_MS });
    return metLive;
  }
}
