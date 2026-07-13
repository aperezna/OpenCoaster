# Tasks: Map Markers, Offline Indicator, Share Park & Search History

## Review Workload Forecast

| Field                   | Value                       |
| ----------------------- | --------------------------- |
| Estimated changed lines | ~380-430                    |
| 800-line budget risk    | Low (project budget is 800) |
| Chained PRs recommended | No                          |
| Suggested split         | Single PR                   |
| Delivery strategy       | ask-on-risk                 |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

**Note**: Map markers already implemented — zero tasks. Three independent features below.

## Phase 1: RED — Write Failing Tests First

- [x] 1.1 Write `__tests__/useSearchHistory.test.tsx` — load, save, evict oldest, dedup move-to-top, corrupt data
- [x] 1.2 Add stale-pill tests to `DiscoveryScreen.test.tsx` — fresh data hidden, cached >30s shown, recompute on AppState resume
- [x] 1.3 Add share test to `ParkDetailScreen.test.tsx` — mock `Share.share()`, verify message content, missing location
- [x] 1.4 Add history-list tests to `DiscoveryScreen.test.tsx` + `ParksListScreen.test.tsx` — show on focus, tap re-runs, clear history

## Phase 2: GREEN — Implement Features

- [x] 2.1 Create `useSearchHistory.ts` — StorageAdapter + AsyncStorage, key `opencoaster:search-history`, max 10, evict oldest, dupes move to top
- [x] 2.2 Add stale-data pill to `DiscoveryScreen.tsx` — read `queryClient.getQueryState()`, render absolute pill when age > 30s, listen AppState
- [x] 2.3 Add share button to `ParkDetailScreen.tsx` — `Share.share()` with park name + city/country + Google Maps URL, omit location when null
- [x] 2.4 Add `onSubmit` to `SearchBar.tsx`, wire history list + clear action into `DiscoveryScreen.tsx` and `ParksListScreen.tsx`

## Phase 3: REFACTOR — Verify & Polish

- [x] 3.1 Remove unused imports, console.logs, dead branches in all changed files
- [x] 3.2 Run full suite: `npx jest --passWithNoTests` — all green

## Test Commands

| Scenario         | Command                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| All tests        | `npx jest --passWithNoTests`                                             |
| Search history   | `npx jest src/features/discovery/__tests__/useSearchHistory.test.tsx`    |
| Discovery screen | `npx jest src/features/discovery/__tests__/DiscoveryScreen.test.tsx`     |
| Park detail      | `npx jest src/features/park-details/__tests__/ParkDetailScreen.test.tsx` |
| Parks list       | `npx jest src/features/parks-list/__tests__/ParksListScreen.test.tsx`    |
| Type check       | `npx tsc --noEmit`                                                       |
| Lint             | `npx eslint .`                                                           |

## Rollback Boundaries

Each feature has an independent revert path — no shared dependencies between stale pill, share button, and search history. Revert individual commits without affecting other features.
