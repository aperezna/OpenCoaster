# Proposal: Map Markers, Offline Indicator, Share Park & Search History

## Intent

Four independent UX improvements: (1) visualize parks on the map instead of blank tiles; (2) surface stale/offline data state; (3) share park details externally; (4) persist recent search queries for repeat access.

## Scope

### In Scope

- Park markers on LeafletMap with marker clustering when overlapping
- Stale-data pill: "Datos de hace X min" when showing cached/offline content
- Share button on ParkDetailScreen via `Share.share()` — park name + maps URL
- Search history persisted to AsyncStorage (max 10), shown below search bar
- Clear history option

### Out of Scope

- Custom marker icons/theming (default Leaflet markers)
- Share deep links or app-specific content (plain text + URL only)
- Search autocomplete from history
- Multi-language pill text beyond Spanish

## Capabilities

### New Capabilities

- `map-markers`: Park location pins on LeafletMap with clustering at low zoom
- `stale-data-indicator`: Pill overlay showing cached data age in minutes

### Modified Capabilities

- `park-detail`: Add share button triggering `Share.share()` with park info + maps URL
- `search-park`: Persist last 10 queries to AsyncStorage and render recent searches below input

## Approach

1. **Markers**: Inject GeoJSON layer into LeafletMap WebView HTML. Use `Leaflet.markercluster` plugin for clustering. Bridge park coords via `postMessage`.
2. **Stale indicator**: Read `queryClient.getQueryState().dataUpdatedAt`, compute age vs `Date.now()`, render a small `<View>` pill on DiscoveryScreen.
3. **Share**: Share icon next to favorite star. Call `Share.share({ message: parkName + location + mapsUrl })`.
4. **Search history**: New `useSearchHistory()` hook wrapping AsyncStorage. `SearchBar` writes on submit; `DiscoveryScreen`/`ParksListScreen` read and render history list.

## Affected Areas

| Area                                             | Impact   | Description                            |
| ------------------------------------------------ | -------- | -------------------------------------- |
| `src/features/discovery/LeafletMap.tsx`          | Modified | Inject marker GeoJSON + cluster plugin |
| `src/features/discovery/DiscoveryScreen.tsx`     | Modified | Stale-data pill + search history list  |
| `src/features/discovery/SearchBar.tsx`           | Modified | Write query to history on submit       |
| `src/features/park-details/ParkDetailScreen.tsx` | Modified | Share button                           |
| `src/features/parks-list/ParksListScreen.tsx`    | Modified | Search history list below input        |
| `src/data/cache/queryClient.ts`                  | Modified | Export helper to read query state age  |
| `src/features/discovery/useSearchHistory.ts`     | New      | Search history hook                    |

## Risks

| Risk                              | Likelihood | Mitigation                                                                    |
| --------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Cluster perf on many markers      | Low        | `Leaflet.markercluster` with `maxClusterRadius`; falls back to single markers |
| Stale pill wrong after app resume | Low        | Recompute on `AppState` focus change                                          |
| AsyncStorage quota hit            | Low        | Cap at 10 entries, evict oldest                                               |

## Rollback Plan

Each feature is independent — remove GeoJSON injection, stale pill JSX, share button, or `useSearchHistory` hook. Rollback one or all via revert commit. No schema or data migration involved.

## Dependencies

- `leaflet.markercluster` (CDN bundle in WebView HTML)

## Success Criteria

- [ ] Parks render as markers on map; markers cluster when zoomed out
- [ ] Stale-data pill visible when showing cached data > 30s old
- [ ] Share opens native share sheet with park name + map URL
- [ ] Recent searches appear below search bar; tapping re-runs query
- [ ] Clear history empties the list
- [ ] All existing tests pass (`npx jest`)
