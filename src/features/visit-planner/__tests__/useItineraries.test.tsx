import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useItineraries } from '../useItineraries';
import type { StorageAdapter } from '../../../data/cache/storageAdapter';
import { SyncPromise } from '../../../../test-utils/syncThenable';

// ---------------------------------------------------------------------------
// In-memory adapter for testing
// ---------------------------------------------------------------------------

function createInMemoryAdapter(initialData?: string): StorageAdapter {
  const store: Record<string, string | null> = {};
  if (initialData !== undefined) {
    store['opencoaster:itineraries'] = initialData;
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
// Seed data helpers
// ---------------------------------------------------------------------------

function createSeededItineraries(): string {
  return JSON.stringify([
    {
      id: 'itin-1',
      parkId: 'pk-1',
      parkName: 'Park One',
      date: '2026-07-15',
      items: [
        { id: 'item-1', attractionId: 'attr-1', name: 'Coaster A', order: 0 },
        { id: 'item-2', attractionId: 'attr-2', name: 'Coaster B', order: 1 },
        { id: 'item-3', attractionId: 'attr-3', name: 'Coaster C', order: 2 },
      ],
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    },
    {
      id: 'itin-2',
      parkId: 'pk-2',
      parkName: 'Park Two',
      items: [],
      createdAt: '2026-07-02T00:00:00Z',
      updatedAt: '2026-07-02T00:00:00Z',
    },
  ]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useItineraries', () => {
  describe('load on mount', () => {
    it('should return empty itineraries when no data is stored', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.itineraries).toEqual([]);
    });

    it('should load stored itineraries on mount', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.itineraries).toHaveLength(2);
      expect(result.current.itineraries[0].id).toBe('itin-1');
      expect(result.current.itineraries[1].id).toBe('itin-2');
    });

    it('should handle corrupt stored data gracefully', async () => {
      const adapter = createInMemoryAdapter('not-valid-json');
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.itineraries).toEqual([]);
    });
  });

  describe('createItinerary', () => {
    it('should create a new itinerary with specified parkId and parkName', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.createItinerary('pk-1', 'Park One');
      });

      expect(result.current.itineraries).toHaveLength(1);
      expect(result.current.itineraries[0].parkId).toBe('pk-1');
      expect(result.current.itineraries[0].parkName).toBe('Park One');
      expect(result.current.itineraries[0].items).toEqual([]);
      expect(result.current.itineraries[0].id).toBeDefined();
      expect(result.current.itineraries[0].createdAt).toBeDefined();
      expect(result.current.itineraries[0].updatedAt).toBeDefined();
    });

    it('should create a new itinerary with an optional date', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.createItinerary('pk-1', 'Park One', '2026-07-15');
      });

      expect(result.current.itineraries[0].date).toBe('2026-07-15');
    });

    it('should create itinerary with date undefined when not provided', async () => {
      const adapter = createInMemoryAdapter();
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.createItinerary('pk-1', 'Park One');
      });

      expect(result.current.itineraries[0].date).toBeUndefined();
    });

    it('should persist the updated list after creation', async () => {
      let savedValue = '';
      const adapter: StorageAdapter = {
        getItem: async () => null,
        setItem: async (_key, value) => {
          savedValue = value;
        },
        removeItem: async () => {},
      };

      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.createItinerary('pk-1', 'Park One');
      });

      const parsed = JSON.parse(savedValue);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].parkId).toBe('pk-1');
    });
  });

  describe('deleteItinerary', () => {
    it('should remove an itinerary by id', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteItinerary('itin-1');
      });

      expect(result.current.itineraries).toHaveLength(1);
      expect(result.current.itineraries[0].id).toBe('itin-2');
    });

    it('should persist after deletion', async () => {
      let savedValue = '';
      const adapter: StorageAdapter = {
        getItem: async () => createSeededItineraries(),
        setItem: async (_key, value) => {
          savedValue = value;
        },
        removeItem: async () => {},
      };

      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteItinerary('itin-1');
      });

      const parsed = JSON.parse(savedValue);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('itin-2');
    });

    it('should do nothing when id does not exist', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteItinerary('nonexistent');
      });

      expect(result.current.itineraries).toHaveLength(2);
    });
  });

  describe('updateDate', () => {
    it('should update the date of an itinerary', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateDate('itin-2', '2026-08-01');
      });

      expect(result.current.itineraries.find((i) => i.id === 'itin-2')?.date).toBe('2026-08-01');
    });

    it('should clear the date when undefined is passed', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateDate('itin-1', undefined);
      });

      expect(result.current.itineraries.find((i) => i.id === 'itin-1')?.date).toBeUndefined();
    });

    it('should update updatedAt timestamp', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalUpdatedAt = result.current.itineraries.find(
        (i) => i.id === 'itin-2',
      )?.updatedAt;

      act(() => {
        result.current.updateDate('itin-2', '2026-08-01');
      });

      const newUpdatedAt = result.current.itineraries.find((i) => i.id === 'itin-2')?.updatedAt;
      expect(newUpdatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('addAttraction', () => {
    it('should add an attraction to an itinerary', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAttraction('itin-2', { id: 'attr-4', name: 'Coaster D' });
      });

      const itin = result.current.itineraries.find((i) => i.id === 'itin-2');
      expect(itin?.items).toHaveLength(1);
      expect(itin?.items[0].attractionId).toBe('attr-4');
      expect(itin?.items[0].name).toBe('Coaster D');
      expect(itin?.items[0].order).toBe(0);
    });

    it('should assign incrementing order values', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAttraction('itin-2', { id: 'attr-4', name: 'Coaster D' });
        result.current.addAttraction('itin-2', { id: 'attr-5', name: 'Coaster E' });
      });

      const itin = result.current.itineraries.find((i) => i.id === 'itin-2');
      expect(itin?.items).toHaveLength(2);
      expect(itin?.items[0].order).toBe(0);
      expect(itin?.items[1].order).toBe(1);
    });

    it('should persist after adding attraction', async () => {
      let savedValue = '';
      const adapter: StorageAdapter = {
        getItem: async () => createSeededItineraries(),
        setItem: async (_key, value) => {
          savedValue = value;
        },
        removeItem: async () => {},
      };

      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAttraction('itin-2', { id: 'attr-4', name: 'Coaster D' });
      });

      const parsed = JSON.parse(savedValue);
      const itin2 = parsed.find((i: { id: string }) => i.id === 'itin-2');
      expect(itin2.items).toHaveLength(1);
      expect(itin2.items[0].attractionId).toBe('attr-4');
    });
  });

  describe('removeAttraction', () => {
    it('should remove an attraction from an itinerary', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.removeAttraction('itin-1', 'attr-1');
      });

      const itin = result.current.itineraries.find((i) => i.id === 'itin-1');
      expect(itin?.items).toHaveLength(2);
      expect(itin?.items.find((item) => item.attractionId === 'attr-1')).toBeUndefined();
    });

    it('should re-order remaining items after removal', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.removeAttraction('itin-1', 'attr-1');
      });

      const itin = result.current.itineraries.find((i) => i.id === 'itin-1');
      expect(itin?.items[0].order).toBe(0);
      expect(itin?.items[1].order).toBe(1);
    });

    it('should do nothing when attraction does not exist', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.removeAttraction('itin-1', 'nonexistent');
      });

      const itin = result.current.itineraries.find((i) => i.id === 'itin-1');
      expect(itin?.items).toHaveLength(3);
    });
  });

  describe('moveItemUp', () => {
    it('should move an item up (decrease order index)', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.moveItemUp('itin-1', 'attr-3');
      });

      const itin = result.current.itineraries.find((i) => i.id === 'itin-1');
      const item3 = itin?.items.find((item) => item.attractionId === 'attr-3');
      const item2 = itin?.items.find((item) => item.attractionId === 'attr-2');
      expect(item3?.order).toBe(1);
      expect(item2?.order).toBe(2);
    });

    it('should not move the first item up', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.moveItemUp('itin-1', 'attr-1');
      });

      const itin = result.current.itineraries.find((i) => i.id === 'itin-1');
      expect(itin?.items.find((item) => item.attractionId === 'attr-1')?.order).toBe(0);
    });
  });

  describe('moveItemDown', () => {
    it('should move an item down (increase order index)', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.moveItemDown('itin-1', 'attr-1');
      });

      const itin = result.current.itineraries.find((i) => i.id === 'itin-1');
      const item1 = itin?.items.find((item) => item.attractionId === 'attr-1');
      const item2 = itin?.items.find((item) => item.attractionId === 'attr-2');
      expect(item1?.order).toBe(1);
      expect(item2?.order).toBe(0);
    });

    it('should not move the last item down', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.moveItemDown('itin-1', 'attr-3');
      });

      const itin = result.current.itineraries.find((i) => i.id === 'itin-1');
      expect(itin?.items.find((item) => item.attractionId === 'attr-3')?.order).toBe(2);
    });
  });

  describe('isAttractionInItinerary', () => {
    it('should return true when attraction is in any itinerary', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAttractionInItinerary('attr-1')).toBe(true);
    });

    it('should return false when attraction is not in any itinerary', async () => {
      const adapter = createInMemoryAdapter(createSeededItineraries());
      const { result } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAttractionInItinerary('nonexistent')).toBe(false);
    });
  });

  describe('persistence (storage round-trip)', () => {
    it('should survive a full CRUD cycle across reloads', async () => {
      const adapter = createInMemoryAdapter();

      // First session: create itinerary and add attractions
      const { result: result1 } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      act(() => {
        result1.current.createItinerary('pk-1', 'Park One', '2026-07-15');
      });

      const itinId = result1.current.itineraries[0].id;

      act(() => {
        result1.current.addAttraction(itinId, { id: 'attr-1', name: 'Coaster A' });
        result1.current.addAttraction(itinId, { id: 'attr-2', name: 'Coaster B' });
      });

      expect(result1.current.itineraries[0].items).toHaveLength(2);

      // Second session: reload from same adapter
      const { result: result2 } = renderHook(() => useItineraries(adapter));

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result2.current.itineraries).toHaveLength(1);
      expect(result2.current.itineraries[0].parkId).toBe('pk-1');
      expect(result2.current.itineraries[0].items).toHaveLength(2);
      expect(result2.current.itineraries[0].items[0].attractionId).toBe('attr-1');
      expect(result2.current.itineraries[0].items[1].attractionId).toBe('attr-2');
    });
  });
});
