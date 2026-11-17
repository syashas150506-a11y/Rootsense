export interface DistrictCoords {
  name: string;
  latitude: number;
  longitude: number;
}

export const KARNATAKA_DISTRICTS: DistrictCoords[] = [
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

export function resolveDistrictCoords(locationInput?: string): DistrictCoords {
  if (!locationInput) {
    return KARNATAKA_DISTRICTS[4]; // Tumakuru default
  }
  const normalized = locationInput.toLowerCase().trim();
  const match = KARNATAKA_DISTRICTS.find((d) =>
    normalized.includes(d.name.toLowerCase())
  );
  return match || KARNATAKA_DISTRICTS[4];
}
