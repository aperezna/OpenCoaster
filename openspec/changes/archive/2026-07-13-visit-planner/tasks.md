# Tasks: Visit Planner / Itinerary

## Review Workload Forecast

| Field                   | Value                     |
| ----------------------- | ------------------------- |
| Estimated changed lines | ~900–1200                 |
| 400-line budget risk    | High                      |
| Chained PRs recommended | Yes                       |
| Suggested split         | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy       | ask-on-risk               |
| Chain strategy          | pending                   |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                                    | Likely PR | Focused test command                                                | Runtime harness                                 | Rollback boundary                             |
| ---- | ----------------------------------------------------------------------- | --------- | ------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------- |
| 1    | Models + useItineraries hook + unit tests                               | PR 1      | `npx jest src/features/visit-planner/__tests__/useItineraries.test` | N/A — pure hook logic                           | Revert Itinerary.ts, useItineraries.ts, test  |
| 2    | VisitPlannerScreen + ItineraryDetailScreen + nav routes + tests         | PR 2      | `npx jest src/features/visit-planner/`                              | Render screens with mocked useItineraries       | Revert screens, route additions, screen tests |
| 3    | ParkDetail CTA + AttractionList add-to-itinerary + picker modal + tests | PR 3      | `npx jest src/features/park-details/`                               | Render ParkDetailScreen with mocked deps        | Revert CTA, button, modal, park-detail tests  |
| 4    | ProfileScreen "My Itineraries" + empty state + package.json             | PR 4      | `npx jest src/features/profile/`                                    | Render ProfileScreen with mocked useItineraries | Revert ProfileScreen changes, package.json    |

## Phase 1: Foundation (TDD)

- [x] 1.1 RED: Write failing tests for useItineraries (CRUD, reorder, persistence, isAttractionInItinerary)
- [x] 1.2 GREEN: Create `src/data/models/Itinerary.ts` (Itinerary + ItineraryItem interfaces, storage key)
- [x] 1.3 GREEN: Create `src/features/visit-planner/useItineraries.ts` (mirror useFavorites pattern)
- [x] 1.4 REFACTOR: Clean up hook internals, verify all tests pass

## Phase 2: Screens + Navigation (TDD)

- [x] 2.1 RED: Write failing tests for VisitPlannerScreen + ItineraryDetailScreen
- [x] 2.2 GREEN: Create `VisitPlannerScreen.tsx` (create itinerary, date picker, park selector)
- [x] 2.3 GREEN: Create `ItineraryDetailScreen.tsx` (view, delete, reorder, wait time refetch via useFocusEffect)
- [x] 2.4 GREEN: Add VisitPlanner + ItineraryDetail routes to ParquesStackNavigator + param types
- [x] 2.5 REFACTOR: Polish navigation types, verify screen tests pass

## Phase 3: Park Detail Integration (TDD)

- [x] 3.1 RED: Write failing tests for Plan Visit CTA + add-to-itinerary flow
- [x] 3.2 GREEN: Create `ItineraryPickerModal.tsx` (modal itinerary selector)
- [x] 3.3 GREEN: Add "Plan visit" CTA to ParkDetailScreen header, navigate with park pre-selected
- [x] 3.4 GREEN: Add "Add to itinerary" button + "Added" indicator to AttractionList
- [x] 3.5 REFACTOR: Verify all park-detail integration tests pass

## Phase 4: Profile Integration (TDD)

- [x] 4.1 RED: Write failing tests for ProfileScreen itineraries section (list + empty state)
- [x] 4.2 GREEN: Add "My Itineraries" section to ProfileScreen below favorites
- [x] 4.3 GREEN: Install `@react-native-community/datetimepicker` (package.json)
- [x] 4.4 REFACTOR: Final cleanup, verify full test suite
