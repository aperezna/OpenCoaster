import type { ParkSummary } from '../models/ParkSummary';
import type { ParkWeather } from '../models/ParkWeather';
import type { ParkHours } from '../models/ParkHours';
import type { Attraction } from '../models/Attraction';
import type { UserProfile } from '../models/UserProfile';
import type { ParkSearchQuery, ParkDiscoveryProvider } from './ParkDiscoveryProvider';
import { mockUserProfile } from './fixtures';

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

interface ThemeParksLiveData {
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

/** Earth radius in km for Haversine distance */
const EARTH_RADIUS_KM = 6371;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the great-circle distance in km between two coordinates using the
 * Haversine formula.
 */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
        throw new Error(
          `ThemeParks.wiki API error: ${response.status} ${response.statusText}`,
        );
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
    const { name, proximity } = query;

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
          this.fetchJson<ThemeParksEntity>(`/entity/${dest.id}/children`).catch(
            () => null,
          ),
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

    // Map to ParkSummary
    let results = parks.map((e) => this.mapToParkSummary(e));

    // Apply name filter (case-insensitive)
    if (name) {
      const q = name.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Apply proximity filter (Haversine distance in km)
    if (proximity) {
      const { latitude, longitude, radiusKm } = proximity;
      results = results.filter(
        (p) =>
          haversineKm(latitude, longitude, p.latitude, p.longitude) <= radiusKm,
      );
    }

    return results;
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

    // Merge live data into each attraction
    return attractions.map((e) => {
      const live = liveMap.get(e.id);
      return {
        id: e.id,
        name: e.name,
        parkId,
        waitTime: live?.queue?.STANDBY?.waitTime ?? 0,
        status: mapStatus(live?.status),
        type: mapAttractionType(e.entityType),
      };
    });
  }

  async getParkHours(parkId: string): Promise<ParkHours | null> {
    try {
      const entity = await this.fetchJson<ThemeParksEntity>(
        `/entity/${parkId}/schedule`,
      );

      if (!entity.schedule || entity.schedule.length === 0) {
        return null;
      }

      // Pick the first OPERATING entry for today; fall back to the first
      // OPERATING entry in the schedule list.
      const today = new Date().toISOString().split('T')[0];
      const schedule =
        entity.schedule.find(
          (h) => h.date === today && h.type === 'OPERATING',
        ) ??
        entity.schedule.find((h) => h.type === 'OPERATING');

      if (!schedule?.openingTime || !schedule?.closingTime) {
        return null;
      }

      return {
        opening: schedule.openingTime,
        closing: schedule.closingTime,
        timezone: entity.timezone,
      };
    } catch {
      return null;
    }
  }

  async getParkWeather(parkId: string): Promise<ParkWeather | null> {
    try {
      // Fetch park entity to get coordinates
      const entity = await this.fetchJson<ThemeParksEntity>(`/entity/${parkId}`);
      const lat = entity.location?.latitude;
      const lng = entity.location?.longitude;
      if (lat == null || lng == null) return null;

      // Fetch weather from Open-Meteo (no API key required)
      const url = `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lng}&current_weather=true`;
      const response = await fetch(url);
      if (!response.ok) return null;

      const data: OpenMeteoResponse = await response.json();
      return {
        temperature: data.current_weather.temperature,
        condition: mapWeatherCode(data.current_weather.weathercode),
        unit: 'C',
      };
    } catch {
      return null;
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    // No auth yet — reuse the mock profile
    return mockUserProfile;
  }
}
