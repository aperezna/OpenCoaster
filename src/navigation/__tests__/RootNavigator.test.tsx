import React from 'react';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react-native';
import { RootNavigator, type RootTabParamList } from '../RootNavigator';
import { ParkDiscoveryContextProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import { FixtureParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProvider';

// react-i18next is auto-mocked via jest.config.js moduleNameMapper
// t(key) returns the key itself, so we assert key names directly

const mockUseSearchHistory = {
  queries: [] as string[],
  add: jest.fn(),
  clear: jest.fn(),
  isLoading: false,
};

jest.mock('../../features/discovery/useSearchHistory', () => ({
  useSearchHistory: () => mockUseSearchHistory,
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderNavigator(initialRouteName?: keyof RootTabParamList) {
  const queryClient = createTestQueryClient();
  const fixture = new FixtureParkDiscoveryProvider();
  return render(
    <QueryClientProvider client={queryClient}>
      <ParkDiscoveryContextProvider provider={fixture}>
        <RootNavigator initialRouteName={initialRouteName} />
      </ParkDiscoveryContextProvider>
    </QueryClientProvider>,
  );
}

describe('RootNavigator', () => {
  // React Query's default notify scheduler uses setTimeout(0), so query
  // notifications can land outside act(). Run them synchronously inside act,
  // matching DiscoveryScreen.test.tsx (the same query-using screens mount here).
  beforeAll(() => {
    notifyManager.setNotifyFunction((callback) => {
      act(callback);
    });
    notifyManager.setScheduler((callback) => {
      callback();
    });
  });

  afterAll(() => {
    notifyManager.setNotifyFunction((callback) => {
      callback();
    });
    notifyManager.setScheduler((callback) => {
      setTimeout(callback, 0);
    });
  });

  async function renderAndFlush(initialRouteName?: keyof RootTabParamList) {
    renderNavigator(initialRouteName);
    // Flush promise-based effects (location + react-query) inside act scopes
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('should render the Mapa tab as the initial route with translated label', async () => {
    await renderAndFlush('Mapa');
    expect(screen.getByTestId('discovery-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-icon-Mapa')).toBeOnTheScreen();
    expect(screen.getByTestId('ionicon-map')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-label-Mapa')).toHaveTextContent('nav.map');
  });

  it('should mount the ParquesStackNavigator (parks list) when Parques tab is selected with translated label', async () => {
    await renderAndFlush('Parques');
    expect(screen.getByTestId('parks-list-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-icon-Parques')).toBeOnTheScreen();
    expect(screen.getByTestId('ionicon-business')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-label-Parques')).toHaveTextContent('nav.parks');
  });

  it('should render the Usuario tab icon and translated label when Usuario is selected', async () => {
    await renderAndFlush('Usuario');
    expect(screen.getByTestId('tab-icon-Usuario')).toBeOnTheScreen();
    expect(screen.getByTestId('ionicon-person')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-label-Usuario')).toHaveTextContent('nav.profile');
  });

  it('should render fallback view with translated text for unknown route', async () => {
    const queryClient = createTestQueryClient();
    const fixture = new FixtureParkDiscoveryProvider();
    render(
      <QueryClientProvider client={queryClient}>
        <ParkDiscoveryContextProvider provider={fixture}>
          <RootNavigator initialRouteName={'Unknown' as keyof RootTabParamList} />
        </ParkDiscoveryContextProvider>
      </QueryClientProvider>,
    );
    // Flush cascading effects
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('fallback-view')).toBeOnTheScreen();
    expect(screen.getByText('nav.screenNotFound')).toBeOnTheScreen();
  });
});
