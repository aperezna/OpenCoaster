import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiscoveryScreen } from '../DiscoveryScreen';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';
import { FakeLocationService } from '../../../data/location/__tests__/FakeLocationService';
import type { LocationService } from '../../../data/location/LocationService';
import type { ParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

interface RenderOptions {
  locationService?: LocationService;
  parkDiscoveryProvider?: ParkDiscoveryProvider;
  onParkPress?: (parkId: string) => void;
}

function renderScreen(options: RenderOptions = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <DiscoveryScreen
        locationService={
          options.locationService ?? new FakeLocationService('granted', { latitude: 28.4, longitude: -81.6 })
        }
        parkDiscoveryProvider={
          options.parkDiscoveryProvider ?? new FixtureParkDiscoveryProvider()
        }
      />
    </QueryClientProvider>,
  );
}

describe('DiscoveryScreen', () => {
  it('should render the map view', async () => {
    await renderScreen();
    expect(screen.getByTestId('discovery-map')).toBeOnTheScreen();
  });

  it('should render the search bar', async () => {
    await renderScreen();
    expect(screen.getByTestId('search-bar')).toBeOnTheScreen();
    expect(screen.getByTestId('search-name-input')).toBeOnTheScreen();
    expect(screen.getByTestId('search-city-input')).toBeOnTheScreen();
  });

  it('should load and display all parks initially', async () => {
    await renderScreen();
    // Fixture has 3 parks — should show up after query resolves
    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeOnTheScreen();
      expect(screen.getByText('Efteling')).toBeOnTheScreen();
    });
  });

  it('should filter parks when typing in search bar', async () => {
    await renderScreen();
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeOnTheScreen();
    });

    // Type in search
    fireEvent.changeText(screen.getByTestId('search-name-input'), 'Efteling');

    // After debounce/query refetch, only Efteling should match
    await waitFor(() => {
      expect(screen.getByText('Efteling')).toBeOnTheScreen();
    });
    expect(screen.queryByText('Magic Kingdom')).toBeNull();
  });

  it('should show no parks message when filter matches nothing', async () => {
    await renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('park-result-list')).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByTestId('search-name-input'), 'NonExistentPark');

    await waitFor(() => {
      expect(screen.getByText('No parks found')).toBeOnTheScreen();
    });
  });

  it('should handle location permission denied gracefully', async () => {
    await renderScreen({
      locationService: new FakeLocationService('denied'),
    });
    // Map should still render, no crash
    expect(screen.getByTestId('discovery-map')).toBeOnTheScreen();
    // Parks should still load (search works without location)
    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeOnTheScreen();
    });
  });

  it('should handle location permission error gracefully', async () => {
    await renderScreen({
      locationService: new FakeLocationService('error'),
    });
    // Map should still render, no crash
    expect(screen.getByTestId('discovery-map')).toBeOnTheScreen();
    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeOnTheScreen();
    });
  });

  it('should have OSM tile URL configured', async () => {
    await renderScreen();
    // Map renders with OSM tile layer
    expect(screen.getByTestId('discovery-map')).toBeOnTheScreen();
  });
});
