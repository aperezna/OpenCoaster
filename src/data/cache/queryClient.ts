import { QueryClient } from '@tanstack/react-query';

export const OPENCOASTER_KEY_PREFIX = ['opencoaster'] as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}
