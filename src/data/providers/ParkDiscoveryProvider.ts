import type { ParkSummary } from '../models/ParkSummary';
import { fixtureParks } from './fixtures';

export interface ParkSearchQuery {
  name?: string;
  city?: string;
}

export interface ParkDiscoveryProvider {
  searchParks(query: ParkSearchQuery): Promise<ParkSummary[]>;
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
}
