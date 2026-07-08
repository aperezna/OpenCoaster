import type { ParkSummary } from '../models/ParkSummary';

export const fixtureParks: ParkSummary[] = [
  {
    id: 'magic-kingdom',
    name: 'Magic Kingdom',
    city: 'Orlando',
    country: 'US',
    latitude: 28.4177,
    longitude: -81.5812,
    photoUrl: 'https://example.com/magic-kingdom.jpg',
    timezone: 'America/New_York',
  },
  {
    id: 'disneyland-paris',
    name: 'Disneyland Park',
    city: 'Marne-la-Vallée',
    country: 'FR',
    latitude: 48.8675,
    longitude: 2.7825,
    photoUrl: 'https://example.com/disneyland-paris.jpg',
    timezone: 'Europe/Paris',
  },
  {
    id: 'efteling',
    name: 'Efteling',
    city: 'Kaatsheuvel',
    country: 'NL',
    latitude: 51.6503,
    longitude: 5.0485,
    timezone: 'Europe/Amsterdam',
  },
];
