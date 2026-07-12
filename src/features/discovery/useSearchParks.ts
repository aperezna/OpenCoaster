import { useQuery } from '@tanstack/react-query';
import { OPENCOASTER_KEY_PREFIX } from '../../data/cache/queryClient';
import type { ParkSummary } from '../../data/models/ParkSummary';
import type {
  ParkDiscoveryProvider,
  ParkSearchQuery,
} from '../../data/providers/ParkDiscoveryProvider';

export function useSearchParks(
  query: ParkSearchQuery,
  provider: ParkDiscoveryProvider,
): {
  parks: ParkSummary[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...OPENCOASTER_KEY_PREFIX, 'searchParks', query],
    queryFn: () => provider.searchParks(query),
  });

  return {
    parks: data,
    isLoading,
    isFetching,
    error: error ?? null,
    refetch: () => {
      refetch();
    },
  };
}
