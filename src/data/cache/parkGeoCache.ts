import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage-backed cache of reverse-geocoded city/country per park.
 *
 * ThemeParks.wiki does not return `location.city`/`location.country`, so the
 * provider enriches parks through the free Nominatim reverse-geocoding API and
 * persists the results here. The cache is keyed by park id so repeated app
 * launches reuse the lookups instead of hitting Nominatim again.
 */

export const PARK_GEO_CACHE_KEY = 'opencoaster:park-geo-cache';

export interface ParkGeo {
  city: string;
  country: string;
}

export type ParkGeoCache = Record<string, ParkGeo>;

let cache: ParkGeoCache | null = null;
let loadPromise: Promise<ParkGeoCache> | null = null;

async function readFromStorage(): Promise<ParkGeoCache> {
  try {
    const raw = await AsyncStorage.getItem(PARK_GEO_CACHE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as ParkGeoCache;
  } catch {
    return {};
  }
}

/**
 * Load the whole geo cache once and memoize it for the app session.
 */
export async function loadParkGeoCache(): Promise<ParkGeoCache> {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = readFromStorage().then((map) => {
      cache = map;
      return map;
    });
  }
  return loadPromise;
}

/**
 * Persist the whole geo cache. Failure to write must never crash the app.
 */
export async function saveParkGeoCache(map: ParkGeoCache): Promise<void> {
  cache = map;
  try {
    await AsyncStorage.setItem(PARK_GEO_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Best effort: in-memory enrichment still works for this session.
  }
}

/**
 * Return the cached geo for a park, if any.
 */
export async function getGeoForPark(parkId: string): Promise<ParkGeo | undefined> {
  const map = await loadParkGeoCache();
  const geo = map[parkId];
  if (geo && (geo.city || geo.country)) {
    return geo;
  }
  return undefined;
}

/**
 * Store the geo for a single park and persist the whole map.
 */
export async function setGeoForPark(parkId: string, geo: ParkGeo): Promise<void> {
  const map = await loadParkGeoCache();
  map[parkId] = geo;
  await saveParkGeoCache(map);
}

/**
 * Drop the in-memory memoized cache. Intended for tests and diagnostics.
 */
export function resetParkGeoCache(): void {
  cache = null;
  loadPromise = null;
}
