import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiscoveryScreen } from '../DiscoveryScreen';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';
import { ParkDiscoveryContextProvider } from '../../../data/providers/ParkDiscoveryProviderContext';
import { FakeLocationService } from '../../../data/location/__tests__/FakeLocationService';
import type { LocationService } from '../../../data/location/LocationService';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

interface RenderOptions {
  locationService?: LocationService;
  onParkSelect?: (parkId: string) => void;
}

function renderScreen(options: RenderOptions = {}) {
  const queryClient = createTestQueryClient();
  const fixture = new FixtureParkDiscoveryProvider();
  return render(
    <QueryClientProvider client={queryClient}>
      <ParkDiscoveryContextProvider provider={fixture}>
        <DiscoveryScreen
          locationService={
            options.locationService ??
            new FakeLocationService('granted', { latitude: 28.4, longitude: -81.6 })
          }
          onParkSelect={options.onParkSelect}
        />
      </ParkDiscoveryContextProvider>
    </QueryClientProvider>,
  );
}

describe('DiscoveryScreen', () => {
  /** Render and flush cascading effects (userCoords → setSearchQuery, Query promises) */
  async function renderAndFlush(options?: RenderOptions) {
    renderScreen(options);
    // Flush TanStack Query microtasks then React's cascading effects
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('should render the map view', async () => {
    await renderAndFlush();
    expect(screen.getByTestId('discovery-map')).toBeTruthy();
  });

  it('should render the floating search bar', async () => {
    await renderAndFlush();
    expect(screen.getByTestId('search-bar')).toBeTruthy();
    expect(screen.getByTestId('search-name-input')).toBeTruthy();
    expect(screen.getByPlaceholderText('Buscar parques...')).toBeTruthy();
  });

  it('should show search results dropdown when typing', async () => {
    await renderAndFlush();

    // Type in search — Magic Kingdom is near the fake location (28.4, -81.6)
    act(() => {
      fireEvent.changeText(screen.getByTestId('search-name-input'), 'Magic');
    });

    await waitFor(() => {
      expect(screen.getByTestId('search-result-magic-kingdom')).toBeTruthy();
    });
  });

  it('should show no parks message when search matches nothing', async () => {
    await renderAndFlush();

    act(() => {
      fireEvent.changeText(screen.getByTestId('search-name-input'), 'NonExistentPark');
    });

    await waitFor(() => {
      expect(screen.getByText('No parks found')).toBeTruthy();
    });
  });

  it('should handle location permission denied gracefully', async () => {
    await renderAndFlush({
      locationService: new FakeLocationService('denied'),
    });
    // Map should still render, no crash
    expect(screen.getByTestId('discovery-map')).toBeTruthy();
  });

  it('should handle location permission error gracefully', async () => {
    await renderAndFlush({
      locationService: new FakeLocationService('error'),
    });
    // Map should still render, no crash
    expect(screen.getByTestId('discovery-map')).toBeTruthy();
  });

  it('should call onParkSelect when a park is selected from search results', async () => {
    const onParkSelect = jest.fn();
    await renderAndFlush({ onParkSelect });

    act(() => {
      fireEvent.changeText(screen.getByTestId('search-name-input'), 'Magic');
    });

    await waitFor(() => {
      expect(screen.getByTestId('search-result-magic-kingdom')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('search-result-magic-kingdom'));
    expect(onParkSelect).toHaveBeenCalledWith('magic-kingdom');
  });
});
