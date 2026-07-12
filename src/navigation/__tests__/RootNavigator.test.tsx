import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { RootNavigator, type RootTabParamList } from '../RootNavigator';
import { ParkDiscoveryContextProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import { FixtureParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProvider';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

async function renderNavigator(initialRouteName?: keyof RootTabParamList) {
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
  it('should render the Mapa tab as the initial route', async () => {
    await renderNavigator('Mapa');
    expect(screen.getByTestId('discovery-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-icon-Mapa')).toBeOnTheScreen();
    expect(screen.getByTestId('ionicon-map')).toBeOnTheScreen();
  });

  it('should mount the ParquesStackNavigator (parks list) when Parques tab is selected', async () => {
    await renderNavigator('Parques');
    expect(screen.getByTestId('parks-list-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('tab-icon-Parques')).toBeOnTheScreen();
    expect(screen.getByTestId('ionicon-business')).toBeOnTheScreen();
  });

  it('should render the Usuario tab icon when Usuario is selected', async () => {
    await renderNavigator('Usuario');
    expect(screen.getByTestId('tab-icon-Usuario')).toBeOnTheScreen();
    expect(screen.getByTestId('ionicon-person')).toBeOnTheScreen();
  });

  it('should render fallback view for unknown route', async () => {
    const queryClient = createTestQueryClient();
    const fixture = new FixtureParkDiscoveryProvider();
    await render(
      <QueryClientProvider client={queryClient}>
        <ParkDiscoveryContextProvider provider={fixture}>
          <RootNavigator initialRouteName={'Unknown' as keyof RootTabParamList} />
        </ParkDiscoveryContextProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('fallback-view')).toBeOnTheScreen();
  });
});
