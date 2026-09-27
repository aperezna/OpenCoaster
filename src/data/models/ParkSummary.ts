import type { ImageMetadata } from '../images/imageMetadata';

export interface ParkSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  timezone?: string;
  address?: string;
  phone?: string;
  website?: string;
  /** Licensed image metadata; photoUrl remains the legacy ThemeParks media field. */
  image?: ImageMetadata;
}
