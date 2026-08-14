import type { ParkSummary } from '../models/ParkSummary';
import type { ParkWeather } from '../models/ParkWeather';
import type { ParkHours } from '../models/ParkHours';
import type { Attraction } from '../models/Attraction';
import type { UserProfile } from '../models/UserProfile';
import type { ParkSearchQuery, ParkDiscoveryProvider } from './ParkDiscoveryProvider';
import { mockUserProfile } from './fixtures';
import { loadParkGeoCache, saveParkGeoCache } from '../cache/parkGeoCache';
import type { ParkGeo } from '../cache/parkGeoCache';

// ---------------------------------------------------------------------------
// Raw API response types for ThemeParks.wiki
// ---------------------------------------------------------------------------

interface ThemeParksLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  address?: string;
}

interface ThemeParksMedia {
  url?: string;
  phone?: string;
}

interface _ThemeParksLiveData {
  status?: string;
  queue?: Record<
    string,
    {
      waitTime?: number;
    }
  >;
}

interface ThemeParksScheduleEntry {
  date: string;
  type?: string;
  openingTime?: string;
  closingTime?: string;
}

interface ThemeParksEntity {
  id: string;
  name: string;
  entityType: string;
  slug?: string;
  location?: ThemeParksLocation;
  timezone?: string;
  media?: ThemeParksMedia;
  children?: ThemeParksEntity[];
  liveData?: ThemeParksEntity[];
  schedule?: ThemeParksScheduleEntry[];
  /** Fields present on items inside the liveData[] array */
  status?: string;
  queue?: Record<string, { waitTime?: number }>;
}

interface OpenMeteoCurrentWeather {
  temperature: number;
  weathercode: number;
  windspeed: number;
}

interface OpenMeteoResponse {
  current_weather: OpenMeteoCurrentWeather;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THEMEPARKS_API_BASE = 'https://api.themeparks.wiki/v1';
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const NOMINATIM_USER_AGENT = 'OpenCoaster/0.1 (React Native mobile app)';
const GEOCODE_PACING_MS = 1000;

/** Earth radius in km for Haversine distance */
const EARTH_RADIUS_KM = 6371;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the great-circle distance in km between two coordinates using the
 * Haversine formula.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Resolve after `ms` milliseconds (used to honor Nominatim's 1 req/s policy). */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/**
 * Map WMO weather code to our ParkWeather condition string.
 *
 *   0       → sunny
 *   1-3     → cloudy  (partly cloudy, overcast)
 *   45, 48  → cloudy  (foggy)
 *   51-67   → rainy   (drizzle, freezing drizzle)
 *   71-77   → rainy   (snowfall, snow grains)
 *   80-86   → rainy   (showers)
 *   95-99   → storm   (thunderstorm, hail)
 */
function mapWeatherCode(code: number): ParkWeather['condition'] {
  if (code === 0) return 'sunny';
  if (code <= 3 || code === 45 || code === 48) return 'cloudy';
  if (code >= 95) return 'storm';
  return 'rainy';
}

/**
 * Map API entityType to our Attraction.type enum.
 * The API does not distinguish roller-coasters from dark rides,
 * so we default to 'family' for generic attractions.
 */
function mapAttractionType(entityType: string): Attraction['type'] {
  switch (entityType) {
    case 'SHOW':
      return 'show';
    default:
      return 'family';
  }
}

/**
 * Map API live status string to our Attraction.status enum.
 */
function mapStatus(liveStatus?: string): Attraction['status'] {
  if (liveStatus === 'OPERATING') return 'operating';
  if (liveStatus === 'DOWN') return 'down';
  return 'closed';
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class ThemeParksWikiProvider implements ParkDiscoveryProvider {
  private readonly baseUrl: string;

  /**
   * Memoized full catalog of parks. Once loaded it is reused by every
   * searchParks call so repeated searches do not re-fetch the API.
   */
  private catalogPromise: Promise<ParkSummary[]> | null = null;

  /** Resolves when the in-flight background geo enrichment finishes. */
  private geoEnrichmentPromise: Promise<void> | null = null;

  /** Bumped by refreshCatalog() so stale enrichment runs stop mutating data. */
  private geoGeneration = 0;

  /** Park ids whose reverse-geocode lookup failed; not retried this session. */
  private readonly failedGeoLookups = new Set<string>();

  constructor(baseUrl: string = THEMEPARKS_API_BASE) {
    this.baseUrl = baseUrl;
  }

  // -- HTTP helper ----------------------------------------------------------

  private async fetchJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`ThemeParks.wiki API error: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // -- ParkSummary mapper ---------------------------------------------------

  private mapToParkSummary(entity: ThemeParksEntity): ParkSummary {
    return {
      id: entity.id,
      name: entity.name,
      city: entity.location?.city || entity.timezone || '',
      country: entity.location?.country || '',
      latitude: entity.location?.latitude ?? 0,
      longitude: entity.location?.longitude ?? 0,
      photoUrl: entity.media?.url || undefined,
      timezone: entity.timezone || undefined,
      address: entity.location?.address || undefined,
      phone: entity.media?.phone || undefined,
    };
  }

  // -- Interface methods ----------------------------------------------------

  async searchParks(query: ParkSearchQuery): Promise<ParkSummary[]> {
    const { name, city, country, proximity } = query;

    const catalog = await this.loadCatalog();

    // Apply name filter (case-insensitive substring)
    let results = catalog;
    if (name) {
      const q = name.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (city) {
      const q = city.toLowerCase();
      results = results.filter((p) => p.city.toLowerCase().includes(q));
    }

    if (country) {
      const q = country.toLowerCase();
      results = results.filter((p) => p.country.toLowerCase().includes(q));
    }

    // Apply proximity filter (Haversine distance in km)
    if (proximity) {
      const { latitude, longitude, radiusKm } = proximity;
      results = results.filter(
        (p) => haversineKm(latitude, longitude, p.latitude, p.longitude) <= radiusKm,
      );
    }

    return results;
  }

  // -- Catalog caching ------------------------------------------------------

  /**
   * Return the cached catalog, fetching it exactly once. Concurrent and
   * sequential calls reuse the same in-flight/completed promise.
   */
  private loadCatalog(): Promise<ParkSummary[]> {
    if (!this.catalogPromise) {
      this.catalogPromise = this.fetchCatalog().then(
        (parks) => {
          this.startGeoEnrichment(parks);
          return parks;
        },
        (error) => {
          // Reset on failure so a later search can retry the load.
          this.catalogPromise = null;
          throw error;
        },
      );
    }
    return this.catalogPromise;
  }

  /**
   * Discard the cached catalog and re-fetch it from the API.
   */
  public refreshCatalog(): Promise<ParkSummary[]> {
    this.geoGeneration += 1;
    this.catalogPromise = null;
    this.geoEnrichmentPromise = null;
    return this.loadCatalog();
  }

  /**
   * Resolve when the current background geo enrichment finishes. Used by
   * tests (and any future "enrichment complete" UI signal).
   */
  public waitForGeoEnrichment(): Promise<void> {
    return this.geoEnrichmentPromise ?? Promise.resolve();
  }

  private async fetchCatalog(): Promise<ParkSummary[]> {
    // Fetch all top-level destinations
    // API returns { destinations: [...] }
    interface DestinationsResponse {
      destinations: ThemeParksEntity[];
    }
    const response = await this.fetchJson<DestinationsResponse>('/destinations');
    const destinations = response.destinations;

    // Fetch each destination's children in parallel (batched to avoid overwhelming the API)
    const childrenResponses: (ThemeParksEntity | null)[] = [];
    const BATCH_SIZE = 10;
    for (let i = 0; i < destinations.length; i += BATCH_SIZE) {
      const batch = destinations.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((dest) =>
          this.fetchJson<ThemeParksEntity>(`/entity/${dest.id}/children`).catch(() => null),
        ),
      );
      childrenResponses.push(...results);
    }

    // Collect all parks from all destinations
    const parks: ThemeParksEntity[] = [];
    for (const entity of childrenResponses) {
      if (!entity?.children) continue;
      for (const child of entity.children) {
        if (child.entityType === 'PARK') {
          parks.push(child);
        }
      }
    }

    return parks.map((e) => this.mapToParkSummary(e));
  }

  // -- Background geo enrichment -------------------------------------------

  /**
   * Kick off reverse-geocoding for parks that lack city/country. Runs in the
   * background so search results are never blocked; enriches the in-memory
   * catalog entries as results arrive and persists them to AsyncStorage.
   */
  private startGeoEnrichment(parks: ParkSummary[]): void {
    const generation = this.geoGeneration;
    this.geoEnrichmentPromise = this.enrichCatalogGeo(parks, generation);
    // Best effort: geocoding failures must never surface or crash a search.
    this.geoEnrichmentPromise.catch(() => {
      // Swallow residual failures.
    });
  }

  private async enrichCatalogGeo(parks: ParkSummary[], generation: number): Promise<void> {
    const isCurrent = (): boolean => this.geoGeneration === generation;

    const geoCache = await loadParkGeoCache();
    if (!isCurrent()) return;

    // Apply cached geo and collect parks that still need a lookup.
    const missing: ParkSummary[] = [];
    for (const park of parks) {
      const geo = geoCache[park.id];
      if (geo && (geo.city || geo.country)) {
        if (geo.city) park.city = geo.city;
        if (geo.country) park.country = geo.country;
      } else if ((!park.city || !park.country) && (park.latitude !== 0 || park.longitude !== 0)) {
        missing.push(park);
      }
    }

    // Nothing left to geocode: skip enrichment entirely.
    if (missing.length === 0) return;

    for (let i = 0; i < missing.length; i++) {
      if (!isCurrent()) return;
      const park = missing[i];
      if (this.failedGeoLookups.has(park.id)) continue;

      const geo = await this.reverseGeocode(park.latitude, park.longitude);
      if (!isCurrent()) return;

      if (geo && (geo.city || geo.country)) {
        if (geo.city) park.city = geo.city;
        if (geo.country) park.country = geo.country;
        geoCache[park.id] = geo;
        // Persist each result (storage failures are swallowed internally).
        await saveParkGeoCache(geoCache);
      } else {
        // Failed lookup: leave geo empty and do not retry within this session.
        this.failedGeoLookups.add(park.id);
      }

      // Nominatim usage policy allows at most 1 request per second.
      if (i < missing.length - 1) {
        await wait(GEOCODE_PACING_MS);
      }
    }
  }

  /** Reverse geocode a coordinate with the free Nominatim API (no key). */
  private async reverseGeocode(lat: number, lon: number): Promise<ParkGeo | null> {
    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=10&accept-language=en`;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { address?: Record<string, string> };
      const address = data?.address;
      if (!address) return null;
      const city =
        address.city || address.town || address.village || address.county || address.state || '';
      return { city, country: address.country ?? '' };
    } catch {
      return null;
    }
  }

  async getParkById(parkId: string): Promise<ParkSummary | null> {
    try {
      const entity = await this.fetchJson<ThemeParksEntity>(`/entity/${parkId}`);
      if (entity.entityType !== 'PARK') return null;
      return this.mapToParkSummary(entity);
    } catch {
      return null;
    }
  }

  async getParkAttractions(parkId: string): Promise<Attraction[]> {
    // Fetch both the children list and live status in parallel
    const [childrenRes, liveRes] = await Promise.all([
      this.fetchJson<ThemeParksEntity>(`/entity/${parkId}/children`),
      this.fetchJson<ThemeParksEntity>(`/entity/${parkId}/live`),
    ]);

    // Index live data by entity id — the /live endpoint returns the park
    // entity with a liveData[] array containing status + queue for each
    // attraction.
    const liveMap = new Map<string, ThemeParksEntity>();
    if (liveRes.liveData) {
      for (const entry of liveRes.liveData) {
        liveMap.set(entry.id, entry);
      }
    }

    // Collect all attractions and shows from the children endpoint
    const attractions: ThemeParksEntity[] = [];
    const collect = (entities: ThemeParksEntity[]): void => {
      for (const e of entities) {
        if (e.entityType === 'ATTRACTION' || e.entityType === 'SHOW') {
          attractions.push(e);
        }
        if (e.children) collect(e.children);
      }
    };
    if (childrenRes.children) collect(childrenRes.children);

    // Check park-level status — if the park itself is not OPERATING,
    // all attractions are closed regardless of what the live data says.
    // The real /live endpoint does not return a park-level status field
    // (verified against the live API), so when it is absent derive the
    // operating state from the attractions themselves: a park that is
    // actually closed reports every attraction as CLOSED.
    const isParkOperating =
      liveRes.status != null
        ? liveRes.status === 'OPERATING'
        : (liveRes.liveData?.some((entry) => entry.status === 'OPERATING') ?? false);

    // Merge live data into each attraction
    return attractions.map((e) => {
      const live = liveMap.get(e.id);
      return {
        id: e.id,
        name: e.name,
        parkId,
        waitTime: isParkOperating ? (live?.queue?.STANDBY?.waitTime ?? 0) : 0,
        status: isParkOperating ? mapStatus(live?.status) : 'closed',
        type: mapAttractionType(e.entityType),
      };
    });
  }

  async getParkHours(parkId: string): Promise<ParkHours | null> {
    const entity = await this.fetchJson<ThemeParksEntity>(`/entity/${parkId}/schedule`);

    if (!entity.schedule || entity.schedule.length === 0) {
      return null;
    }

    // Pick the first OPERATING entry for today; fall back to the first
    // OPERATING entry in the schedule list.
    const today = new Date().toISOString().split('T')[0];
    const schedule =
      entity.schedule.find((h) => h.date === today && h.type === 'OPERATING') ??
      entity.schedule.find((h) => h.type === 'OPERATING');

    if (!schedule?.openingTime || !schedule?.closingTime) {
      return null;
    }

    return {
      opening: schedule.openingTime,
      closing: schedule.closingTime,
      timezone: entity.timezone,
    };
  }

  async getParkWeather(parkId: string): Promise<ParkWeather | null> {
    // Fetch park entity to get coordinates
    const entity = await this.fetchJson<ThemeParksEntity>(`/entity/${parkId}`);
    const lat = entity.location?.latitude;
    const lng = entity.location?.longitude;
    if (lat == null || lng == null) return null;

    // Fetch weather from Open-Meteo (no API key required)
    const url = `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lng}&current_weather=true`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenMeteoResponse = await response.json();
    return {
      temperature: data.current_weather.temperature,
      condition: mapWeatherCode(data.current_weather.weathercode),
      unit: 'C',
    };
  }

  async getUserProfile(): Promise<UserProfile> {
    // No auth yet — reuse the mock profile
    return mockUserProfile;
  }
}
