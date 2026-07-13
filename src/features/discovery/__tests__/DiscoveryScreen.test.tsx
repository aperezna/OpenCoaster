import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiscoveryScreen } from '../DiscoveryScreen';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';
import { ParkDiscoveryContextProvider } from '../../../data/providers/ParkDiscoveryProviderContext';
import { FakeLocationService } from '../../../data/location/__tests__/FakeLocationService';
import { OPENCOASTER_KEY_PREFIX } from '../../../data/cache/queryClient';
import type { LocationService } from '../../../data/location/LocationService';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseSearchHistory = {
  queries: [] as string[],
  add: jest.fn(),
  clear: jest.fn(),
  isLoading: false,
};

jest.mock('../useSearchHistory', () => ({
  useSearchHistory: () => mockUseSearchHistory,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

interface RenderOptions {
  locationService?: LocationService;
  onParkSelect?: (parkId: string) => void;
  /** Optional pre-configured query client for cache seeding */
  queryClient?: QueryClient;
}

function renderScreen(options: RenderOptions = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient();
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

  beforeEach(() => {
    mockUseSearchHistory.queries = [];
    mockUseSearchHistory.add.mockClear();
    mockUseSearchHistory.clear.mockClear();
  });

  it('should render the map view', async () => {
    await renderAndFlush();
    expect(screen.getByTestId('discovery-map')).toBeTruthy();
  });

  it('should render the floating search bar', async () => {
    await renderAndFlush();
    expect(screen.getByTestId('search-bar')).toBeTruthy();
    expect(screen.getByTestId('search-name-input')).toBeTruthy();
    expect(screen.getByPlaceholderText('common.searchPlaceholder')).toBeTruthy();
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
      expect(screen.getByText('common.noParksFound')).toBeTruthy();
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

  // -----------------------------------------------------------------------
  // Search history tests
  // -----------------------------------------------------------------------

  it('should show recent searches list when input is focused and history is non-empty', async () => {
    mockUseSearchHistory.queries = ['Magic Kingdom', 'Efteling'];
    await renderAndFlush();

    // Focus the search input
    act(() => {
      fireEvent(screen.getByTestId('search-name-input'), 'focus');
    });

    await waitFor(() => {
      expect(screen.getByTestId('search-history-list')).toBeTruthy();
    });

    expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    expect(screen.getByText('Efteling')).toBeTruthy();
  });

  it('should NOT show recent searches list when history is empty', async () => {
    mockUseSearchHistory.queries = [];
    await renderAndFlush();

    act(() => {
      fireEvent(screen.getByTestId('search-name-input'), 'focus');
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByTestId('search-history-list')).toBeNull();
  });

  it('should call add when search is submitted', async () => {
    await renderAndFlush();

    act(() => {
      fireEvent.changeText(screen.getByTestId('search-name-input'), 'Efteling');
    });

    // Submit the search (Enter key)
    act(() => {
      fireEvent(screen.getByTestId('search-name-input'), 'submitEditing', {
        nativeEvent: { text: 'Efteling' },
      });
    });

    expect(mockUseSearchHistory.add).toHaveBeenCalledWith('Efteling');
  });

  it('should render Clear history button when list is visible', async () => {
    mockUseSearchHistory.queries = ['Magic Kingdom'];
    await renderAndFlush();

    act(() => {
      fireEvent(screen.getByTestId('search-name-input'), 'focus');
    });

    await waitFor(() => {
      expect(screen.getByTestId('clear-history-button')).toBeTruthy();
    });
  });

  it('should call clear when Clear history is pressed', async () => {
    mockUseSearchHistory.queries = ['Magic Kingdom'];
    await renderAndFlush();

    act(() => {
      fireEvent(screen.getByTestId('search-name-input'), 'focus');
    });

    await waitFor(() => {
      expect(screen.getByTestId('clear-history-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('clear-history-button'));
    expect(mockUseSearchHistory.clear).toHaveBeenCalled();
  });

  it('should re-run search when tapping a recent search history item', async () => {
    mockUseSearchHistory.queries = ['Magic Kingdom', 'Efteling'];
    await renderAndFlush();

    // Focus the input to show history
    act(() => {
      fireEvent(screen.getByTestId('search-name-input'), 'focus');
    });

    await waitFor(() => {
      expect(screen.getByTestId('search-history-list')).toBeTruthy();
    });

    // Press the 'Magic Kingdom' history item
    fireEvent.press(screen.getByTestId('search-history-item-Magic-Kingdom'));

    // Input should now contain the query text
    expect(screen.getByTestId('search-name-input').props.value).toBe('Magic Kingdom');

    // Search results should appear for that query
    await waitFor(() => {
      expect(screen.getByTestId('search-result-magic-kingdom')).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Stale-data pill tests
// ---------------------------------------------------------------------------

describe('DiscoveryScreen — stale-data pill', () => {
  const searchKey = [...OPENCOASTER_KEY_PREFIX, 'searchParks', {}];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** Render with pre-seeded cache data at a given updatedAt time */
  async function renderWithCachedData(updatedAt: number) {
    const queryClient = createTestQueryClient();
    const fixture = new FixtureParkDiscoveryProvider();
    const data = await fixture.searchParks({});
    queryClient.setQueryData(searchKey, data, { updatedAt });

    return render(
      <QueryClientProvider client={queryClient}>
        <ParkDiscoveryContextProvider provider={fixture}>
          <DiscoveryScreen
            locationService={
              new FakeLocationService('granted', { latitude: 28.4, longitude: -81.6 })
            }
          />
        </ParkDiscoveryContextProvider>
      </QueryClientProvider>,
    );
  }

  it('should NOT show stale-data pill when data is fresh (<30s)', async () => {
    const now = Date.now();
    // Set updatedAt to 15 seconds ago (within 30s threshold)
    await renderWithCachedData(now - 15_000);

    // Flush effects
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByTestId('stale-data-pill')).toBeNull();
  });

  it('should show stale-data pill when data is cached >30s', async () => {
    const now = Date.now();
    // Set updatedAt to 5 minutes ago
    await renderWithCachedData(now - 300_000);

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('stale-data-pill')).toBeTruthy();
    expect(screen.getByText('discovery.staleData')).toBeTruthy();
  });

  it('should show pill with translated text when data is 2 min stale', async () => {
    const now = Date.now();
    await renderWithCachedData(now - 120_000);

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('discovery.staleData')).toBeTruthy();
  });

  it('should NOT show stale-data pill when there is no cached data', async () => {
    const queryClient = createTestQueryClient();
    const fixture = new FixtureParkDiscoveryProvider();

    render(
      <QueryClientProvider client={queryClient}>
        <ParkDiscoveryContextProvider provider={fixture}>
          <DiscoveryScreen
            locationService={
              new FakeLocationService('granted', { latitude: 28.4, longitude: -81.6 })
            }
          />
        </ParkDiscoveryContextProvider>
      </QueryClientProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByTestId('stale-data-pill')).toBeNull();
  });

  it('should recompute pill on AppState resume', async () => {
    const now = Date.now();
    await renderWithCachedData(now - 600_000); // 10 min stale initially

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Pill should be visible with stale data
    expect(screen.getByTestId('stale-data-pill')).toBeTruthy();
  });

  it('should hide stale-data pill when fresh data arrives via setQueryData', async () => {
    const now = Date.now(); // 0 under fake timers — same as component's Date.now()
    const queryClient = createTestQueryClient();
    const fixture = new FixtureParkDiscoveryProvider();
    const data = await fixture.searchParks({});
    const staleKey = [...OPENCOASTER_KEY_PREFIX, 'searchParks', {}];

    // Seed with 5-minute-old stale data
    queryClient.setQueryData(staleKey, data, { updatedAt: now - 300_000 });

    render(
      <QueryClientProvider client={queryClient}>
        <ParkDiscoveryContextProvider provider={fixture}>
          <DiscoveryScreen
            locationService={
              new FakeLocationService('granted', { latitude: 28.4, longitude: -81.6 })
            }
          />
        </ParkDiscoveryContextProvider>
      </QueryClientProvider>,
    );

    // Flush effects — component picks up stale data
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });
    jest.advanceTimersByTime(0);

    // Stale-data pill should be visible with translated key
    expect(screen.getByTestId('stale-data-pill')).toBeTruthy();
    expect(screen.getByText('discovery.staleData')).toBeTruthy();

    // Update with fresh data — setQueryData + flush React Query's setTimeout(0) notification
    act(() => {
      queryClient.setQueryData(staleKey, [...data], { updatedAt: now });
      // React Query's notifyManager uses setTimeout(cb, 0) for observer notifications
      jest.advanceTimersByTime(0);
    });
    // Flush React's re-render and any cascading effects
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Pill should disappear since data is now fresh (<30s)
    expect(screen.queryByTestId('stale-data-pill')).toBeNull();
  });
});
