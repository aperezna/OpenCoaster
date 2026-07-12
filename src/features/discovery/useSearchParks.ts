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
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: [...OPENCOASTER_KEY_PREFIX, 'searchParks', query],
    queryFn: () => provider.searchParks(query),
  });

  return { parks: data, isLoading, error: error ?? null };
}
