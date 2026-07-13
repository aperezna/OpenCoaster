import { useState, useEffect, useCallback } from 'react';
import type { StorageAdapter } from '../../data/cache/storageAdapter';
import { AsyncStorageAdapter } from '../../data/cache/asyncStorageAdapter';
import type { Itinerary, ItineraryItem } from '../../data/models/Itinerary';
import { ITINERARIES_KEY } from '../../data/models/Itinerary';

interface UseItinerariesReturn {
  itineraries: Itinerary[];
  isLoading: boolean;
  createItinerary: (parkId: string, parkName: string, date?: string) => void;
  deleteItinerary: (id: string) => void;
  updateDate: (id: string, date?: string) => void;
  addAttraction: (itineraryId: string, attraction: { id: string; name: string }) => void;
  removeAttraction: (itineraryId: string, attractionId: string) => void;
  moveItemUp: (itineraryId: string, attractionId: string) => void;
  moveItemDown: (itineraryId: string, attractionId: string) => void;
  isAttractionInItinerary: (attractionId: string) => boolean;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useItineraries(
  adapter: StorageAdapter = new AsyncStorageAdapter(),
): UseItinerariesReturn {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    adapter
      .getItem(ITINERARIES_KEY)
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (data) {
          try {
            setItineraries(JSON.parse(data) as Itinerary[]);
          } catch {
            setItineraries([]);
          }
        } else {
          setItineraries([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setItineraries([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adapter]);

  const persist = useCallback(
    (next: Itinerary[]) => {
      adapter.setItem(ITINERARIES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    },
    [adapter],
  );

  const createItinerary = useCallback(
    (parkId: string, parkName: string, date?: string) => {
      const now = new Date().toISOString();
      const newItinerary: Itinerary = {
        id: generateId(),
        parkId,
        parkName,
        date,
        items: [],
        createdAt: now,
        updatedAt: now,
      };
      setItineraries((prev) => persist([...prev, newItinerary]));
    },
    [persist],
  );

  const deleteItinerary = useCallback(
    (id: string) => {
      setItineraries((prev) => persist(prev.filter((i) => i.id !== id)));
    },
    [persist],
  );

  const updateDate = useCallback(
    (id: string, date?: string) => {
      setItineraries((prev) =>
        persist(
          prev.map((i) => (i.id === id ? { ...i, date, updatedAt: new Date().toISOString() } : i)),
        ),
      );
    },
    [persist],
  );

  const addAttraction = useCallback(
    (itineraryId: string, attraction: { id: string; name: string }) => {
      setItineraries((prev) =>
        persist(
          prev.map((it) => {
            if (it.id !== itineraryId) {
              return it;
            }
            const newItem: ItineraryItem = {
              id: generateId(),
              attractionId: attraction.id,
              name: attraction.name,
              order: it.items.length,
            };
            return {
              ...it,
              items: [...it.items, newItem],
              updatedAt: new Date().toISOString(),
            };
          }),
        ),
      );
    },
    [persist],
  );

  const removeAttraction = useCallback(
    (itineraryId: string, attractionId: string) => {
      setItineraries((prev) =>
        persist(
          prev.map((it) => {
            if (it.id !== itineraryId) {
              return it;
            }
            const filtered = it.items
              .filter((item) => item.attractionId !== attractionId)
              .map((item, idx) => ({ ...item, order: idx }));
            return {
              ...it,
              items: filtered,
              updatedAt: new Date().toISOString(),
            };
          }),
        ),
      );
    },
    [persist],
  );

  const moveItemUp = useCallback(
    (itineraryId: string, attractionId: string) => {
      setItineraries((prev) =>
        persist(
          prev.map((it) => {
            if (it.id !== itineraryId) {
              return it;
            }
            const items = [...it.items];
            const idx = items.findIndex((item) => item.attractionId === attractionId);
            if (idx <= 0) {
              return it;
            }
            // Swap order values
            const temp = items[idx].order;
            items[idx] = { ...items[idx], order: items[idx - 1].order };
            items[idx - 1] = { ...items[idx - 1], order: temp };
            // Re-sort by order so the array matches the new positions
            items.sort((a, b) => a.order - b.order);
            return {
              ...it,
              items,
              updatedAt: new Date().toISOString(),
            };
          }),
        ),
      );
    },
    [persist],
  );

  const moveItemDown = useCallback(
    (itineraryId: string, attractionId: string) => {
      setItineraries((prev) =>
        persist(
          prev.map((it) => {
            if (it.id !== itineraryId) {
              return it;
            }
            const items = [...it.items];
            const idx = items.findIndex((item) => item.attractionId === attractionId);
            if (idx < 0 || idx >= items.length - 1) {
              return it;
            }
            // Swap order values
            const temp = items[idx].order;
            items[idx] = { ...items[idx], order: items[idx + 1].order };
            items[idx + 1] = { ...items[idx + 1], order: temp };
            // Re-sort by order so the array matches the new positions
            items.sort((a, b) => a.order - b.order);
            return {
              ...it,
              items,
              updatedAt: new Date().toISOString(),
            };
          }),
        ),
      );
    },
    [persist],
  );

  const isAttractionInItinerary = useCallback(
    (attractionId: string): boolean => {
      return itineraries.some((it) => it.items.some((item) => item.attractionId === attractionId));
    },
    [itineraries],
  );

  return {
    itineraries,
    isLoading,
    createItinerary,
    deleteItinerary,
    updateDate,
    addAttraction,
    removeAttraction,
    moveItemUp,
    moveItemDown,
    isAttractionInItinerary,
  };
}
