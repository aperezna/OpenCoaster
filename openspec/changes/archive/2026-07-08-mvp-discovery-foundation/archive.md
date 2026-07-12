# Archive Report: MVP Discovery Foundation

## Change Summary

**Change**: mvp-discovery-foundation
**Archive Date**: 2026-07-08
**Project**: OpenCoaster
**Store Mode**: hybrid (filesystem + Engram)
**Lifecycle Stage**: greenfield-mvp
**SDD Cycle**: Complete (all 8 phases, 20 tasks, 2 PRs)

The first SDD change for OpenCoaster — bootstrapped the Expo + React Native + TypeScript app with a discovery-first architecture including map, geolocation, manual park search, normalized park data model, provider interface, TanStack Query cache layer, and fixture-backed test suite.

---

## What Was Delivered — Scope vs Actual

| Scope Item                                             | Delivered | Notes                                                         |
| ------------------------------------------------------ | --------- | ------------------------------------------------------------- |
| Expo + RN + TS app bootstrap with navigation           | ✅        | App.tsx, RootNavigator (3 routes)                             |
| Map screen (OpenStreetMap)                             | ✅        | DiscoveryScreen with OSM UrlTile                              |
| Location permission handling                           | ✅        | LocationService interface + ExpoLocationService + test double |
| Manual park name + city search                         | ✅        | SearchBar + useSearchParks hook                               |
| Park summary list from search                          | ✅        | ParkResultList with FlatList + empty state                    |
| ParkDetailScreen placeholder                           | ✅        | Name, city, country, photo with fallback                      |
| ParkDiscoveryProvider returning normalized ParkSummary | ✅        | Interface + FixtureParkDiscoveryProvider                      |
| TanStack Query + persisted cache structure             | ✅        | QueryClient config + StorageAdapter types                     |
| Fixture-backed tests                                   | ✅        | 67 tests across 12 files                                      |

**Out of Scope** (deferred by design):

- Live provider API integration (ThemeParks.wiki, Queue-Times.com)
- Rides, lands, queue-time rendering
- Offline stale-data indicators
- Park identity reconciliation across providers
- Operating hours normalization

---

## Artifact Locations

### Filesystem Archive

| Artifact       | Path                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| Proposal       | `openspec/changes/archive/2026-07-08-mvp-discovery-foundation/proposal.md`      |
| Exploration    | `openspec/changes/archive/2026-07-08-mvp-discovery-foundation/exploration.md`   |
| Design         | `openspec/changes/archive/2026-07-08-mvp-discovery-foundation/design.md`        |
| Tasks          | `openspec/changes/archive/2026-07-08-mvp-discovery-foundation/tasks.md`         |
| Verify Report  | `openspec/changes/archive/2026-07-08-mvp-discovery-foundation/verify-report.md` |
| Archive Report | `openspec/changes/archive/2026-07-08-mvp-discovery-foundation/archive.md`       |

### Engram Observations

| Artifact       | Observation ID | Topic Key                                     |
| -------------- | -------------- | --------------------------------------------- |
| Apply Progress | #31            | `sdd/mvp-discovery-foundation/apply-progress` |
| Archive Report | (this save)    | `sdd/mvp-discovery-foundation/archive-report` |

### Main Specs (Source of Truth)

| Domain                  | Path                                             |
| ----------------------- | ------------------------------------------------ |
| app-bootstrap           | `openspec/specs/app-bootstrap/spec.md`           |
| cache-foundation        | `openspec/specs/cache-foundation/spec.md`        |
| map-discovery           | `openspec/specs/map-discovery/spec.md`           |
| park-discovery-provider | `openspec/specs/park-discovery-provider/spec.md` |
| search-park             | `openspec/specs/search-park/spec.md`             |

---

## Key Metrics

| Metric                   | Value                                               |
| ------------------------ | --------------------------------------------------- |
| Tasks total              | 20                                                  |
| Tasks complete           | 20                                                  |
| Test suites              | 12                                                  |
| Tests passing            | 67 / 67                                             |
| Test layers              | Unit (25) + Integration (42)                        |
| Line coverage            | 87.02% overall (~96% excluding ExpoLocationService) |
| Branch coverage          | 83.78%                                              |
| Spec compliance          | 25/28 COMPLIANT, 2 PARTIAL, 1 UNTESTED              |
| PRs                      | 2 (PR1: Foundation, PR2: App Shell + Features)      |
| Files created            | 26 source + test files + 6 mock/setup files         |
| TDD compliance           | 5/5 checks passed                                   |
| Critical/blocking issues | 0                                                   |

---

## Implementation Phases

| Phase | Description                      | Tasks   | Status      |
| ----- | -------------------------------- | ------- | ----------- |
| P1    | Types & Config Foundation        | 1.1–1.3 | ✅ Complete |
| P2    | Cache Layer                      | 2.1–2.3 | ✅ Complete |
| P3    | Data Layer — Provider & Fixtures | 3.1–3.3 | ✅ Complete |
| P4    | Location Service                 | 4.1–4.3 | ✅ Complete |
| P5    | Navigation Shell                 | 5.1–5.2 | ✅ Complete |
| P6    | App Bootstrap                    | 6.1–6.2 | ✅ Complete |
| P7    | Discovery Feature                | 7.1–7.5 | ✅ Complete |
| P8    | Park Detail Feature              | 8.1–8.2 | ✅ Complete |

---

## Delta Spec Sync

No delta specs exist in the change folder (`specs/` subdirectory absent) — the sdd-spec phase wrote main specs directly to `openspec/specs/`. No merge was required. The following main specs are the source of truth:

- `openspec/specs/app-bootstrap/spec.md`
- `openspec/specs/cache-foundation/spec.md`
- `openspec/specs/map-discovery/spec.md`
- `openspec/specs/park-discovery-provider/spec.md`
- `openspec/specs/search-park/spec.md`

---

## Outstanding Issues (Warnings, Non-Blocking)

All sourced from the verification report — none are CRITICAL:

1. **Map marker deferred** — `map-discovery R2/S3`: Marker on granted location permission consciously deferred (code comment says "marker rendering deferred to future"). The geolocation permission flow works, but no marker is rendered on success. Planned for follow-up.

2. **Unknown route fallback untested** — `app-bootstrap R2/S4`: FallbackView exists in code (validRoutes check → FallbackView) but has no test coverage.

3. **City filter uncovered line** — `DiscoveryScreen.tsx:54`: The city filtering handler (`handleCityChange` → `setSearchQuery`) is not covered by tests. Only name filtering is exercised.

4. **Apply-progress test count discrepancy** — Apply progress claims 7 tests for `useSearchParks` but the actual file has 4 tests. Minor data discrepancy.

5. **Implementation detail coupling in test** — `SearchBar.test.tsx:71-72` tests `nameInput.props.value` directly rather than using `getByDisplayValue`.

---

## Recommendations for Follow-Up Changes

### Next (Immediate)

1. **Map marker implementation** — Add marker rendering on geolocation grant. Small delta: add `Marker` to DiscoveryScreen, test `onPress` navigation to park detail. Covers the one UNTESTED scenario.

2. **Live provider integration** — Replace `FixtureParkDiscoveryProvider` with real `ThemeParksWikiProvider` and/or `QueueTimesProvider`. Impact: provider implementation swap, API key management, error/loading states.

### Future (Medium Term)

3. **Park detail expansion** — Add rides, lands, queue-time rendering, operating hours. Requires provider integration first.

4. **Offline capability** — Wire `StorageAdapter` to AsyncStorage, implement `persistQueryClient`, add offline stale-data indicators.

5. **Park identity reconciliation** — Multi-provider normalization: match parks by name/coordinates across ThemeParks.wiki and Queue-Times.com. Unsolved design problem.

6. **Linter + type checker** — Add ESLint, Prettier, and `tsc --noEmit` to CI pipeline. Currently missing from toolchain.

---

## Risks

| Risk                                | Status       | Notes                                                       |
| ----------------------------------- | ------------ | ----------------------------------------------------------- |
| react-native-maps Expo setup        | ✅ Mitigated | Pin known-compatible SDK, OSM tile URL configured           |
| Geolocation untestable on Windows   | ✅ Mitigated | LocationService interface + FakeLocationService test double |
| Provider model rework for real APIs | ✅ Managed   | Interface designed from spec, provider shape isolated       |
| No linter/type checker in CI        | ⚠️ Open      | Tooling gap — should be addressed before next large change  |
| ExpoLocationService low coverage    | ⚠️ Expected  | Native module cannot run in Jest; acceptable gap            |
| Apply-progress data discrepancy     | ⚠️ Minor     | 7 vs 4 test count — no functional impact                    |

---

## Archive Verification

- [x] Main specs updated correctly (no delta specs to merge — main specs written directly)
- [x] Change folder moved to archive: `openspec/changes/archive/2026-07-08-mvp-discovery-foundation/`
- [x] Archive contains all artifacts: proposal, exploration, design, tasks, verify-report
- [x] All 20 tasks marked complete (`[x]`) in archived tasks.md — no stale unchecked tasks
- [x] Active changes directory no longer has this change
- [x] Archive report persisted to both filesystem and Engram (`sdd/mvp-discovery-foundation/archive-report`)
- [x] No CRITICAL issues in verify-report — archive proceeds cleanly
