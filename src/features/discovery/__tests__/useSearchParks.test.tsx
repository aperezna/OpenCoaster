import React from 'react';
import { Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import { useSearchParks } from '../useSearchParks';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';
import type { ParkSearchQuery } from '../../../data/providers/ParkDiscoveryProvider';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function TestComponent({ query }: { query: ParkSearchQuery }) {
  const provider = React.useMemo(() => new FixtureParkDiscoveryProvider(), []);
  const { parks, isLoading, error } = useSearchParks(query, provider);

  if (isLoading) return <View testID="loading-view"><Text>Loading...</Text></View>;
  if (error) return <View testID="error-view"><Text>Error: {error.message}</Text></View>;
  return (
    <View testID="results-view">
      {(parks ?? []).map((p) => (
        <Text key={p.id} testID={`park-${p.id}`}>
          {p.name}
        </Text>
      ))}
    </View>
  );
}

function renderHook(query: ParkSearchQuery) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TestComponent query={query} />
    </QueryClientProvider>,
  );
}

describe('useSearchParks', () => {
  it('should return parks matching name query', async () => {
    renderHook({ name: 'Magic' });
    await waitFor(() => {
      expect(screen.getByTestId('park-magic-kingdom')).toBeOnTheScreen();
    });
  });

  it('should return all parks for empty query', async () => {
    renderHook({});
    await waitFor(() => {
      expect(screen.getByTestId('park-magic-kingdom')).toBeOnTheScreen();
      expect(screen.getByTestId('park-disneyland-paris')).toBeOnTheScreen();
      expect(screen.getByTestId('park-efteling')).toBeOnTheScreen();
    });
  });

  it('should return empty array for no match', async () => {
    renderHook({ name: 'NonExistentPark' });
    await waitFor(() => {
      expect(screen.getByTestId('results-view')).toBeOnTheScreen();
    });
    expect(screen.queryByTestId('park-magic-kingdom')).toBeNull();
  });

  it('should support combined name+city filter', async () => {
    renderHook({ name: 'Magic', city: 'Orlando' });
    await waitFor(() => {
      expect(screen.getByTestId('park-magic-kingdom')).toBeOnTheScreen();
    });
    expect(screen.queryByTestId('park-efteling')).toBeNull();
  });
});
