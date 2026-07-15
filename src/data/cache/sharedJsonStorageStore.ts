import { useEffect, useSyncExternalStore } from 'react';

export interface JsonStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

interface SharedSnapshot<T> {
  value: T;
  isLoading: boolean;
}

interface SharedJsonStorageStore<T> {
  getSnapshot: () => SharedSnapshot<T>;
  subscribe: (listener: () => void) => () => void;
  ensureLoaded: () => Promise<void>;
  setValue: (next: T) => Promise<void>;
  updateValue: (updater: (current: T) => T) => Promise<T>;
}

function createStore<T>(
  storage: JsonStorageLike,
  key: string,
  initialValue: T,
): SharedJsonStorageStore<T> {
  let snapshot: SharedSnapshot<T> = { value: initialValue, isLoading: true };
  let loadPromise: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const parseValue = (raw: string | null): T => {
    if (!raw) {
      return initialValue;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  };

  const writeValue = async (next: T): Promise<void> => {
    snapshot = { value: next, isLoading: false };
    emit();
    await storage.setItem(key, JSON.stringify(next));
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);

        if (listeners.size === 0) {
          snapshot = { value: initialValue, isLoading: true };
          loadPromise = null;
        }
      };
    },
    ensureLoaded: async () => {
      if (!snapshot.isLoading) {
        return;
      }

      if (!loadPromise) {
        loadPromise = storage
          .getItem(key)
          .then((raw) => {
            snapshot = { value: parseValue(raw), isLoading: false };
          })
          .catch(() => {
            snapshot = { value: initialValue, isLoading: false };
          })
          .then(() => {
            loadPromise = null;
            emit();
          });
      }

      await loadPromise;
    },
    setValue: writeValue,
    updateValue: async (updater) => {
      const next = updater(snapshot.value);
      await writeValue(next);
      return next;
    },
  };
}

export function createSharedJsonStorageStore<T>(key: string, initialValue: T) {
  const stores = new WeakMap<JsonStorageLike, SharedJsonStorageStore<T>>();

  return (storage: JsonStorageLike): SharedJsonStorageStore<T> => {
    const existing = stores.get(storage);
    if (existing) {
      return existing;
    }

    const store = createStore(storage, key, initialValue);
    stores.set(storage, store);
    return store;
  };
}

export function useSharedJsonStorageState<T>(store: SharedJsonStorageStore<T>): SharedSnapshot<T> {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  useEffect(() => {
    void store.ensureLoaded();
  }, [store]);

  return snapshot;
}
