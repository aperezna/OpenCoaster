import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSearchHistory } from '../useSearchHistory';
import type { StorageAdapter } from '../../../data/cache/storageAdapter';
import { SyncPromise } from '../../../../test-utils/syncThenable';

// ---------------------------------------------------------------------------
// In-memory adapter for testing (mirrors useFavorites.test.tsx pattern)
// ---------------------------------------------------------------------------

const SEARCH_HISTORY_KEY = 'opencoaster:search-history';
const MAX_HISTORY = 10;

function createInMemoryAdapter(initialData?: string): StorageAdapter {
  const store: Record<string, string | null> = {};
  if (initialData !== undefined) {
    store[SEARCH_HISTORY_KEY] = initialData;
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

describe('useSearchHistory', () => {
  describe('load on mount', () => {
    it('should return empty queries when no data is stored', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.queries).toEqual([]);
    });

    it('should load stored queries on mount', async () => {
      const stored = JSON.stringify(['Magic Kingdom', 'Efteling', 'Disneyland Park']);
      const adapter = createInMemoryAdapter(stored);
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.queries).toHaveLength(3);
      expect(result.current.queries[0]).toBe('Magic Kingdom');
      expect(result.current.queries[1]).toBe('Efteling');
      expect(result.current.queries[2]).toBe('Disneyland Park');
    });

    it('should handle corrupt stored data gracefully', async () => {
      const adapter = createInMemoryAdapter('not-valid-json');
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.queries).toEqual([]);
    });

    it('should handle non-array stored data gracefully', async () => {
      const adapter = createInMemoryAdapter('"just a string"');
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.queries).toEqual([]);
    });
  });

  describe('add query', () => {
    it('should add a query to the history', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.add('Magic Kingdom');
      });

      expect(result.current.queries).toHaveLength(1);
      expect(result.current.queries[0]).toBe('Magic Kingdom');
    });

    it('should add query to the top of the list', async () => {
      const stored = JSON.stringify(['Efteling']);
      const adapter = createInMemoryAdapter(stored);
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.add('Magic Kingdom');
      });

      expect(result.current.queries).toHaveLength(2);
      expect(result.current.queries[0]).toBe('Magic Kingdom');
      expect(result.current.queries[1]).toBe('Efteling');
    });

    it('should evict oldest when history exceeds max', async () => {
      const initial = Array.from({ length: MAX_HISTORY }, (_, i) => `Query ${i + 1}`);
      const adapter = createInMemoryAdapter(JSON.stringify(initial));
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.queries).toHaveLength(MAX_HISTORY);

      act(() => {
        result.current.add('New Query');
      });

      expect(result.current.queries).toHaveLength(MAX_HISTORY);
      // New query should be at the top
      expect(result.current.queries[0]).toBe('New Query');
      // Oldest (Query 10) should be evicted
      expect(result.current.queries).not.toContain('Query 10');
      // Query 9 should now be at the end
      expect(result.current.queries[MAX_HISTORY - 1]).toBe('Query 9');
    });

    it('should move duplicate query to the top without creating duplicate', async () => {
      const stored = JSON.stringify(['Magic Kingdom', 'Efteling', 'Disneyland Park']);
      const adapter = createInMemoryAdapter(stored);
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.add('Efteling');
      });

      expect(result.current.queries).toHaveLength(3);
      expect(result.current.queries[0]).toBe('Efteling');
      expect(result.current.queries[1]).toBe('Magic Kingdom');
      expect(result.current.queries[2]).toBe('Disneyland Park');
    });

    it('should persist the updated list to storage', async () => {
      let savedValue = '';
      const adapter: StorageAdapter = {
        getItem: async () => null,
        setItem: async (_key, value) => {
          savedValue = value;
        },
        removeItem: async () => {},
      };

      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.add('Efteling');
      });

      const parsed = JSON.parse(savedValue);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toBe('Efteling');
    });
  });

  describe('clear history', () => {
    it('should clear all queries', async () => {
      const stored = JSON.stringify(['Magic Kingdom', 'Efteling']);
      const adapter = createInMemoryAdapter(stored);
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.queries).toEqual([]);
    });

    it('should persist empty array after clear', async () => {
      let savedValue = '';
      const adapter: StorageAdapter = {
        getItem: async () => JSON.stringify(['Magic Kingdom']),
        setItem: async (_key, value) => {
          savedValue = value;
        },
        removeItem: async () => {},
      };

      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.clear();
      });

      const parsed = JSON.parse(savedValue);
      expect(parsed).toEqual([]);
    });

    it('should do nothing when history is already empty', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useSearchHistory(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.queries).toEqual([]);
    });
  });
});
