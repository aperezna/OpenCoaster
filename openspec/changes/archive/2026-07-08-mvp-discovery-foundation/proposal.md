# Proposal: MVP Discovery Foundation

## Intent

Bootstrap OpenCoaster Expo app with discovery-first foundation: map, geolocation, manual search, normalized park data model. First slice establishing architecture for all follow-up features.

## Scope

### In Scope

- Expo + React Native + TypeScript app bootstrap with navigation
- Map screen (OpenStreetMap), location permission, manual park name + city search
- Park summary list from search/geolocation
- `ParkDetailScreen` placeholder (name, location, optional photo header)
- `ParkDiscoveryProvider` returning normalized `ParkSummary` models
- TanStack Query + persisted cache structure (storage adapter, TTL config)
- Fixture-backed tests for geolocation and search flows

### Out of Scope

- Live provider API integration (ThemeParks.wiki, Queue-Times.com)
- Rides, lands, queue-time rendering
- Offline stale-data indicators
- Park identity reconciliation across providers
- Operating hours normalization

## Capabilities

### New Capabilities

- `app-bootstrap`: Expo shell, navigation, TanStack Query client setup
- `map-discovery`: Map with OpenStreetMap, geolocation permission handling, current-location marker
- `park-discovery-provider`: Provider interface + normalized `ParkSummary` model + fixture data
- `search-park`: Manual search by park name + city, result list rendering
- `cache-foundation`: TanStack Query config, persisted cache type definitions, storage adapter

### Modified Capabilities

None — greenfield project, no existing specs.

## Approach

Bootstrap Expo with TypeScript. Wire react-native-maps + geolocation as optional input. Implement `ParkDiscoveryProvider` returning typed `ParkSummary[]` from fixtures. Search supports name + city input. Cap with placeholder detail screen. All data behind provider boundary for later API swap. Cache via TanStack Query with `staleTime` config + persisted storage adapter types.

## Affected Areas

| Area                             | Impact | Description                         |
| -------------------------------- | ------ | ----------------------------------- |
| `app/`                           | New    | Expo app root, navigation, screens  |
| `app/src/features/discovery/`    | New    | MapScreen, SearchBar, ParkList      |
| `app/src/features/park-details/` | New    | ParkDetailScreen placeholder        |
| `app/src/data/providers/`        | New    | ParkDiscoveryProvider + fixtures    |
| `app/src/data/models/`           | New    | ParkSummary model                   |
| `app/src/data/cache/`            | New    | TanStack Query config, storage, TTL |
| `__tests__/`                     | New    | Geolocation + search flow tests     |

## Risks

| Risk                                    | Likelihood | Mitigation                              |
| --------------------------------------- | ---------- | --------------------------------------- |
| react-native-maps Expo setup issues     | Med        | Pin known-compatible SDK, document      |
| Geolocation untestable on Windows shell | High       | Abstract behind interface, test doubles |
| Provider model rework for real APIs     | Low        | Design from spec, not provider shape    |

## Rollback Plan

Delete `app/` and `__tests__/` additions. Revert any `config.yaml` changes. No data migration — greenfield.

## Dependencies

- Expo SDK + react-native-maps
- @tanstack/react-query
- No external API keys (fixture data only)

## Success Criteria

- [ ] `npx expo start` launches on Android emulator showing map
- [ ] Location denied routes to manual search without crash
- [ ] Search by name + city returns fixture results
- [ ] Selecting park opens detail placeholder
- [ ] All Jest tests pass: geolocation success, denied, search
- [ ] TanStack Query cache configured with staleTime + storage types
