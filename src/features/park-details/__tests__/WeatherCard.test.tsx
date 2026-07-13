import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { WeatherCard } from '../WeatherCard';

describe('WeatherCard', () => {
  const mockWeather = {
    temperature: 28,
    unit: 'C' as const,
    condition: 'sunny' as const,
  };

  it('should render translated card title', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText('weather.title')).toBeTruthy();
  });

  it('should render translated condition labels', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText('weather.sunny')).toBeTruthy();
  });
});
