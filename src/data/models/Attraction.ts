export interface Attraction {
  id: string;
  name: string;
  parkId: string;
  waitTime: number;
  status: 'operating' | 'closed' | 'down';
  type: 'roller_coaster' | 'water_ride' | 'dark_ride' | 'flat_ride' | 'show' | 'family';
}
