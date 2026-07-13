# Proposal: Visit Planner / Itinerary

## Intent

Users need a way to plan park visits: pick a date, browse attractions, and build a day itinerary. Currently the app shows attractions per park but offers no way to save, organize, or revisit a plan. This closes the gap between "browsing" and "going."

## Scope

### In Scope

- Itinerary CRUD (create, read, update, delete multiple itineraries)
- Date selection per itinerary via date picker
- "Add to itinerary" inline on attractions + "Plan visit" CTA on ParkDetail
- Reorder attractions via move up/down buttons
- View saved itineraries on Profile screen
- Live wait times for planned attractions (re-fetch via TanStack Query)

### Out of Scope

- Drag-and-drop reorder (move up/down for MVP)
- Push notifications for wait time changes
- Route optimization between attractions
- Sharing itineraries
- Multi-day itineraries (single-day per itinerary for MVP)

## Capabilities

### New Capabilities

- `visit-planner`: Itinerary CRUD, date selection, attraction scheduling, and persistence via `StorageAdapter`.

### Modified Capabilities

- `park-detail`: Add "Add to itinerary" button on attraction cards + "Plan visit" CTA in ParkDetail header.
- `profile-screen`: Add "My Itineraries" section listing saved itineraries with navigation to detail.

## Approach

Mirror `useFavorites` pattern: `useItineraries` hook backed by `StorageAdapter` with `useState + useEffect`. New `Itinerary` + `ItineraryItem` models under `src/data/models/`. New VisitPlannerScreen and ItineraryDetailScreen in `src/features/visit-planner/`. Wire into Parques stack navigator. Fetch live wait times by re-running `useParkDetail` query for the relevant park. No provider changes needed.

## Affected Areas

| Area                                            | Impact   | Description                                  |
| ----------------------------------------------- | -------- | -------------------------------------------- |
| `src/features/visit-planner/`                   | New      | Hook + screens for itinerary CRUD            |
| `src/data/models/Itinerary.ts`                  | New      | Itinerary + ItineraryItem models             |
| `src/features/park-detail/ParkDetailScreen.tsx` | Modified | Add "Plan visit" CTA + attraction add button |
| `src/features/profile/ProfileScreen.tsx`        | Modified | "My Itineraries" section                     |
| `src/navigation/ParquesStackNavigator.tsx`      | Modified | New VisitPlanner screens route               |
| `package.json`                                  | Modified | Add `@react-native-community/datetimepicker` |

## Risks

| Risk                                  | Likelihood | Mitigation                                      |
| ------------------------------------- | ---------- | ----------------------------------------------- |
| Date picker requires dev build        | High       | Confirm Expo SDK 52 compatibility; note in docs |
| Park hours API returns today only     | High       | Show "hours unavailable" for future dates       |
| Wait times are snapshots on itinerary | Med        | Document that times refresh on screen focus     |

## Rollback Plan

Revert `ParquesStackNavigator.tsx` to previous route config, delete `src/features/visit-planner/`, revert `package.json`. Remove itinerary sections from ParkDetailScreen and ProfileScreen. All changes are additive — no data migration.

## Dependencies

- `@react-native-community/datetimepicker` (may require dev build)

## Success Criteria

- [ ] User can create an itinerary, pick a date, add/remove/reorder attractions
- [ ] Itineraries persist across app restarts
- [ ] Profile screen shows saved itineraries; tapping opens detail
- [ ] "Add to itinerary" button visible on ParkDetail attractions
