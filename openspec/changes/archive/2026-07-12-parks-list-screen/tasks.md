# Tasks: Parks List Screen

## Review Workload Forecast

| Field                   | Value       |
| ----------------------- | ----------- |
| Estimated changed lines | ~200-300    |
| 400-line budget risk    | Low         |
| Chained PRs recommended | No          |
| Suggested split         | Single PR   |
| Delivery strategy       | ask-on-risk |
| Chain strategy          | pending     |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                 | Likely PR | Notes                                         |
| ---- | ------------------------------------ | --------- | --------------------------------------------- |
| 1    | Parks list screen + stack navigation | PR 1      | Single PR — well under 800-line review budget |

## Phase 1: Foundation

- [x] 1.1 Create `src/navigation/ParquesStackNavigator.tsx` with `ParquesStackParamList` types (`ParksList` optional parkId, `ParkDetail` required parkId) and tab→stack param bridge via `useRoute<RouteProp<RootTabParamList, 'Parques'>>`
- [x] 1.2 Update `src/features/park-details/ParkDetailScreen.tsx` to accept `RouteProp<ParquesStackParamList, 'ParkDetail'>`; keep `DEFAULT_PARK_ID` runtime fallback; back button auto-provided by native-stack header

## Phase 2: Core Implementation

- [x] 2.1 Create `src/features/parks-list/ParksListScreen.tsx` with `useSearchParks({})` on mount, `SearchBar` + 300ms debounced `useSearchParks({name})`, `ParkResultList` render, and auto-nav guard (`useRef` flag + clear tab params via `navigation.setParams({})`)
- [x] 2.2 Update `src/navigation/RootNavigator.tsx` to render `<ParquesStackNavigator />` in Parques tab instead of `<ParkDetailScreen />`

## Phase 3: Testing

- [x] 3.1 Create `src/navigation/__tests__/ParquesStackNavigator.test.tsx` — list→detail nav, deep-link bypass with parkId, unknown parkId fallback
- [x] 3.2 Create `src/features/parks-list/__tests__/ParksListScreen.test.tsx` — render all parks, search filters by name, empty state, tap navigates to detail, auto-nav guard stability, tab-switch guard persists, back after deep link then tap different park
- [x] 3.3 Update `src/navigation/__tests__/RootNavigator.test.tsx` — Parques tab test checks for stack mount testID instead of `park-detail-screen`
