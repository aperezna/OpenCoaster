export interface ParkWeather {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'storm' | 'rainy';
  unit: string;
}
