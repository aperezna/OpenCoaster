import { DEFAULT_REGION, STALE_TIME, CACHE_TTLS } from '../../src/config/constants';

type ParkSummaryFields = {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  timezone?: string;
};

describe('ParkSummary model shape', () => {
  it('should create a valid park object with all required fields', () => {
    const park: ParkSummaryFields = {
      id: 'test-1',
      name: 'Test Park',
      city: 'Orlando',
      country: 'US',
      latitude: 28.5,
      longitude: -81.3,
    };

    expect(park.id).toBe('test-1');
    expect(park.name).toBe('Test Park');
    expect(park.city).toBe('Orlando');
    expect(park.country).toBe('US');
    expect(park.latitude).toBe(28.5);
    expect(park.longitude).toBe(-81.3);
  });

  it('should allow optional photoUrl and timezone to be undefined', () => {
    const park: ParkSummaryFields = {
      id: 'test-2',
      name: 'No Photo Park',
      city: 'Paris',
      country: 'FR',
      latitude: 48.8,
      longitude: 2.3,
    };

    expect(park.photoUrl).toBeUndefined();
    expect(park.timezone).toBeUndefined();
  });

  it('should handle optional fields when provided', () => {
    const park: ParkSummaryFields = {
      id: 'test-3',
      name: 'Full Park',
      city: 'Tokyo',
      country: 'JP',
      latitude: 35.6,
      longitude: 139.7,
      photoUrl: 'https://example.com/photo.jpg',
      timezone: 'Asia/Tokyo',
    };

    expect(park.photoUrl).toBe('https://example.com/photo.jpg');
    expect(park.timezone).toBe('Asia/Tokyo');
  });
});

describe('Constants', () => {
  it('should export DEFAULT_REGION with lat, lng, latDelta, lngDelta', () => {
    expect(DEFAULT_REGION).toBeDefined();
    expect(typeof DEFAULT_REGION.latitude).toBe('number');
    expect(typeof DEFAULT_REGION.longitude).toBe('number');
    expect(typeof DEFAULT_REGION.latitudeDelta).toBe('number');
    expect(typeof DEFAULT_REGION.longitudeDelta).toBe('number');
  });

  it('should export STALE_TIME as 30000', () => {
    expect(STALE_TIME).toBe(30000);
  });

  it('should export CACHE_TTLS as an object', () => {
    expect(CACHE_TTLS).toBeDefined();
    expect(typeof CACHE_TTLS).toBe('object');
  });
});
