import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { RootNavigator, type RootStackParamList } from '../RootNavigator';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

async function renderNavigator(
  initialRouteName?: keyof RootStackParamList,
) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RootNavigator initialRouteName={initialRouteName} />
    </QueryClientProvider>,
  );
}

describe('RootNavigator', () => {
  it('should render the DiscoveryScreen as the initial route', async () => {
    await renderNavigator('Discovery');
    expect(screen.getByTestId('discovery-screen')).toBeOnTheScreen();
  });

  it('should mount ParkDetailScreen when navigated with parkId param', async () => {
    await renderNavigator('ParkDetail');
    expect(screen.getByTestId('park-detail-screen')).toBeOnTheScreen();
  });
});
