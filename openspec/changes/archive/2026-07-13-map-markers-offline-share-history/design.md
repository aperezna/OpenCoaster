# Design: Map Markers, Offline Indicator, Share Park & Search History

## Technical Approach

Four independent features leveraging existing patterns. **Map markers are already implemented** in `LeafletMap.tsx` (GeoJSON injection via `postMessage` + `leaflet.markercluster` CDN — zero new work). Remaining three features each follow established project conventions: `useFavorites`/`useItineraries` for storage hooks, `Linking` for external URLs, TanStack Query state for cache age.

## Architecture Decisions

| Decision               | Options                                                             | Tradeoffs                                                     | Chosen                                                                                   |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Search history storage | New hook vs. inline in screen                                       | Reuse trumps isolation                                        | `useSearchHistory` hook — mirrors `useFavorites` pattern (StorageAdapter + AsyncStorage) |
| Stale age source       | `queryClient.getQueryState()` vs. manual timestamp in cache         | Query state is authoritative, auto-reset on fetch             | `useQueryClient().getQueryState()` with `AppState` listener                              |
| Share URL              | Google Maps URL (existing `handleDirections` pattern) vs. deep link | Existing pattern works, no new deps                           | Reuse `maps.google.com/maps/dir/` URL from `ParkDetailScreen`                            |
| Pill position          | Absolute overlay vs. inline                                         | Overlay avoids layout shift, consistent with proximity toggle | Absolute-positioned `<View>` pill below proximity toggle                                 |

## Data Flow

```
[Stale Pill]
  DiscoveryScreen
    ├── useQueryClient().getQueryState(['opencoaster','searchParks',query])
    │     └── dataUpdatedAt → Date.now() diff → minutes
    └── AppState 'change' listener → recompute on foreground

[Share]
  ParkDetailScreen → Share.share({ message: name + mapsUrl })

[Search History]
  SearchBar submit → useSearchHistory.add(query)
    └── AsyncStorage key: 'opencoaster:search-history'
  DiscoveryScreen/ParksListScreen → useSearchHistory()
    └── render recent list, tap → populate + execute search
```

## File Changes

| File                                                            | Action | Description                                           |
| --------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| `src/features/discovery/useSearchHistory.ts`                    | Create | AsyncStorage-backed hook for last 10 queries          |
| `src/features/discovery/__tests__/useSearchHistory.test.tsx`    | Create | Unit tests following `useFavorites.test.tsx` pattern  |
| `src/features/discovery/DiscoveryScreen.tsx`                    | Modify | Add stale-data pill + search history list below input |
| `src/features/discovery/SearchBar.tsx`                          | Modify | Accept `onSubmit` callback to write history           |
| `src/features/park-details/ParkDetailScreen.tsx`                | Modify | Add share button next to favorite toggle              |
| `src/features/park-details/__tests__/ParkDetailScreen.test.tsx` | Modify | Add share scenario test                               |
| `src/features/parks-list/ParksListScreen.tsx`                   | Modify | Add search history list below search inputs           |
| `src/features/parks-list/__tests__/ParksListScreen.test.tsx`    | Modify | Add history visibility tests                          |
| `src/features/discovery/__tests__/DiscoveryScreen.test.tsx`     | Modify | Add stale-pill + history-list test cases              |

**No changes needed**: `LeafletMap.tsx` (already renders clustered markers), `queryClient.ts`, `ParkDiscoveryProvider.ts`.

## Interfaces / Contracts

```typescript
// useSearchHistory.ts — follows useFavorites pattern
export function useSearchHistory(adapter?: StorageAdapter): {
  queries: string[];
  add: (query: string) => void;
  clear: () => void;
  isLoading: boolean;
};

// SearchBarProps — added onSubmit
interface SearchBarProps {
  name: string;
  onNameChange: (name: string) => void;
  onSubmit?: () => void; // NEW
}
```

## Testing Strategy

| Layer       | What to Test          | Approach                                                                        |
| ----------- | --------------------- | ------------------------------------------------------------------------------- |
| Unit        | `useSearchHistory`    | In-memory adapter + SyncPromise (exactly `useFavorites.test.tsx` pattern)       |
| Integration | Stale pill visibility | `DiscoveryScreen` with test QueryClient — assert pill rendered when cache stale |
| Integration | Recent search list    | `DiscoveryScreen` — submit search, assert history list visible, tap re-runs     |
| Unit        | Share content         | `ParkDetailScreen` — mock `Share.share()`, assert called with correct message   |

## Threat Matrix

`N/A` — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Each feature is additive with zero schema change. Feature flags not needed — trivial revert per file if issues arise.

## Open Questions

None.
