import { useCallback } from 'react';
import type { StorageAdapter } from '../../data/cache/storageAdapter';
import { AsyncStorageAdapter } from '../../data/cache/asyncStorageAdapter';
import {
  createSharedJsonStorageStore,
  useSharedJsonStorageState,
} from '../../data/cache/sharedJsonStorageStore';
import type { Itinerary, ItineraryItem } from '../../data/models/Itinerary';
import { ITINERARIES_KEY } from '../../data/models/Itinerary';

const defaultAdapter = new AsyncStorageAdapter();
const getItinerariesStore = createSharedJsonStorageStore<Itinerary[]>(ITINERARIES_KEY, []);

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

export function useItineraries(adapter: StorageAdapter = defaultAdapter): UseItinerariesReturn {
  const store = getItinerariesStore(adapter);
  const { value: itineraries, isLoading } = useSharedJsonStorageState(store);

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
      void store.updateValue((prev) => [...prev, newItinerary]).catch(() => {});
    },
    [store],
  );

  const deleteItinerary = useCallback(
    (id: string) => {
      void store
        .updateValue((prev) => prev.filter((itinerary) => itinerary.id !== id))
        .catch(() => {});
    },
    [store],
  );

  const updateDate = useCallback(
    (id: string, date?: string) => {
      void store
        .updateValue((prev) =>
          prev.map((itinerary) =>
            itinerary.id === id
              ? { ...itinerary, date, updatedAt: new Date().toISOString() }
              : itinerary,
          ),
        )
        .catch(() => {});
    },
    [store],
  );

  const addAttraction = useCallback(
    (itineraryId: string, attraction: { id: string; name: string }) => {
      void store
        .updateValue((prev) =>
          prev.map((itinerary) => {
            if (itinerary.id !== itineraryId) {
              return itinerary;
            }

            const newItem: ItineraryItem = {
              id: generateId(),
              attractionId: attraction.id,
              name: attraction.name,
              order: itinerary.items.length,
            };

            return {
              ...itinerary,
              items: [...itinerary.items, newItem],
              updatedAt: new Date().toISOString(),
            };
          }),
        )
        .catch(() => {});
    },
    [store],
  );

  const removeAttraction = useCallback(
    (itineraryId: string, attractionId: string) => {
      void store
        .updateValue((prev) =>
          prev.map((itinerary) => {
            if (itinerary.id !== itineraryId) {
              return itinerary;
            }

            const filtered = itinerary.items
              .filter((item) => item.attractionId !== attractionId)
              .map((item, index) => ({ ...item, order: index }));

            return {
              ...itinerary,
              items: filtered,
              updatedAt: new Date().toISOString(),
            };
          }),
        )
        .catch(() => {});
    },
    [store],
  );

  const moveItemUp = useCallback(
    (itineraryId: string, attractionId: string) => {
      void store
        .updateValue((prev) =>
          prev.map((itinerary) => {
            if (itinerary.id !== itineraryId) {
              return itinerary;
            }

            const items = [...itinerary.items];
            const index = items.findIndex((item) => item.attractionId === attractionId);
            if (index <= 0) {
              return itinerary;
            }

            const swappedOrder = items[index].order;
            items[index] = { ...items[index], order: items[index - 1].order };
            items[index - 1] = { ...items[index - 1], order: swappedOrder };
            items.sort((left, right) => left.order - right.order);

            return {
              ...itinerary,
              items,
              updatedAt: new Date().toISOString(),
            };
          }),
        )
        .catch(() => {});
    },
    [store],
  );

  const moveItemDown = useCallback(
    (itineraryId: string, attractionId: string) => {
      void store
        .updateValue((prev) =>
          prev.map((itinerary) => {
            if (itinerary.id !== itineraryId) {
              return itinerary;
            }

            const items = [...itinerary.items];
            const index = items.findIndex((item) => item.attractionId === attractionId);
            if (index < 0 || index >= items.length - 1) {
              return itinerary;
            }

            const swappedOrder = items[index].order;
            items[index] = { ...items[index], order: items[index + 1].order };
            items[index + 1] = { ...items[index + 1], order: swappedOrder };
            items.sort((left, right) => left.order - right.order);

            return {
              ...itinerary,
              items,
              updatedAt: new Date().toISOString(),
            };
          }),
        )
        .catch(() => {});
    },
    [store],
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
