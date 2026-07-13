import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react-native';
import { RootNavigator, type RootTabParamList } from '../RootNavigator';
import { ParkDiscoveryContextProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import { FixtureParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProvider';

// react-i18next is auto-mocked via jest.config.js moduleNameMapper
// t(key) returns the key itself, so we assert key names directly

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
  function renderAndFlush(initialRouteName?: keyof RootTabParamList) {
    renderNavigator(initialRouteName);
    // Flush cascading effects via synchronous act scopes
    act(() => {});
    act(() => {});
  }

  it('should render the Mapa tab as the initial route with translated label', () => {
    renderAndFlush('Mapa');
    expect(screen.getByTestId('discovery-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-icon-Mapa')).toBeOnTheScreen();
    expect(screen.getByTestId('ionicon-map')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-label-Mapa')).toHaveTextContent('nav.map');
  });

  it('should mount the ParquesStackNavigator (parks list) when Parques tab is selected with translated label', () => {
    renderAndFlush('Parques');
    expect(screen.getByTestId('parks-list-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-icon-Parques')).toBeOnTheScreen();
    expect(screen.getByTestId('ionicon-business')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-label-Parques')).toHaveTextContent('nav.parks');
  });

  it('should render the Usuario tab icon and translated label when Usuario is selected', () => {
    renderAndFlush('Usuario');
    expect(screen.getByTestId('tab-icon-Usuario')).toBeOnTheScreen();
    expect(screen.getByTestId('ionicon-person')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-label-Usuario')).toHaveTextContent('nav.profile');
  });

  it('should render fallback view with translated text for unknown route', () => {
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
    act(() => {});
    act(() => {});
    expect(screen.getByTestId('fallback-view')).toBeOnTheScreen();
    expect(screen.getByText('nav.screenNotFound')).toBeOnTheScreen();
  });
});
