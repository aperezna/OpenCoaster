import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFavorites } from '../useFavorites';
import type { StorageAdapter } from '../../../data/cache/storageAdapter';
import { SyncPromise } from '../../../../test-utils/syncThenable';

// ---------------------------------------------------------------------------
// In-memory adapter for testing
// ---------------------------------------------------------------------------

function createInMemoryAdapter(initialData?: string): StorageAdapter {
  const store: Record<string, string | null> = {};
  if (initialData !== undefined) {
    store['opencoaster:favorites'] = initialData;
  }

  return {
    getItem: (key: string) =>
      SyncPromise.resolve(store[key] ?? null) as unknown as Promise<string | null>,
    setItem: (key: string, value: string) => {
      store[key] = value;
      return SyncPromise.resolve(undefined) as unknown as Promise<void>;
    },
    removeItem: (key: string) => {
      delete store[key];
      return SyncPromise.resolve(undefined) as unknown as Promise<void>;
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFavorites', () => {
  describe('load on mount', () => {
    it('should return empty favorites when no data is stored', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useFavorites(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.favorites).toEqual([]);
    });

    it('should load stored favorites on mount', async () => {
      const stored = JSON.stringify([
        { parkId: 'p1', parkName: 'Park One', addedAt: '2025-01-01T00:00:00Z' },
        { parkId: 'p2', parkName: 'Park Two', addedAt: '2025-01-02T00:00:00Z' },
        { parkId: 'p3', parkName: 'Park Three', addedAt: '2025-01-03T00:00:00Z' },
      ]);
      const adapter = createInMemoryAdapter(stored);
      const { result } = renderHook(() => useFavorites(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.favorites).toHaveLength(3);
      expect(result.current.favorites[0].parkId).toBe('p1');
      expect(result.current.favorites[1].parkId).toBe('p2');
      expect(result.current.favorites[2].parkId).toBe('p3');
    });

    it('should handle corrupt stored data gracefully', async () => {
      const adapter = createInMemoryAdapter('not-valid-json');
      const { result } = renderHook(() => useFavorites(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.favorites).toEqual([]);
    });
  });

  describe('isFavorite', () => {
    it('should return false for a park not in favorites', () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useFavorites(adapter));

      expect(result.current.isFavorite('nonexistent')).toBe(false);
    });

    it('should return true for a park that is in favorites', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useFavorites(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFavorite('p1', 'Park One');
      });

      expect(result.current.isFavorite('p1')).toBe(true);
    });
  });

  describe('toggleFavorite', () => {
    it('should add a park when toggling on', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useFavorites(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFavorite('p1', 'Park One');
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].parkId).toBe('p1');
      expect(result.current.favorites[0].parkName).toBe('Park One');
      expect(result.current.favorites[0].addedAt).toBeDefined();
    });

    it('should remove a park when toggling off', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useFavorites(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFavorite('p1', 'Park One');
      });
      expect(result.current.favorites).toHaveLength(1);

      act(() => {
        result.current.toggleFavorite('p1', 'Park One');
      });

      expect(result.current.favorites).toHaveLength(0);
    });

    it('should persist the updated list after toggling on', async () => {
      let savedValue = '';
      const adapter: StorageAdapter = {
        getItem: async () => null,
        setItem: async (key, value) => {
          savedValue = value;
        },
        removeItem: async () => {},
      };

      const { result } = renderHook(() => useFavorites(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFavorite('p1', 'Park One');
      });

      const parsed = JSON.parse(savedValue);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].parkId).toBe('p1');
      expect(parsed[0].parkName).toBe('Park One');
    });

    it('should persist the updated list after toggling off', async () => {
      let savedValue = '';
      const adapter: StorageAdapter = {
        getItem: async () =>
          JSON.stringify([{ parkId: 'p1', parkName: 'Park One', addedAt: '2025-01-01T00:00:00Z' }]),
        setItem: async (key, value) => {
          savedValue = value;
        },
        removeItem: async () => {},
      };

      const { result } = renderHook(() => useFavorites(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFavorite('p1', 'Park One');
      });

      const parsed = JSON.parse(savedValue);
      expect(parsed).toHaveLength(0);
    });

    it('should handle rapid toggles without race conditions', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useFavorites(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFavorite('p1', 'Park One');
        result.current.toggleFavorite('p2', 'Park Two');
        result.current.toggleFavorite('p1', 'Park One'); // remove p1
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].parkId).toBe('p2');
    });
  });
});
