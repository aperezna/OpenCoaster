import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { RootNavigator, type RootTabParamList } from '../RootNavigator';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

async function renderNavigator(
  initialRouteName?: keyof RootTabParamList,
) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RootNavigator initialRouteName={initialRouteName} />
    </QueryClientProvider>,
  );
}

describe('RootNavigator', () => {
  it('should render the Mapa tab as the initial route', async () => {
    await renderNavigator('Mapa');
    expect(screen.getByTestId('discovery-screen')).toBeOnTheScreen();
  });

  it('should mount ParkDetailScreen when Parques tab is selected', async () => {
    await renderNavigator('Parques');
    expect(screen.getByTestId('park-detail-screen')).toBeOnTheScreen();
  });

  it('should render fallback view for unknown route', async () => {
    const queryClient = createTestQueryClient();
    await render(
      <QueryClientProvider client={queryClient}>
        <RootNavigator initialRouteName={'Unknown' as keyof RootTabParamList} />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('fallback-view')).toBeOnTheScreen();
  });
});
