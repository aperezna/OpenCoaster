import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const OPENCOASTER_KEY_PREFIX = ['opencoaster'] as const;

const PERSIST_CACHE_KEY = 'opencoaster:query-cache';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours before garbage collection
        retry: 1,
      },
    },
  });
}

export function createPersister() {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: PERSIST_CACHE_KEY,
  });
}
