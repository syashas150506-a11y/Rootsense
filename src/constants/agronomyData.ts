import { CropOption, SoilOption, IrrigationOption } from '../types/farm';

export const CROPS: CropOption[] = [
  {
    id: 'Ragi',
    name: 'Ragi (Finger Millet)',
    localName: 'ರಾಗಿ',
    description: 'Drought hardy dryland millet with deep fibrous root system',
    baseLowCritical: 22,
    baseLowWarn: 32,
    baseHighWarn: 75,
    icon: 'grain',
  },
  {
    id: 'Maize',
    name: 'Maize (Corn)',
    localName: 'ಮೆಕ್ಕೆಜೋಳ',
    description: 'Medium water-demand cereal sensitive at silking & grain-fill',
    baseLowCritical: 28,
    baseLowWarn: 40,
    baseHighWarn: 80,
    icon: 'corn',
  },
  {
    id: 'Tomato',
    name: 'Tomato',
    localName: 'ಟೊಮೆಟೊ',
    description: 'High-value horticultural crop vulnerable to moisture stress',
    baseLowCritical: 35,
    baseLowWarn: 48,
    baseHighWarn: 82,
    icon: 'fruit-cherries',
  },
  {
    id: 'Paddy',
    name: 'Paddy (Rice)',
    localName: 'ಭತ್ತ',
    description: 'Semi-aquatic high water-demand crop requiring constant root moisture',
    baseLowCritical: 48,
    baseLowWarn: 62,
    baseHighWarn: 94,
    icon: 'rice',
  },
];

export const SOIL_TYPES: SoilOption[] = [
  {
    id: 'Red Loam',
    name: 'Red Loam',
    localName: 'ಕೆಂಪು ಗೋಡು ಮಣ್ಣು',
    description: 'Well-draining, moderately friable with balanced aeration (0% offset)',
    offset: 0,
    drainage: 'Moderate',
    icon: 'terrain',
  },
  {
    id: 'Black Cotton',
    name: 'Black Cotton',
    localName: 'ಕಪ್ಪು ಹತ್ತಿ ಮಣ್ಣು',
    description: 'High montmorillonite clay with maximum water retention (+4% offset)',
    offset: 4,
    drainage: 'Slow / High Retention',
    icon: 'water-percent',
  },
  {
    id: 'Laterite',
    name: 'Laterite',
    localName: 'ಜಂಬಿಟ್ಟಿಗೆ ಮಣ್ಣು',
    description: 'Iron/aluminum rich, porous with swift leaching (-2% offset)',
    offset: -2,
    drainage: 'Rapid',
    icon: 'layers-outline',
  },
  {
    id: 'Sandy Loam',
    name: 'Sandy Loam',
    localName: 'ಮರಳು ಗೋಡು ಮಣ್ಣು',
    description: 'Coarse texture, quick dry-down, requires frequent cycles (-3% offset)',
    offset: -3,
    drainage: 'Very Rapid',
    icon: 'weather-windy',
  },
  {
    id: 'Clay Loam',
    name: 'Clay Loam',
    localName: 'ಜೇಡಿ ಗೋಡು ಮಣ್ಣು',
    description: 'Dense fine silt & clay blend with heavy moisture holding (+3% offset)',
    offset: 3,
    drainage: 'Slow',
    icon: 'flask-round-bottom-outline',
  },
];

export const IRRIGATION_TYPES: IrrigationOption[] = [
  {
    id: 'Drip',
    name: 'Drip Irrigation',
    localName: 'ಹನಿ ನೀರಾವರಿ',
    description: 'Direct root-zone micro emitters; maximum water & nutrient economy',
    efficiency: '90–95% Efficiency',
    icon: 'water-drop',
  },
  {
    id: 'Sprinkler',
    name: 'Sprinkler Irrigation',
    localName: 'ತುಂತುರು ನೀರಾವರಿ',
    description: 'Overhead droplet spray ideal for undulating field contours',
    efficiency: '75–85% Efficiency',
    icon: 'weather-sprinkles',
  },
  {
    id: 'Flood',
    name: 'Flood / Surface',
    localName: 'ಕಾಲುವೆ / ಹರಿ ನೀರಾವರಿ',
    description: 'Gravity channel flood basin; traditional furrow delivery',
    efficiency: '50–60% Efficiency',
    icon: 'waves',
  },
  {
    id: 'Furrow',
    name: 'Furrow Irrigation',
    localName: 'ಸಾಲು ನೀರಾವರಿ',
    description: 'Water conveyed in parallel channels between crop ridges',
    efficiency: '60–70% Efficiency',
    icon: 'format-line-spacing',
  },
  {
    id: 'Rainfed',
    name: 'Rainfed / Natural',
    localName: 'ಮಳೆ ಆಧಾರಿತ',
    description: 'Dependent on seasonal monsoon rainfall patterns & soil storage',
    efficiency: 'Natural Monsoon',
    icon: 'weather-pouring',
  },
];

export const KARNATAKA_DISTRICT_COORDS: Array<{
  name: string;
  latitude: number;
  longitude: number;
}> = [
  { name: 'Bengaluru Rural', latitude: 13.2846, longitude: 77.6078 },
  { name: 'Mysuru', latitude: 12.2958, longitude: 76.6394 },
  { name: 'Mandya', latitude: 12.5218, longitude: 76.8951 },
  { name: 'Hassan', latitude: 13.0072, longitude: 76.0962 },
  { name: 'Tumakuru', latitude: 13.3379, longitude: 77.1173 },
  { name: 'Kolar', latitude: 13.1362, longitude: 78.1292 },
  { name: 'Shivamogga', latitude: 13.9299, longitude: 75.5681 },
  { name: 'Davanagere', latitude: 14.4644, longitude: 75.9218 },
  { name: 'Dharwad', latitude: 15.4589, longitude: 75.0078 },
  { name: 'Belagavi', latitude: 15.8497, longitude: 74.4977 },
  { name: 'Kalaburagi', latitude: 17.3297, longitude: 76.8343 },
  { name: 'Raichur', latitude: 16.212, longitude: 77.3439 },
  { name: 'Ballari', latitude: 15.1394, longitude: 76.9214 },
  { name: 'Chikkamagaluru', latitude: 13.3161, longitude: 75.772 },
  { name: 'Vijayapura', latitude: 16.8302, longitude: 75.71 },
];

export function resolveClientCoords(location?: string): { latitude: number; longitude: number } {
  if (!location) return { latitude: 13.3379, longitude: 77.1173 };
  const lower = location.toLowerCase();
  const match = KARNATAKA_DISTRICT_COORDS.find((d) => lower.includes(d.name.toLowerCase()));
  return match
    ? { latitude: match.latitude, longitude: match.longitude }
    : { latitude: 13.3379, longitude: 77.1173 };
}

export const DEFAULT_FARM_DETAILS = {
  name: 'Ramesh Gowda',
  location: 'Tumakuru, Karnataka',
  latitude: 13.3379,
  longitude: 77.1173,
  fieldDimension: '2.5',
  fieldUnit: 'Acres' as const,
  irrigationType: 'Drip',
  soilType: 'Red Loam',
  cropGrown: 'Ragi',
  deviceId: 'RS-KA-01',
  deviceStatus: 'Online' as const,
  soilMoisture: 38.5,
  timeUntilStressHours: 12,
  confidence: 82,
};
