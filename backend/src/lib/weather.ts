import { resolveDistrictCoords } from './districts.js';

export interface DailyForecastItem {
  day: string;
  date: string;
  icon: 'sunny' | 'partly-sunny' | 'cloudy' | 'rainy';
  high: number;
  low: number;
  rain_mm: number;
  rain_prob: number;
}

export interface WeatherPayload {
  temp: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  rain_prob: number;
  rain_mm: number;
  location_name: string;
  source: 'met-norway-live' | 'fallback-cache';
  forecast: DailyForecastItem[];
  fetched_at: string;
}

interface CacheEntry {
  data: WeatherPayload;
  expiresAt: number;
}

const WEATHER_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60_000; // 10 minutes
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function estimateRainProb(symbolCode: string, rainMm: number, cloudPct: number): number {
  const sym = symbolCode.toLowerCase();
  if (rainMm >= 5 || sym.includes('heavyrain') || sym.includes('thunder')) return 85;
  if (rainMm >= 1.5 || sym.includes('rain')) return 65;
  if (rainMm > 0.1 || sym.includes('lightrain') || sym.includes('drizzle')) return 40;
  if (cloudPct >= 75) return 25;
  if (cloudPct >= 45) return 20;
  return 10;
}

function mapIcon(symbolCode: string, rainMm: number): DailyForecastItem['icon'] {
  const sym = symbolCode.toLowerCase();
  if (rainMm >= 0.5 || sym.includes('rain') || sym.includes('sleet') || sym.includes('thunder')) {
    return 'rainy';
  }
  if (sym.includes('clearsky') || sym.includes('fair')) return 'sunny';
  if (sym.includes('partlycloudy')) return 'partly-sunny';
  return 'cloudy';
}

function mapConditionLabel(symbolCode: string): string {
  const sym = symbolCode.toLowerCase();
  if (sym.includes('heavyrain')) return 'Heavy Rain';
  if (sym.includes('rain')) return 'Light Rain';
  if (sym.includes('clearsky')) return 'Clear Sky';
  if (sym.includes('fair')) return 'Mostly Sunny';
  if (sym.includes('partlycloudy')) return 'Partly Cloudy';
  return 'Cloudy';
}

function buildFallbackWeather(locationName: string): WeatherPayload {
  const today = new Date();
  const icons: DailyForecastItem['icon'][] = [
    'partly-sunny',
    'rainy',
    'sunny',
    'sunny',
    'partly-sunny',
  ];
  const highs = [28, 27, 26, 27, 28];
  const lows = [18, 19, 18, 19, 20];

  const forecast: DailyForecastItem[] = icons.map((icon, idx) => {
    const d = new Date(today.getTime() + idx * 86400_000);
    return {
      day: DAY_NAMES[d.getDay()],
      date: d.toISOString().slice(0, 10),
      icon,
      high: highs[idx],
      low: lows[idx],
      rain_mm: idx === 1 ? 2.4 : 0,
      rain_prob: idx === 1 ? 55 : 20,
    };
  });

  return {
    temp: 28,
    condition: 'Partly Cloudy',
    humidity: 64,
    wind_speed: 7,
    rain_prob: 20,
    rain_mm: 2.4,
    location_name: locationName,
    source: 'fallback-cache',
    forecast,
    fetched_at: new Date().toISOString(),
  };
}

export async function fetchKarnatakaWeather(locationInput?: string): Promise<WeatherPayload> {
  const coords = resolveDistrictCoords(locationInput);
  const cacheKey = `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}`;
  const cached = WEATHER_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${coords.latitude.toFixed(4)}&lon=${coords.longitude.toFixed(4)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RootSenseAgronomyApp/1.0 github.com/rootsense',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`MET Norway HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      properties?: {
        timeseries?: Array<{
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
            next_6_hours?: {
              summary?: { symbol_code?: string };
              details?: { precipitation_amount?: number };
            };
          };
        }>;
      };
    };

    const series = json.properties?.timeseries || [];
    if (series.length === 0) {
      throw new Error('Empty MET Norway timeseries');
    }

    const nowPt = series[0];
    const details = nowPt.data.instant.details;
    const symbol =
      nowPt.data.next_1_hours?.summary?.symbol_code ||
      nowPt.data.next_6_hours?.summary?.symbol_code ||
      'partlycloudy_day';
    const next24hRain = series.slice(0, 24).reduce((sum, pt) => {
      const mm = pt.data.next_1_hours?.details?.precipitation_amount ?? 0;
      return sum + mm;
    }, 0);

    const rainProb = estimateRainProb(
      symbol,
      next24hRain,
      details.cloud_area_fraction ?? 50
    );

    // Build 5-day forecast grouped by date
    const byDate = new Map<
      string,
      { temps: number[]; rainMm: number; symbols: string[]; maxCloud: number }
    >();
    const IST_OFFSET = 5.5 * 3600_000;

    for (const pt of series) {
      const istDate = new Date(new Date(pt.time).getTime() + IST_OFFSET);
      const dateStr = istDate.toISOString().slice(0, 10);
      const entry = byDate.get(dateStr) || {
        temps: [],
        rainMm: 0,
        symbols: [],
        maxCloud: 0,
      };
      if (typeof pt.data.instant.details.air_temperature === 'number') {
        entry.temps.push(pt.data.instant.details.air_temperature);
      }
      entry.rainMm +=
        pt.data.next_1_hours?.details?.precipitation_amount ??
        (pt.data.next_6_hours?.details?.precipitation_amount ?? 0) / 6;
      const s =
        pt.data.next_6_hours?.summary?.symbol_code ||
        pt.data.next_1_hours?.summary?.symbol_code;
      if (s) entry.symbols.push(s);
      entry.maxCloud = Math.max(
        entry.maxCloud,
        pt.data.instant.details.cloud_area_fraction ?? 0
      );
      byDate.set(dateStr, entry);
    }

    const forecast: DailyForecastItem[] = Array.from(byDate.entries())
      .slice(0, 5)
      .map(([dateStr, agg]) => {
        const dt = new Date(`${dateStr}T12:00:00Z`);
        const dominantSymbol = agg.symbols[Math.floor(agg.symbols.length / 2)] || 'partlycloudy_day';
        const high = agg.temps.length ? Math.round(Math.max(...agg.temps)) : 28;
        const low = agg.temps.length ? Math.round(Math.min(...agg.temps)) : 18;
        const mm = Number(agg.rainMm.toFixed(1));
        return {
          day: DAY_NAMES[dt.getUTCDay()],
          date: dateStr,
          icon: mapIcon(dominantSymbol, mm),
          high,
          low,
          rain_mm: mm,
          rain_prob: estimateRainProb(dominantSymbol, mm, agg.maxCloud),
        };
      });

    const payload: WeatherPayload = {
      temp: Math.round(details.air_temperature ?? 28),
      condition: mapConditionLabel(symbol),
      humidity: Math.round(details.relative_humidity ?? 64),
      wind_speed: Math.round(details.wind_speed ?? 7),
      rain_prob: rainProb,
      rain_mm: Number(next24hRain.toFixed(1)),
      location_name: locationInput?.trim() || `${coords.name}, Karnataka`,
      source: 'met-norway-live',
      forecast,
      fetched_at: new Date().toISOString(),
    };

    WEATHER_CACHE.set(cacheKey, {
      data: payload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return payload;
  } catch (err) {
    console.warn('[Weather] MET Norway unavailable, using fallback:', (err as Error).message);
    return buildFallbackWeather(locationInput?.trim() || `${coords.name}, Karnataka`);
  } finally {
    clearTimeout(timer);
  }
}
