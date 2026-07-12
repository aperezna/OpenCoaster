import type { ParkSummary } from '../models/ParkSummary';
import type { ParkWeather } from '../models/ParkWeather';
import type { ParkHours } from '../models/ParkHours';
import type { Attraction } from '../models/Attraction';
import type { UserProfile } from '../models/UserProfile';
import {
  fixtureParks,
  fixtureWeather,
  fixtureHours,
  fixtureAttractions,
  mockUserProfile,
} from './fixtures';

export interface ParkSearchQuery {
  name?: string;
  proximity?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
}

export interface ParkDiscoveryProvider {
  searchParks(query: ParkSearchQuery): Promise<ParkSummary[]>;
  getParkById(parkId: string): Promise<ParkSummary | null>;
  getParkWeather(parkId: string): Promise<ParkWeather | null>;
  getParkHours(parkId: string): Promise<ParkHours | null>;
  getParkAttractions(parkId: string): Promise<Attraction[]>;
  getUserProfile(): Promise<UserProfile>;
}

export { ThemeParksWikiProvider } from './ThemeParksWikiProvider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Earth radius in km for Haversine distance */
const EARTH_RADIUS_KM = 6371;

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

export class FixtureParkDiscoveryProvider implements ParkDiscoveryProvider {
  async searchParks(query: ParkSearchQuery): Promise<ParkSummary[]> {
    const { name, proximity } = query;

    let results = fixtureParks;

    // Apply name filter (case-insensitive)
    if (name) {
      const q = name.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q));
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

  async getParkById(parkId: string): Promise<ParkSummary | null> {
    return fixtureParks.find((p) => p.id === parkId) ?? null;
  }

  async getParkWeather(parkId: string): Promise<ParkWeather | null> {
    return fixtureWeather[parkId] ?? null;
  }

  async getParkHours(parkId: string): Promise<ParkHours | null> {
    return fixtureHours[parkId] ?? null;
  }

  async getParkAttractions(parkId: string): Promise<Attraction[]> {
    return fixtureAttractions.filter((a) => a.parkId === parkId);
  }

  async getUserProfile(): Promise<UserProfile> {
    return mockUserProfile;
  }
}
