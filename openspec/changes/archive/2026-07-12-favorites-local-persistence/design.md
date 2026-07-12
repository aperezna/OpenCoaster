# Design: Favorites Local Persistence

## Technical Approach

Self-contained `useFavorites` hook with injectable `StorageAdapter` (defaults to `AsyncStorageAdapter`). Cross-tab navigation uses **nested screen targeting** (`{ screen: 'ParkDetail', params }`) instead of the ParksListScreen auto-nav bridge, which had a `hasAutoNavigated` ref that would lock after first use (BLOCKER FIX). Storage key `opencoaster:favorites` stores JSON array of `FavoritePark[]`.

## Architecture Decisions

| Option                  | Choice                          | Rationale                                                                     |
| ----------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| Hook vs Context         | **Hook**                        | No provider nesting; single feature scope                                     |
| React Query vs useState | **useState**                    | Small local list; no caching/invalidation/background sync needed              |
| Storage key             | **`opencoaster:favorites`**     | Follows `OPENCOASTER_KEY_PREFIX` pattern                                      |
| FavoritePark model      | `parkId`, `parkName`, `addedAt` | Storing name avoids fetching park details just to render list                 |
| `toggleFavorite` setter | **Functional useState**         | Eliminates race condition on rapid toggles (FIX #4)                           |
| Cross-tab nav           | **Nested screen targeting**     | Avoids `hasAutoNavigated` lock; standard React Navigation v7 pattern (FIX #1) |
| Adapter injection       | **Optional param on hook**      | Defaults to `new AsyncStorageAdapter()`; tests pass in-memory mock (FIX #2)   |
| Adapter location        | **`src/data/cache/`**           | Consistent with `StorageAdapter` interface location (FIX #5)                  |
| Error handling          | **try/catch in load + toggle**  | Logs errors, stale state is acceptable (FIX #6)                               |

## Data Flow

```
Mount → loadFavorites()
  → try { getItem('opencoaster:favorites') } catch { log }
  → Parse JSON → useState<FavoritePark[]>
  → Return { favorites, isFavorite, toggleFavorite, isLoading }

toggleFavorite(parkId, parkName):
  → setFavorites(prev => {
      exists = prev.some(f => f.parkId === parkId)
      updated = exists ? prev.filter(...) : [...prev, { parkId, parkName, addedAt }]
      try { adapter.setItem(key, JSON.stringify(updated)) } catch { log }
      return updated
    })

Cross-tab navigation (both DiscoveryScreen + ProfileScreen):
  navigation.navigate('Parques', { screen: 'ParkDetail', params: { parkId } })
```

## File Changes

| File                                                     | Action | Description                                                                                      |
| -------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| `src/data/models/FavoritePark.ts`                        | Create | `FavoritePark` interface                                                                         |
| `src/data/cache/asyncStorageAdapter.ts`                  | Create | `StorageAdapter` impl wrapping `@react-native-async-storage/async-storage`                       |
| `src/features/favorites/useFavorites.ts`                 | Create | Hook: `useFavorites(adapter?)` with functional setState, try/catch error handling (FIX #4, #6)   |
| `src/features/favorites/__tests__/useFavorites.test.tsx` | Create | Unit tests with in-memory mock adapter                                                           |
| `src/data/cache/__tests__/asyncStorageAdapter.test.ts`   | Create | Adapter unit tests with mocked AsyncStorage                                                      |
| `src/navigation/RootNavigator.tsx`                       | Modify | Change `Parques` param type to `NavigatorScreenParams<ParquesStackParamList>`                    |
| `src/navigation/ParquesStackNavigator.tsx`               | Modify | Remove `useRoute` tab-param bridge + `initialParams` — no longer needed with nested navigation   |
| `src/features/parks-list/ParksListScreen.tsx`            | Modify | **Remove** auto-nav useEffect + `hasAutoNavigated` ref (FIX #1)                                  |
| `src/features/discovery/DiscoveryScreen.tsx`             | Modify | Change `navigate('Parques', { parkId })` → nested `{ screen: 'ParkDetail', params: { parkId } }` |
| `src/features/park-details/ParkDetailScreen.tsx`         | Modify | Add star toggle button; call `useFavorites()`                                                    |
| `src/features/profile/ProfileScreen.tsx`                 | Modify | Add favorites FlatList; empty state "No favorites yet" (FIX #3); nested nav on tap               |
| `package.json`                                           | Modify | Add `@react-native-async-storage/async-storage` dependency                                       |

## Interfaces / Contracts

```typescript
interface FavoritePark {
  parkId: string;
  parkName: string;
  addedAt: string; // ISO 8601
}

// useFavorites — adapter defaults to AsyncStorageAdapter
function useFavorites(adapter?: StorageAdapter): {
  favorites: FavoritePark[];
  isFavorite: (parkId: string) => boolean;
  toggleFavorite: (parkId: string, parkName: string) => void;
  isLoading: boolean;
};

// RootTabParamList change
import { NavigatorScreenParams } from '@react-navigation/native';
type RootTabParamList = {
  Mapa: undefined;
  Parques: NavigatorScreenParams<ParquesStackParamList> | undefined;
  Usuario: undefined;
};
```

## Testing Strategy

| Layer | What                  | Approach                                                                                                                                                                                           |
| ----- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit  | `AsyncStorageAdapter` | Mock AsyncStorage module; test getItem (found/missing), setItem, removeItem                                                                                                                        |
| Unit  | `useFavorites` hook   | TestComponent wrapper with in-memory `StorageAdapter` mock (FIX #2); test load-on-mount (empty/populated), toggle on (adds+persists), toggle off (removes+persists), rapid toggles, error recovery |
| Unit  | `ProfileScreen`       | Render with mock `useFavorites`; test favorites list, empty state, tap navigates                                                                                                                   |
| Unit  | `ParkDetailScreen`    | Render with mock route + mock `useFavorites`; test star toggle renders and responds                                                                                                                |

## Migration / Rollout

No migration required. Key does not exist for existing users — hook returns `[]` gracefully. Nested navigation pattern is backward compatible with existing `{ parkId }` params via the `ParquesStackNavigator` initialParams bridge (safety net).

## Open Questions

- None
