import { useCallback } from 'react';
import type { StorageAdapter } from '../../data/cache/storageAdapter';
import { AsyncStorageAdapter } from '../../data/cache/asyncStorageAdapter';
import {
  createSharedJsonStorageStore,
  useSharedJsonStorageState,
} from '../../data/cache/sharedJsonStorageStore';
import type { FavoritePark } from '../../data/models/FavoritePark';

const FAVORITES_KEY = 'opencoaster:favorites';
const defaultAdapter = new AsyncStorageAdapter();
const getFavoritesStore = createSharedJsonStorageStore<FavoritePark[]>(FAVORITES_KEY, []);

interface UseFavoritesReturn {
  favorites: FavoritePark[];
  isFavorite: (parkId: string) => boolean;
  toggleFavorite: (parkId: string, parkName: string) => void;
  clearFavorites: () => Promise<void>;
  isLoading: boolean;
}

export function useFavorites(adapter: StorageAdapter = defaultAdapter): UseFavoritesReturn {
  const store = getFavoritesStore(adapter);
  const { value: favorites, isLoading } = useSharedJsonStorageState(store);

  const isFavorite = useCallback(
    (parkId: string): boolean => {
      return favorites.some((f) => f.parkId === parkId);
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    (parkId: string, parkName: string) => {
      void store
        .updateValue((prev) => {
          const existing = prev.find((favorite) => favorite.parkId === parkId);

          if (existing) {
            return prev.filter((favorite) => favorite.parkId !== parkId);
          }

          return [...prev, { parkId, parkName, addedAt: new Date().toISOString() }];
        })
        .catch(() => {});
    },
    [store],
  );

  const clearFavorites = useCallback(async () => {
    await store.setValue([]);
  }, [store]);

  return { favorites, isFavorite, toggleFavorite, clearFavorites, isLoading };
}
