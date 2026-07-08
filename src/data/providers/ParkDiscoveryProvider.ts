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
  city?: string;
}

export interface ParkDiscoveryProvider {
  searchParks(query: ParkSearchQuery): Promise<ParkSummary[]>;
  getParkById(parkId: string): Promise<ParkSummary | null>;
  getParkWeather(parkId: string): Promise<ParkWeather | null>;
  getParkHours(parkId: string): Promise<ParkHours | null>;
  getParkAttractions(parkId: string): Promise<Attraction[]>;
  getUserProfile(): Promise<UserProfile>;
}

export class FixtureParkDiscoveryProvider implements ParkDiscoveryProvider {
  async searchParks(query: ParkSearchQuery): Promise<ParkSummary[]> {
    const { name, city } = query;

    return fixtureParks.filter((park) => {
      if (name && !park.name.toLowerCase().includes(name.toLowerCase())) {
        return false;
      }
      if (city && !park.city.toLowerCase().includes(city.toLowerCase())) {
        return false;
      }
      return true;
    });
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
