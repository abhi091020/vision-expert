import {
  apiGet,
  FALL_URL,
  ANIMAL_URL,
  VEHICLE_URL,
  RAILWAY_URL,
} from "./client";

// Maps clone mode → base URL + events endpoint
const DETECTION_CONFIG = {
  fall: { base: FALL_URL, endpoint: (n) => `/events?limit=${n}` },
  animal: {
    base: ANIMAL_URL,
    endpoint: (n) => `/api/animal/alerts?limit=${n}`,
  },
  vehicle: {
    base: VEHICLE_URL,
    endpoint: (n) => `/dashboard?type=activity&limit=${n}`,
  },
  railway: {
    base: RAILWAY_URL,
    endpoint: (n) => `/api/barrier/alerts?limit=${n}`,
  },
};

export function hasDetectionBackend(mode) {
  return !!DETECTION_CONFIG[mode];
}

export async function fetchDetectionEvents(mode, limit = 20) {
  const config = DETECTION_CONFIG[mode];
  if (!config) return [];
  try {
    const data = await apiGet(config.endpoint(limit), config.base);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
