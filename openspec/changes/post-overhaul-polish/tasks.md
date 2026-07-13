# Tasks: Post-Overhaul Polish

## Review Workload Forecast

| Field                   | Value                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| Estimated changed lines | 450-650                                                                 |
| 400-line budget risk    | Medium                                                                  |
| Project review budget   | 800 lines (config.yaml)                                                 |
| Chained PRs recommended | Yes                                                                     |
| Suggested split         | PR 1: ErrorBoundary + Splash → PR 2: Search filters → PR 3: Act() fixes |
| Delivery strategy       | ask-on-risk                                                             |
| Chain strategy          | pending                                                                 |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal                         | Likely PR | Focused test command                                           | Runtime harness                                                    | Rollback boundary                                                  |
| ---- | ---------------------------- | --------- | -------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 1    | ErrorBoundary + SplashScreen | PR 1      | `npx jest --testPathPattern="ErrorBoundary"`                   | Launch app on simulator, verify no white flash on cold start       | Revert `ErrorBoundary.tsx`, revert SplashScreen lines in `App.tsx` |
| 2    | City/country search filters  | PR 2      | `npx jest --testPathPattern="useSearchParks\|ParksListScreen"` | Open ParksListScreen, type city + country, verify filtered results | Revert `ParksListScreen.tsx` + `ParkDiscoveryProvider.ts` changes  |
| 3    | Fix act() test warnings      | PR 3      | `npx jest 2>&1 \| grep -c "not wrapped in act"` (expected: 0)  | N/A — pure test infra change                                       | Revert test file changes                                           |

## Phase 1: Error Boundary & Splash (TDD)

- [x] 1.1 RED: Write test — ErrorBoundary catches thrown error, renders fallback, calls Sentry.captureException
- [x] 1.2 GREEN: Create `src/components/ErrorBoundary.tsx` — class component with componentDidCatch + fallback UI
- [x] 1.3 RED: Write test — SplashScreen.preventAutoHideAsync called before render, hideAsync after ready
- [x] 1.4 GREEN: Modify `App.tsx` — import SplashScreen + ErrorBoundary, preventAutoHideAsync, wrap AppInner, hideAsync in useEffect
- [x] 1.5 REFACTOR: Clean up boot sequence, verify no flash on cold start

## Phase 2: City/Country Search (TDD)

- [ ] 2.1 RED: Write test — searchParks filters by city + country combined with name
- [ ] 2.2 GREEN: Add `city`/`country` to `ParkSearchQuery` in `ParkDiscoveryProvider.ts`
- [ ] 2.3 GREEN: Add client-side city+country filter in `FixtureParkDiscoveryProvider.searchParks()`
- [ ] 2.4 GREEN: Add city/country `TextInput` fields + debounced state in `ParksListScreen.tsx`
- [ ] 2.5 REFACTOR: Extract filter helpers if repeated between city/country logic

## Phase 3: Fix Act() Warnings

- [ ] 3.1 Wrap `fireEvent.changeText` in `act()` in `ParksListScreen.test.tsx`
- [ ] 3.2 Remove async from sync `render()` calls in `SearchBar.test.tsx`
- [ ] 3.3 Fix timer + async patterns in `useSearchParks.test.tsx`
- [ ] 3.4 Verify: `npx jest` outputs zero "not wrapped in act()" warnings
