import { ThemeParksWikiProvider } from '../ThemeParksWikiProvider';
import type { ParkSummary } from '../../models/ParkSummary';
import type { ParkWeather } from '../../models/ParkWeather';
import type { ParkHours } from '../../models/ParkHours';
import type { Attraction } from '../../models/Attraction';
import type { ParkSearchQuery } from '../ParkDiscoveryProvider';

// ---------------------------------------------------------------------------
// Mock API response builders
// ---------------------------------------------------------------------------

interface MockFetchEntry {
  url: string;
  response?: unknown;
  ok?: boolean;
  status?: number;
  statusText?: string;
}

function buildFetchMock(entries: MockFetchEntry[]) {
  return jest.fn().mockImplementation((url: string, _init?: RequestInit) => {
    const entry = entries.find((e) => url.includes(e.url));
    if (!entry) {
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    }
    if (entry.ok === false) {
      return Promise.resolve({
        ok: false,
        status: entry.status ?? 500,
        statusText: entry.statusText ?? 'Internal Server Error',
        json: () => Promise.reject(new Error('Response not ok')),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(entry.response),
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createProvider(baseUrl?: string): ThemeParksWikiProvider {
  return new ThemeParksWikiProvider(baseUrl);
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockMagicKingdomEntity = {
  id: 'magic-kingdom',
  name: 'Magic Kingdom',
  entityType: 'PARK',
  slug: 'magic-kingdom',
  location: {
    latitude: 28.4177,
    longitude: -81.5812,
    city: 'Orlando',
    country: 'US',
  },
  timezone: 'America/New_York',
  media: {
    url: 'https://cdn.example.com/magic-kingdom.jpg',
    phone: '+1-407-939-5277',
  },
};

const mockEftelingEntity = {
  id: 'efteling',
  name: 'Efteling',
  entityType: 'PARK',
  slug: 'efteling',
  location: {
    latitude: 51.6503,
    longitude: 5.0485,
    city: 'Kaatsheuvel',
    country: 'NL',
  },
  timezone: 'Europe/Amsterdam',
};

const mockDestinationsResponse = {
  destinations: [
    {
      id: 'dest-wdw',
      name: 'Walt Disney World',
      entityType: 'DESTINATION',
    },
    {
      id: 'dest-dlp',
      name: 'Disneyland Paris',
      entityType: 'DESTINATION',
    },
  ],
};

const mockWdwChildrenResponse = {
  id: 'dest-wdw',
  name: 'Walt Disney World',
  entityType: 'DESTINATION',
  children: [
    mockMagicKingdomEntity,
    {
      id: 'epcot',
      name: 'Epcot',
      entityType: 'PARK',
      location: {
        latitude: 28.3746,
        longitude: -81.5496,
        city: 'Orlando',
        country: 'US',
      },
      timezone: 'America/New_York',
    },
  ],
};

const mockDlpChildrenResponse = {
  id: 'dest-dlp',
  name: 'Disneyland Paris',
  entityType: 'DESTINATION',
  children: [
    {
      id: 'disneyland-paris',
      name: 'Disneyland Park',
      entityType: 'PARK',
      location: {
        latitude: 48.8675,
        longitude: 2.7825,
        city: 'Marne-la-Vallée',
        country: 'FR',
      },
      timezone: 'Europe/Paris',
      media: {
        url: 'https://cdn.example.com/disneyland-paris.jpg',
      },
    },
  ],
};

const mockAttractionsChildren = {
  id: 'magic-kingdom',
  name: 'Magic Kingdom',
  entityType: 'PARK',
  children: [
    {
      id: 'mk-space-mountain',
      name: 'Space Mountain',
      entityType: 'ATTRACTION',
    },
    {
      id: 'mk-pirates',
      name: 'Pirates of the Caribbean',
      entityType: 'ATTRACTION',
    },
    {
      id: 'mk-mickeys-philhar',
      name: "Mickey's PhilharMagic",
      entityType: 'SHOW',
    },
  ],
};

const mockLiveData = {
  id: 'magic-kingdom',
  name: 'Magic Kingdom',
  entityType: 'PARK',
  status: 'OPERATING',
  liveData: [
    {
      id: 'mk-space-mountain',
      status: 'OPERATING',
      queue: {
        STANDBY: { waitTime: 45 },
      },
    },
    {
      id: 'mk-pirates',
      status: 'OPERATING',
      queue: {
        STANDBY: { waitTime: 20 },
      },
    },
    {
      id: 'mk-mickeys-philhar',
      status: 'DOWN',
      queue: {},
    },
    {
      id: 'mk-nonexistent-attraction',
      status: 'OPERATING',
      queue: { STANDBY: { waitTime: 5 } },
    },
  ],
};

const mockScheduleResponse = {
  id: 'magic-kingdom',
  name: 'Magic Kingdom',
  entityType: 'PARK',
  timezone: 'America/New_York',
  schedule: [
    {
      date: '2026-07-12',
      type: 'OPERATING',
      openingTime: '09:00',
      closingTime: '22:00',
    },
    {
      date: '2026-07-13',
      type: 'OPERATING',
      openingTime: '09:00',
      closingTime: '23:00',
    },
  ],
};

const mockScheduleNoOperating = {
  id: 'efteling',
  name: 'Efteling',
  entityType: 'PARK',
  timezone: 'Europe/Amsterdam',
  schedule: [
    {
      date: '2026-07-12',
      type: 'CLOSED',
      openingTime: '10:00',
      closingTime: '18:00',
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks();
});

describe('ThemeParksWikiProvider — searchParks', () => {
  it('should fetch destinations and return mapped ParkSummary[]', async () => {
    global.fetch = buildFetchMock([
      { url: '/destinations', response: mockDestinationsResponse },
      { url: '/entity/dest-wdw/children', response: mockWdwChildrenResponse },
      { url: '/entity/dest-dlp/children', response: mockDlpChildrenResponse },
    ]);

    const provider = createProvider();
    const results = await provider.searchParks({});

    expect(results).toHaveLength(3); // magic-kingdom, epcot, disneyland-paris
    expect(results[0]).toMatchObject<Partial<ParkSummary>>({
      id: 'magic-kingdom',
      name: 'Magic Kingdom',
      city: 'Orlando',
      country: 'US',
      latitude: 28.4177,
      longitude: -81.5812,
      timezone: 'America/New_York',
      phone: '+1-407-939-5277',
    });
    expect(results[0].photoUrl).toBe('https://cdn.example.com/magic-kingdom.jpg');
  });

  it('should filter parks by name (case-insensitive)', async () => {
    global.fetch = buildFetchMock([
      { url: '/destinations', response: mockDestinationsResponse },
      { url: '/entity/dest-wdw/children', response: mockWdwChildrenResponse },
      { url: '/entity/dest-dlp/children', response: mockDlpChildrenResponse },
    ]);

    const provider = createProvider();
    const results = await provider.searchParks({ name: 'kingdom' });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('magic-kingdom');
  });

  it('should filter parks by city (case-insensitive)', async () => {
    global.fetch = buildFetchMock([
      { url: '/destinations', response: mockDestinationsResponse },
      { url: '/entity/dest-wdw/children', response: mockWdwChildrenResponse },
      { url: '/entity/dest-dlp/children', response: mockDlpChildrenResponse },
    ]);

    const provider = createProvider();
    const results = await provider.searchParks({ city: 'orlando' });

    expect(results).toHaveLength(2);
    expect(results.every((park) => park.city === 'Orlando')).toBe(true);
  });

  it('should filter parks by country (case-insensitive)', async () => {
    global.fetch = buildFetchMock([
      { url: '/destinations', response: mockDestinationsResponse },
      { url: '/entity/dest-wdw/children', response: mockWdwChildrenResponse },
      { url: '/entity/dest-dlp/children', response: mockDlpChildrenResponse },
    ]);

    const provider = createProvider();
    const results = await provider.searchParks({ country: 'fr' });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('disneyland-paris');
  });

  it('should filter parks by proximity', async () => {
    global.fetch = buildFetchMock([
      { url: '/destinations', response: mockDestinationsResponse },
      { url: '/entity/dest-wdw/children', response: mockWdwChildrenResponse },
      { url: '/entity/dest-dlp/children', response: mockDlpChildrenResponse },
    ]);

    const provider = createProvider();
    // Point near Orlando, 20km radius
    const results = await provider.searchParks({
      proximity: { latitude: 28.4, longitude: -81.6, radiusKm: 20 },
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((p) => p.country === 'US')).toBe(true);
  });

  it('should handle API error in children fetch gracefully', async () => {
    global.fetch = buildFetchMock([
      { url: '/destinations', response: mockDestinationsResponse },
      { url: '/entity/dest-wdw/children', ok: false, status: 500 },
      { url: '/entity/dest-dlp/children', response: mockDlpChildrenResponse },
    ]);

    const provider = createProvider();
    // One destination's children failed, the other succeeded
    const results = await provider.searchParks({});

    // Should still get parks from the successful destination
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.country === 'FR')).toBe(true);
  });
});

describe('ThemeParksWikiProvider — getParkById', () => {
  it('should return mapped ParkSummary for a valid park', async () => {
    global.fetch = buildFetchMock([
      { url: '/entity/magic-kingdom', response: mockMagicKingdomEntity },
    ]);

    const provider = createProvider();
    const result = await provider.getParkById('magic-kingdom');

    expect(result).not.toBeNull();
    expect(result).toMatchObject<Partial<ParkSummary>>({
      id: 'magic-kingdom',
      name: 'Magic Kingdom',
      country: 'US',
      latitude: 28.4177,
    });
  });

  it('should return null when entity type is not PARK', async () => {
    const nonParkEntity = {
      ...mockMagicKingdomEntity,
      entityType: 'DESTINATION',
    };
    global.fetch = buildFetchMock([{ url: '/entity/not-a-park', response: nonParkEntity }]);

    const provider = createProvider();
    const result = await provider.getParkById('not-a-park');

    expect(result).toBeNull();
  });

  it('should return null on API error', async () => {
    global.fetch = buildFetchMock([{ url: '/entity/unknown', ok: false, status: 404 }]);

    const provider = createProvider();
    const result = await provider.getParkById('unknown');

    expect(result).toBeNull();
  });
});

describe('ThemeParksWikiProvider — getParkAttractions', () => {
  it('should merge children and live data correctly', async () => {
    global.fetch = buildFetchMock([
      { url: '/entity/magic-kingdom/children', response: mockAttractionsChildren },
      { url: '/entity/magic-kingdom/live', response: mockLiveData },
    ]);

    const provider = createProvider();
    const results = await provider.getParkAttractions('magic-kingdom');

    expect(results).toHaveLength(3); // 2 attractions + 1 show

    const spaceMountain = results.find((a) => a.id === 'mk-space-mountain');
    expect(spaceMountain).toMatchObject<Partial<Attraction>>({
      name: 'Space Mountain',
      parkId: 'magic-kingdom',
      waitTime: 45,
      status: 'operating',
      type: 'family',
    });

    const pirates = results.find((a) => a.id === 'mk-pirates');
    expect(pirates).toMatchObject<Partial<Attraction>>({
      name: 'Pirates of the Caribbean',
      waitTime: 20,
      status: 'operating',
      type: 'family',
    });

    const show = results.find((a) => a.id === 'mk-mickeys-philhar');
    expect(show).toMatchObject<Partial<Attraction>>({
      name: "Mickey's PhilharMagic",
      type: 'show',
      status: 'down',
    });
  });

  it('should handle attractions with no live data', async () => {
    const noLiveDataResponse = {
      id: 'magic-kingdom',
      name: 'Magic Kingdom',
      entityType: 'PARK',
    };

    global.fetch = buildFetchMock([
      { url: '/entity/magic-kingdom/children', response: mockAttractionsChildren },
      { url: '/entity/magic-kingdom/live', response: noLiveDataResponse },
    ]);

    const provider = createProvider();
    const results = await provider.getParkAttractions('magic-kingdom');

    expect(results).toHaveLength(3);
    // All should have default waitTime 0 and status 'closed' when no live data
    expect(results.every((a) => a.waitTime === 0)).toBe(true);
    expect(results.every((a) => a.status === 'closed')).toBe(true);
  });

  it('should return all attractions as closed when the park is not operating', async () => {
    const closedParkResponse = {
      id: 'magic-kingdom',
      name: 'Magic Kingdom',
      entityType: 'PARK',
      status: 'CLOSED',
      liveData: [
        {
          id: 'mk-space-mountain',
          status: 'OPERATING',
          queue: { STANDBY: { waitTime: 45 } },
        },
        {
          id: 'mk-pirates',
          status: 'OPERATING',
          queue: { STANDBY: { waitTime: 20 } },
        },
      ],
    };

    global.fetch = buildFetchMock([
      { url: '/entity/magic-kingdom/children', response: mockAttractionsChildren },
      { url: '/entity/magic-kingdom/live', response: closedParkResponse },
    ]);

    const provider = createProvider();
    const results = await provider.getParkAttractions('magic-kingdom');

    expect(results).toHaveLength(3);
    // Even though individual attractions report OPERATING with wait times,
    // the park-level CLOSED status forces all to be closed.
    expect(results.every((a) => a.waitTime === 0)).toBe(true);
    expect(results.every((a) => a.status === 'closed')).toBe(true);
  });
});

describe('ThemeParksWikiProvider — getParkHours', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-12T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should return parsed hours for today', async () => {
    global.fetch = buildFetchMock([
      { url: '/entity/magic-kingdom/schedule', response: mockScheduleResponse },
    ]);

    const provider = createProvider();
    const result = await provider.getParkHours('magic-kingdom');

    expect(result).not.toBeNull();
    expect(result).toMatchObject<Partial<ParkHours>>({
      opening: '09:00',
      closing: '22:00',
      timezone: 'America/New_York',
    });
  });

  it('should return null when no OPERATING schedule entry exists', async () => {
    global.fetch = buildFetchMock([
      { url: '/entity/efteling/schedule', response: mockScheduleNoOperating },
    ]);

    const provider = createProvider();
    const result = await provider.getParkHours('efteling');

    expect(result).toBeNull();
  });

  it('should return null when schedule is empty', async () => {
    global.fetch = buildFetchMock([
      {
        url: '/entity/empty/schedule',
        response: { id: 'empty', name: 'Empty', entityType: 'PARK' },
      },
    ]);

    const provider = createProvider();
    const result = await provider.getParkHours('empty');

    expect(result).toBeNull();
  });

  it('should throw on API error so callers can render a degraded hours state', async () => {
    global.fetch = buildFetchMock([{ url: '/entity/error/schedule', ok: false, status: 500 }]);

    const provider = createProvider();

    await expect(provider.getParkHours('error')).rejects.toThrow('ThemeParks.wiki API error');
  });
});

describe('ThemeParksWikiProvider — getParkWeather', () => {
  it('should fetch entity then Open-Meteo and return mapped weather', async () => {
    const openMeteoResponse = {
      current_weather: {
        temperature: 32,
        weathercode: 0,
        windspeed: 10,
      },
    };

    global.fetch = buildFetchMock([
      { url: '/entity/magic-kingdom', response: mockMagicKingdomEntity },
      { url: 'api.open-meteo.com', response: openMeteoResponse },
    ]);

    const provider = createProvider();
    const result = await provider.getParkWeather('magic-kingdom');

    expect(result).not.toBeNull();
    expect(result).toMatchObject<Partial<ParkWeather>>({
      temperature: 32,
      condition: 'sunny',
      unit: 'C',
    });
  });

  it('should map WMO codes correctly', async () => {
    const testCases: Array<{ code: number; expected: ParkWeather['condition'] }> = [
      { code: 0, expected: 'sunny' },
      { code: 1, expected: 'cloudy' },
      { code: 2, expected: 'cloudy' },
      { code: 3, expected: 'cloudy' },
      { code: 45, expected: 'cloudy' },
      { code: 48, expected: 'cloudy' },
      { code: 51, expected: 'rainy' },
      { code: 61, expected: 'rainy' },
      { code: 71, expected: 'rainy' },
      { code: 80, expected: 'rainy' },
      { code: 95, expected: 'storm' },
      { code: 99, expected: 'storm' },
    ];

    for (const { code, expected } of testCases) {
      jest.resetAllMocks();
      global.fetch = buildFetchMock([
        { url: '/entity/magic-kingdom', response: mockMagicKingdomEntity },
        {
          url: 'api.open-meteo.com',
          response: {
            current_weather: { temperature: 25, weathercode: code, windspeed: 5 },
          },
        },
      ]);

      const provider = createProvider();
      const result = await provider.getParkWeather('magic-kingdom');
      expect(result?.condition).toBe(expected);
    }
  });

  it('should return null if park has no coordinates', async () => {
    const noLocationEntity = {
      id: 'no-location',
      name: 'No Location Park',
      entityType: 'PARK',
    };

    global.fetch = buildFetchMock([{ url: '/entity/no-location', response: noLocationEntity }]);

    const provider = createProvider();
    const result = await provider.getParkWeather('no-location');

    expect(result).toBeNull();
  });

  it('should throw on API error so callers can render a degraded weather state', async () => {
    global.fetch = buildFetchMock([{ url: '/entity/error', ok: false, status: 500 }]);

    const provider = createProvider();

    await expect(provider.getParkWeather('error')).rejects.toThrow('ThemeParks.wiki API error');
  });
});

describe('ThemeParksWikiProvider — error handling', () => {
  it('should keep park lookup graceful while surfacing secondary network errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    const provider = createProvider();

    await expect(provider.getParkById('any')).resolves.toBeNull();
    await expect(provider.getParkHours('any')).rejects.toThrow('Network request failed');
    await expect(provider.getParkWeather('any')).rejects.toThrow('Network request failed');
  });

  it('should keep park lookup graceful while surfacing secondary HTTP errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const provider = createProvider();

    await expect(provider.getParkById('any')).resolves.toBeNull();
    await expect(provider.getParkHours('any')).rejects.toThrow('ThemeParks.wiki API error');
    await expect(provider.getParkWeather('any')).rejects.toThrow('ThemeParks.wiki API error');
  });

  it('should pass abort signal to fetch for timeout support', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'test',
          name: 'Test',
          entityType: 'PARK',
        }),
    });
    global.fetch = fetchMock;

    const provider = createProvider();
    await provider.getParkById('test');

    // Verify fetch was called with a signal
    expect(fetchMock).toHaveBeenCalled();
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1]).toBeDefined();
    expect(callArgs[1].signal).toBeDefined();
    expect(callArgs[1].signal instanceof AbortSignal).toBe(true);
  });
});

describe('ThemeParksWikiProvider — getUserProfile', () => {
  it('should return the mock user profile', async () => {
    const provider = createProvider();
    const profile = await provider.getUserProfile();

    expect(profile).toMatchObject({
      id: 'user-1',
      username: 'coasterfan',
    });
  });
});
