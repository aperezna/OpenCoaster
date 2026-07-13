import { FixtureParkDiscoveryProvider } from '../ParkDiscoveryProvider';
import type { ParkSummary } from '../../models/ParkSummary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const provider = new FixtureParkDiscoveryProvider();

/** Assert that a result set contains only parks whose IDs match the expected set. */
function expectIdsMatch(results: ParkSummary[], expectedIds: string[]) {
  expect(results).toHaveLength(expectedIds.length);
  for (const id of expectedIds) {
    expect(results.find((p) => p.id === id)).toBeTruthy();
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FixtureParkDiscoveryProvider.searchParks', () => {
  // --- Name filter (regression — existing behavior) ---

  it('should return all parks for empty query', async () => {
    const results = await provider.searchParks({});
    expect(results).toHaveLength(3);
  });

  it('should filter parks by name (case-insensitive substring)', async () => {
    const results = await provider.searchParks({ name: 'Magic' });
    expectIdsMatch(results, ['magic-kingdom']);
  });

  // --- City filter ---

  it('should filter parks by city (case-insensitive substring)', async () => {
    const results = await provider.searchParks({ city: 'Orlando' });
    expectIdsMatch(results, ['magic-kingdom']);
  });

  it('should filter parks by city with partial match', async () => {
    const results = await provider.searchParks({ city: 'kaats' });
    expectIdsMatch(results, ['efteling']);
  });

  // --- Country filter ---

  it('should filter parks by country (case-insensitive substring)', async () => {
    const results = await provider.searchParks({ country: 'NL' });
    expectIdsMatch(results, ['efteling']);
  });

  it('should filter parks by country with partial match', async () => {
    const results = await provider.searchParks({ country: 'FR' });
    expectIdsMatch(results, ['disneyland-paris']);
  });

  // --- Combined filters ---

  it('should combine name + city filter', async () => {
    const results = await provider.searchParks({
      name: 'Magic',
      city: 'Orlando',
    });
    expectIdsMatch(results, ['magic-kingdom']);
  });

  it('should combine name + country filter', async () => {
    const results = await provider.searchParks({
      name: 'Disney',
      country: 'FR',
    });
    expectIdsMatch(results, ['disneyland-paris']);
  });

  it('should combine city + country filter', async () => {
    const results = await provider.searchParks({
      city: 'Kaatsheuvel',
      country: 'NL',
    });
    expectIdsMatch(results, ['efteling']);
  });

  it('should combine name + city + country all three', async () => {
    const results = await provider.searchParks({
      name: 'Magic',
      city: 'Orlando',
      country: 'US',
    });
    expectIdsMatch(results, ['magic-kingdom']);
  });

  it('should return empty when name + city + country do not all match', async () => {
    const results = await provider.searchParks({
      name: 'Magic',
      city: 'Kaatsheuvel',
      country: 'NL',
    });
    expect(results).toHaveLength(0);
  });

  // --- No-match scenarios ---

  it('should return empty array for non-matching country', async () => {
    const results = await provider.searchParks({ country: 'JP' });
    expect(results).toHaveLength(0);
  });

  it('should return empty array for non-matching city', async () => {
    const results = await provider.searchParks({ city: 'Tokyo' });
    expect(results).toHaveLength(0);
  });

  // --- Proximity still works alongside text filters ---

  it('should combine proximity with city filter', async () => {
    // Efteling is at 51.6503, 5.0485. Use a point very close to it.
    const results = await provider.searchParks({
      city: 'Kaatsheuvel',
      proximity: { latitude: 51.65, longitude: 5.05, radiusKm: 5 },
    });
    expectIdsMatch(results, ['efteling']);
  });
});
