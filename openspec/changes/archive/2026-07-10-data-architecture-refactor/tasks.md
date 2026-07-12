# Tasks: Data Architecture Refactor

## Review Workload Forecast

| Field                   | Value                                   |
| ----------------------- | --------------------------------------- |
| Estimated changed lines | ~150-200                                |
| 400-line budget risk    | Low                                     |
| Chained PRs recommended | No                                      |
| Suggested split         | Single PR                               |
| Delivery strategy       | ask-on-risk (user requested ask-always) |
| Chain strategy          | pending                                 |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Design Amendment Acknowledged

The proposal listed 4 individual hooks (`useParkById`, `useParkWeather`, `useParkHours`, `useParkAttractions`). The design uses a single composite `useParkDetail` hook with `useQueries`. This is APPROVED — parallel `useQueries` mirrors the current `Promise.all` pattern and matches the screen's single responsibility.

### Suggested Work Units

| Unit | Goal                          | Likely PR | Notes                                                                                |
| ---- | ----------------------------- | --------- | ------------------------------------------------------------------------------------ |
| 1    | Full refactor in one delivery | PR 1      | Single PR — under 400 lines, changes are tightly coupled (context → screens → tests) |

## Phase 1: Foundation

- [x] 1.1 Create `src/data/providers/ParkDiscoveryProviderContext.tsx` — context `ParkDiscoveryContext`, provider `ParkDiscoveryContextProvider`, and `useParkDiscoveryProvider()` hook (throws if used outside provider)
- [x] 1.2 Create `src/features/park-details/useParkDetail.ts` — composite hook using `useQueries` for parallel fetch of park/weather/hours/attractions, returns `{ park, weather, hours, attractions, isLoading, isParkLoading, error }`

## Phase 2: Core Implementation

- [x] 2.1 Update `App.tsx` — import and wrap children with `<ParkDiscoveryContextProvider>` inside `QueryClientProvider`, above `NavigationContainer`
- [x] 2.2 Refactor `ParkDetailScreen.tsx` — remove `parkDiscoveryProvider` prop and `new ThemeParksWikiProvider()`, use `useParkDiscoveryProvider()` from context, replace `useState`/`useEffect` with `useParkDetail(parkId, provider)`

## Phase 3: Integration

- [x] 3.1 Refactor `DiscoveryScreen.tsx` — remove `defaultParkProvider` and `parkDiscoveryProvider` prop, call `useParkDiscoveryProvider()` and pass to `useSearchParks`
- [x] 3.2 Refactor `ProfileScreen.tsx` — remove `defaultProvider` and `parkDiscoveryProvider` prop, call `useParkDiscoveryProvider()` and use for `getUserProfile()`

## Phase 4: Tests

- [x] 4.1 Update `RootNavigator.test.tsx` — add `ParkDiscoveryContextProvider` wrapper alongside existing `QueryClientProvider` in `renderNavigator` and inline render (gatekeeper finding #2)
- [x] 4.2 Update `ParkDetailScreen.test.tsx` — wrap render with BOTH `QueryClientProvider` and `ParkDiscoveryContextProvider<FixtureParkDiscoveryProvider>`; remove `parkDiscoveryProvider` prop from component (gatekeeper finding #3)
- [x] 4.3 Update `DiscoveryScreen.test.tsx` — replace `parkDiscoveryProvider` prop with `<ParkDiscoveryContextProvider provider={fixture}>` wrapper in `renderScreen`
- [x] 4.4 Run full test suite (`npx jest`), fix any remaining test failures from missing context wrappers
