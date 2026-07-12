import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import { ParquesStackNavigator } from '../ParquesStackNavigator';
import { FixtureParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProvider';
import { ParkDiscoveryContextProvider } from '../../data/providers/ParkDiscoveryProviderContext';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderStack() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ParkDiscoveryContextProvider provider={new FixtureParkDiscoveryProvider()}>
        <NavigationContainer>
          <ParquesStackNavigator />
        </NavigationContainer>
      </ParkDiscoveryContextProvider>
    </QueryClientProvider>,
  );
}

describe('ParquesStackNavigator', () => {
  it('should show parks list on mount', async () => {
    renderStack();
    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
      expect(screen.getByText('Disneyland Park')).toBeTruthy();
    });
  });
});
