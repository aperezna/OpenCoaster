import { useQueries } from '@tanstack/react-query';
import { OPENCOASTER_KEY_PREFIX } from '../../data/cache/queryClient';
import type { ParkSummary } from '../../data/models/ParkSummary';
import type { ParkWeather } from '../../data/models/ParkWeather';
import type { ParkHours } from '../../data/models/ParkHours';
import type { Attraction } from '../../data/models/Attraction';
import type { ParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProvider';

export function useParkDetail(
  parkId: string,
  provider: ParkDiscoveryProvider,
): {
  park: ParkSummary | null | undefined;
  weather: ParkWeather | null | undefined;
  hours: ParkHours | null | undefined;
  attractions: Attraction[] | undefined;
  isLoading: boolean;
  isParkLoading: boolean;
  isWeatherLoading: boolean;
  isHoursLoading: boolean;
  isAttractionsLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  weatherError: Error | null;
  hoursError: Error | null;
  attractionsError: Error | null;
  refetchAll: () => void;
} {
  const results = useQueries({
    queries: [
      {
        queryKey: [...OPENCOASTER_KEY_PREFIX, 'getParkById', parkId],
        queryFn: () => provider.getParkById(parkId),
      },
      {
        queryKey: [...OPENCOASTER_KEY_PREFIX, 'getParkWeather', parkId],
        queryFn: () => provider.getParkWeather(parkId),
      },
      {
        queryKey: [...OPENCOASTER_KEY_PREFIX, 'getParkHours', parkId],
        queryFn: () => provider.getParkHours(parkId),
      },
      {
        queryKey: [...OPENCOASTER_KEY_PREFIX, 'getParkAttractions', parkId],
        queryFn: () => provider.getParkAttractions(parkId),
      },
    ],
  });

  const [parkQuery, weatherQuery, hoursQuery, attractionsQuery] = results;

  const isLoading = results.some((r) => r.isLoading);
  const isFetching = results.some((r) => r.isFetching);
  const parkError = parkQuery.error instanceof Error ? parkQuery.error : null;
  const weatherError = weatherQuery.error instanceof Error ? weatherQuery.error : null;
  const hoursError = hoursQuery.error instanceof Error ? hoursQuery.error : null;
  const attractionsError = attractionsQuery.error instanceof Error ? attractionsQuery.error : null;

  return {
    park: parkQuery.data ?? null,
    weather: weatherQuery.data ?? null,
    hours: hoursQuery.data ?? null,
    attractions: attractionsQuery.data,
    isLoading,
    isParkLoading: parkQuery.isLoading,
    isWeatherLoading: weatherQuery.isLoading,
    isHoursLoading: hoursQuery.isLoading,
    isAttractionsLoading: attractionsQuery.isLoading,
    isFetching,
    error: parkError,
    weatherError,
    hoursError,
    attractionsError,
    refetchAll: () => {
      results.forEach((r) => {
        r.refetch();
      });
    },
  };
}
