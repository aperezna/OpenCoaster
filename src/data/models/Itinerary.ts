export interface Itinerary {
  id: string;
  parkId: string;
  parkName: string;
  date?: string; // ISO 8601 date (YYYY-MM-DD), undefined = "Date TBD"
  items: ItineraryItem[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ItineraryItem {
  id: string; // unique within itinerary
  attractionId: string;
  name: string;
  order: number; // 0-based position
}

export const ITINERARIES_KEY = 'opencoaster:itineraries';
