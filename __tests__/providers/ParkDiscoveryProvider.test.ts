import { fixtureParks } from '../../src/data/providers/fixtures';
import { FixtureParkDiscoveryProvider } from '../../src/data/providers/ParkDiscoveryProvider';
import type { ParkSummary } from '../../src/data/models/ParkSummary';
import type { ParkDiscoveryProvider } from '../../src/data/providers/ParkDiscoveryProvider';

describe('Fixture data', () => {
  it('should have at least 3 parks', () => {
    expect(fixtureParks.length).toBeGreaterThanOrEqual(3);
  });

  it('should include at least one US park', () => {
    const usParks = fixtureParks.filter((p: ParkSummary) => p.country === 'US');
    expect(usParks.length).toBeGreaterThanOrEqual(1);
  });

  it('should include at least one European park', () => {
    const euParks = fixtureParks.filter((p: ParkSummary) => p.country === 'FR' || p.country === 'NL' || p.country === 'DE' || p.country === 'ES' || p.country === 'IT' || p.country === 'GB');
    expect(euParks.length).toBeGreaterThanOrEqual(1);
  });

  it('should have all required fields filled for each park', () => {
    for (const park of fixtureParks) {
      expect(park.id).toBeTruthy();
      expect(park.name).toBeTruthy();
      expect(park.city).toBeTruthy();
      expect(park.country).toBeTruthy();
      expect(typeof park.latitude).toBe('number');
      expect(typeof park.longitude).toBe('number');
    }
  });
});

describe('FixtureParkDiscoveryProvider', () => {
  let provider: ParkDiscoveryProvider;

  beforeEach(() => {
    provider = new FixtureParkDiscoveryProvider();
  });

  it('should return all parks when query is empty', async () => {
    const results = await provider.searchParks({});
    expect(results.length).toBe(fixtureParks.length);
  });

  it('should return all parks when name is undefined', async () => {
    const results = await provider.searchParks({ name: undefined });
    expect(results.length).toBe(fixtureParks.length);
  });

  it('should filter by exact park name match', async () => {
    const results = await provider.searchParks({ name: 'Magic Kingdom' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((p: ParkSummary) =>
      p.name.toLowerCase().includes('magic kingdom')
    )).toBe(true);
  });

  it('should return empty array when no park matches', async () => {
    const results = await provider.searchParks({ name: 'NonExistentParkXYZ' });
    expect(results).toEqual([]);
  });

  it('should do case-insensitive name search', async () => {
    const results = await provider.searchParks({ name: 'magic kingdom' });
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should do partial name matching', async () => {
    const results = await provider.searchParks({ name: 'Magic' });
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter by proximity radius', async () => {
    // Orlando Magic Kingdom: 28.416, -81.581
    // Efteling: 51.65, 5.05 — ~7300 km from Orlando
    // Using a point near Orlando (28.4, -81.6) with 10km radius should return Magic Kingdom
    const results = await provider.searchParks({
      proximity: { latitude: 28.4, longitude: -81.6, radiusKm: 10 },
    });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((p: ParkSummary) => p.id === 'magic-kingdom' || p.id === 'epcot' || p.id === 'hollywood-studios' || p.id === 'animal-kingdom')).toBe(true);
  });

  it('should filter by proximity radius returning no results far away', async () => {
    // Point in the Pacific Ocean far from any fixture park
    const results = await provider.searchParks({
      proximity: { latitude: 0, longitude: -150, radiusKm: 100 },
    });
    expect(results).toEqual([]);
  });
});
