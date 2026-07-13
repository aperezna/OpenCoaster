import { useState, useEffect, useCallback } from 'react';
import type { StorageAdapter } from '../../data/cache/storageAdapter';
import { AsyncStorageAdapter } from '../../data/cache/asyncStorageAdapter';

const SEARCH_HISTORY_KEY = 'opencoaster:search-history';
const MAX_HISTORY = 10;

interface UseSearchHistoryReturn {
  queries: string[];
  add: (query: string) => void;
  clear: () => void;
  isLoading: boolean;
}

export function useSearchHistory(
  adapter: StorageAdapter = new AsyncStorageAdapter(),
): UseSearchHistoryReturn {
  const [queries, setQueries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    adapter
      .getItem(SEARCH_HISTORY_KEY)
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              setQueries(parsed as string[]);
            } else {
              setQueries([]);
            }
          } catch {
            setQueries([]);
          }
        } else {
          setQueries([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setQueries([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adapter]);

  const add = useCallback(
    (query: string) => {
      setQueries((prev) => {
        // Remove duplicate if exists
        const filtered = prev.filter((q) => q !== query);
        // Add new query to the top
        const next = [query, ...filtered];
        // Evict oldest if over limit
        const trimmed = next.slice(0, MAX_HISTORY);
        // Persist asynchronously
        adapter.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmed)).catch(() => {});
        return trimmed;
      });
    },
    [adapter],
  );

  const clear = useCallback(() => {
    setQueries([]);
    adapter.setItem(SEARCH_HISTORY_KEY, JSON.stringify([])).catch(() => {});
  }, [adapter]);

  return { queries, add, clear, isLoading };
}
