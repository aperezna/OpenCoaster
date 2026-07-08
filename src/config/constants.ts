export const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 10,
  longitudeDelta: 10,
} as const;

export const STALE_TIME = 30_000;

export const CACHE_TTLS = {
  parks: STALE_TIME,
  parkDetail: 60_000,
} as const;
