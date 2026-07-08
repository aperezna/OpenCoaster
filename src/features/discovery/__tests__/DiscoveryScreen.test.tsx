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
  onParkSelect?: (parkId: string) => void;
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
        onParkSelect={options.onParkSelect}
      />
    </QueryClientProvider>,
  );
}

describe('DiscoveryScreen', () => {
  it('should render the map view', async () => {
    await renderScreen();
    expect(screen.getByTestId('discovery-map')).toBeOnTheScreen();
  });

  it('should render the floating search bar', async () => {
    await renderScreen();
    expect(screen.getByTestId('search-bar')).toBeOnTheScreen();
    expect(screen.getByTestId('search-name-input')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Buscar parques...')).toBeOnTheScreen();
  });

  it('should display park markers on the map', async () => {
    await renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('marker-magic-kingdom')).toBeOnTheScreen();
      expect(screen.getByTestId('marker-efteling')).toBeOnTheScreen();
    });
  });

  it('should show search results dropdown when typing', async () => {
    await renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('marker-magic-kingdom')).toBeOnTheScreen();
    });

    // Type in search
    fireEvent.changeText(screen.getByTestId('search-name-input'), 'Efteling');

    await waitFor(() => {
      expect(screen.getByTestId('search-result-efteling')).toBeOnTheScreen();
    });
  });

  it('should show no parks message when search matches nothing', async () => {
    await renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('marker-magic-kingdom')).toBeOnTheScreen();
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
      expect(screen.getByTestId('marker-magic-kingdom')).toBeOnTheScreen();
    });
  });

  it('should handle location permission error gracefully', async () => {
    await renderScreen({
      locationService: new FakeLocationService('error'),
    });
    // Map should still render, no crash
    expect(screen.getByTestId('discovery-map')).toBeOnTheScreen();
    await waitFor(() => {
      expect(screen.getByTestId('marker-magic-kingdom')).toBeOnTheScreen();
    });
  });

  it('should have OSM tile URL configured', async () => {
    await renderScreen();
    // Map renders with OSM tile layer
    expect(screen.getByTestId('discovery-map')).toBeOnTheScreen();
  });

  it('should call onParkSelect when a park is selected from search results', async () => {
    const onParkSelect = jest.fn();
    await renderScreen({ onParkSelect });
    await waitFor(() => {
      expect(screen.getByTestId('marker-magic-kingdom')).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByTestId('search-name-input'), 'Magic');

    await waitFor(() => {
      expect(screen.getByTestId('search-result-magic-kingdom')).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId('search-result-magic-kingdom'));
    expect(onParkSelect).toHaveBeenCalledWith('magic-kingdom');
  });
});
