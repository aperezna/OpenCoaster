import React from 'react';
import { Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import { useParkDetail } from '../useParkDetail';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';
import type { ParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function TestComponent({ parkId, provider }: { parkId: string; provider: ParkDiscoveryProvider }) {
  const {
    park,
    weather,
    hours,
    attractions,
    isLoading,
    error,
    weatherError,
    hoursError,
    attractionsError,
  } = useParkDetail(parkId, provider);

  if (isLoading)
    return (
      <View testID="loading-view">
        <Text>Loading...</Text>
      </View>
    );

  return (
    <View testID="loaded-view">
      <Text testID="park-name">{park?.name ?? 'null'}</Text>
      <Text testID="weather-temp">{weather?.temperature ?? 'null'}</Text>
      <Text testID="hours-opening">{hours?.opening ?? 'null'}</Text>
      <Text testID="attraction-count">{attractions?.length ?? 0}</Text>
      <Text testID="park-error">{error?.message ?? 'null'}</Text>
      <Text testID="weather-error">{weatherError?.message ?? 'null'}</Text>
      <Text testID="hours-error">{hoursError?.message ?? 'null'}</Text>
      <Text testID="attractions-error">{attractionsError?.message ?? 'null'}</Text>
    </View>
  );
}

function renderHook(parkId: string, provider: ParkDiscoveryProvider) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TestComponent parkId={parkId} provider={provider} />
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useParkDetail', () => {
  it('should return park details for a valid parkId', async () => {
    const fixture = new FixtureParkDiscoveryProvider();
    renderHook('magic-kingdom', fixture);

    await waitFor(() => {
      expect(screen.getByTestId('park-name')).toHaveTextContent('Magic Kingdom');
    });
    expect(screen.getByTestId('weather-temp')).toHaveTextContent('32');
    expect(screen.getByTestId('hours-opening')).toHaveTextContent('09:00');
    expect(screen.getByTestId('attraction-count')).toHaveTextContent('5');
  });

  it('should return park detail for a second valid parkId (triangulation)', async () => {
    const fixture = new FixtureParkDiscoveryProvider();
    renderHook('disneyland-paris', fixture);

    await waitFor(() => {
      expect(screen.getByTestId('park-name')).toHaveTextContent('Disneyland Park');
    });
    expect(screen.getByTestId('weather-temp')).toHaveTextContent('22');
    expect(screen.getByTestId('hours-opening')).toHaveTextContent('09:30');
    expect(screen.getByTestId('attraction-count')).toHaveTextContent('4');
  });

  it('should handle unknown parkId gracefully (park is null)', async () => {
    const fixture = new FixtureParkDiscoveryProvider();
    renderHook('non-existent-park', fixture);

    await waitFor(() => {
      expect(screen.getByTestId('park-name')).toHaveTextContent('null');
    });
  });

  it('should show loading state initially', async () => {
    const fixture = new FixtureParkDiscoveryProvider();
    renderHook('magic-kingdom', fixture);

    expect(screen.getByTestId('loading-view')).toBeOnTheScreen();
  });

  it('should keep park data when weather fails and surface only the weather error', async () => {
    class WeatherFailureProvider extends FixtureParkDiscoveryProvider {
      async getParkWeather(): Promise<never> {
        throw new Error('Weather service offline');
      }
    }

    renderHook('magic-kingdom', new WeatherFailureProvider());

    await waitFor(() => {
      expect(screen.getByTestId('park-name')).toHaveTextContent('Magic Kingdom');
    });

    expect(screen.getByTestId('weather-temp')).toHaveTextContent('null');
    expect(screen.getByTestId('hours-opening')).toHaveTextContent('09:00');
    expect(screen.getByTestId('attraction-count')).toHaveTextContent('5');
    expect(screen.getByTestId('park-error')).toHaveTextContent('null');
    expect(screen.getByTestId('weather-error')).toHaveTextContent('Weather service offline');
    expect(screen.getByTestId('hours-error')).toHaveTextContent('null');
    expect(screen.getByTestId('attractions-error')).toHaveTextContent('null');
  });
});
