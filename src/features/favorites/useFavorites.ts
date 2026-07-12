import { useState, useEffect, useCallback } from 'react';
import type { StorageAdapter } from '../../data/cache/storageAdapter';
import { AsyncStorageAdapter } from '../../data/cache/asyncStorageAdapter';
import type { FavoritePark } from '../../data/models/FavoritePark';

const FAVORITES_KEY = 'opencoaster:favorites';

interface UseFavoritesReturn {
  favorites: FavoritePark[];
  isFavorite: (parkId: string) => boolean;
  toggleFavorite: (parkId: string, parkName: string) => void;
  clearFavorites: () => Promise<void>;
  isLoading: boolean;
}

export function useFavorites(
  adapter: StorageAdapter = new AsyncStorageAdapter(),
): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoritePark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    adapter
      .getItem(FAVORITES_KEY)
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (data) {
          try {
            setFavorites(JSON.parse(data) as FavoritePark[]);
          } catch {
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFavorites([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adapter]);

  const isFavorite = useCallback(
    (parkId: string): boolean => {
      return favorites.some((f) => f.parkId === parkId);
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    (parkId: string, parkName: string) => {
      setFavorites((prev) => {
        const existing = prev.find((f) => f.parkId === parkId);
        let next: FavoritePark[];
        if (existing) {
          next = prev.filter((f) => f.parkId !== parkId);
        } else {
          next = [...prev, { parkId, parkName, addedAt: new Date().toISOString() }];
        }
        // Persist asynchronously — fire and forget with catch
        adapter.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [adapter],
  );

  const clearFavorites = useCallback(async () => {
    setFavorites([]);
    await adapter.setItem(FAVORITES_KEY, JSON.stringify([]));
  }, [adapter]);

  return { favorites, isFavorite, toggleFavorite, clearFavorites, isLoading };
}
