import type { ParkSummary } from '../models/ParkSummary';
import type { ParkWeather } from '../models/ParkWeather';
import type { ParkHours } from '../models/ParkHours';
import type { Attraction } from '../models/Attraction';
import type { UserProfile } from '../models/UserProfile';

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
    address: '1180 Seven Seas Dr, Lake Buena Vista, FL 32830',
    phone: '+1-407-939-5277',
    website: 'https://disneyworld.disney.go.com/destinations/magic-kingdom/',
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
    address: 'Boulevard de Parc, 77700 Coupvray, France',
    phone: '+33-1-60-30-60-30',
    website: 'https://www.disneylandparis.com/',
  },
  {
    id: 'efteling',
    name: 'Efteling',
    city: 'Kaatsheuvel',
    country: 'NL',
    latitude: 51.6503,
    longitude: 5.0485,
    timezone: 'Europe/Amsterdam',
    address: 'Europalaan 1, 5171 KW Kaatsheuvel, Netherlands',
    phone: '+31-900-0161',
    website: 'https://www.efteling.com/',
  },
];

export const fixtureWeather: Record<string, ParkWeather> = {
  'magic-kingdom': {
    temperature: 32,
    condition: 'sunny',
    unit: 'C',
  },
  'disneyland-paris': {
    temperature: 22,
    condition: 'cloudy',
    unit: 'C',
  },
  efteling: {
    temperature: 18,
    condition: 'rainy',
    unit: 'C',
  },
};

export const fixtureHours: Record<string, ParkHours> = {
  'magic-kingdom': {
    opening: '09:00',
    closing: '22:00',
    timezone: 'America/New_York',
  },
  'disneyland-paris': {
    opening: '09:30',
    closing: '20:00',
    timezone: 'Europe/Paris',
  },
  efteling: {
    opening: '10:00',
    closing: '18:00',
    timezone: 'Europe/Amsterdam',
  },
};

export const fixtureAttractions: Attraction[] = [
  // Magic Kingdom
  {
    id: 'mk-space-mountain',
    name: 'Space Mountain',
    parkId: 'magic-kingdom',
    waitTime: 45,
    status: 'operating',
    type: 'roller_coaster',
  },
  {
    id: 'mk-pirates',
    name: 'Pirates of the Caribbean',
    parkId: 'magic-kingdom',
    waitTime: 20,
    status: 'operating',
    type: 'dark_ride',
  },
  {
    id: 'mk-haunted-mansion',
    name: 'Haunted Mansion',
    parkId: 'magic-kingdom',
    waitTime: 30,
    status: 'operating',
    type: 'dark_ride',
  },
  {
    id: 'mk-thunder',
    name: 'Big Thunder Mountain',
    parkId: 'magic-kingdom',
    waitTime: 35,
    status: 'operating',
    type: 'roller_coaster',
  },
  {
    id: 'mk-carousel',
    name: 'Prince Charming Carousel',
    parkId: 'magic-kingdom',
    waitTime: 10,
    status: 'operating',
    type: 'family',
  },
  // Disneyland Paris
  {
    id: 'dlp-space-mountain',
    name: 'Space Mountain: Mission 2',
    parkId: 'disneyland-paris',
    waitTime: 40,
    status: 'operating',
    type: 'roller_coaster',
  },
  {
    id: 'dlp-pirates',
    name: 'Pirates of the Caribbean',
    parkId: 'disneyland-paris',
    waitTime: 15,
    status: 'operating',
    type: 'dark_ride',
  },
  {
    id: 'dlp-big-thunder',
    name: 'Big Thunder Mountain',
    parkId: 'disneyland-paris',
    waitTime: 25,
    status: 'operating',
    type: 'roller_coaster',
  },
  {
    id: 'dlp-hyperspace',
    name: 'Hyperspace Mountain',
    parkId: 'disneyland-paris',
    waitTime: 50,
    status: 'down',
    type: 'roller_coaster',
  },
  // Efteling
  {
    id: 'ef-baron',
    name: 'Baron 1898',
    parkId: 'efteling',
    waitTime: 30,
    status: 'operating',
    type: 'roller_coaster',
  },
  {
    id: 'ef-vogelrok',
    name: 'Vogel Rok',
    parkId: 'efteling',
    waitTime: 20,
    status: 'operating',
    type: 'dark_ride',
  },
  {
    id: 'ef-python',
    name: 'Python',
    parkId: 'efteling',
    waitTime: 35,
    status: 'operating',
    type: 'roller_coaster',
  },
  {
    id: 'ef-droomvlucht',
    name: 'Droomvlucht',
    parkId: 'efteling',
    waitTime: 25,
    status: 'operating',
    type: 'dark_ride',
  },
  {
    id: 'ef-symbolica',
    name: 'Symbolica',
    parkId: 'efteling',
    waitTime: 15,
    status: 'operating',
    type: 'family',
  },
];

export const mockUserProfile: UserProfile = {
  id: 'user-1',
  username: 'coasterfan',
  email: 'coasterfan@example.com',
  avatarUrl: 'https://example.com/avatars/coasterfan.png',
  memberSince: '2025-06-01',
};
