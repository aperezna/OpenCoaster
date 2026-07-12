# Tasks: Loading Skeletons

## Review Workload Forecast

| Field                   | Value       |
| ----------------------- | ----------- |
| Estimated changed lines | ~100–150    |
| 400-line budget risk    | Low         |
| Chained PRs recommended | No          |
| Suggested split         | Single PR   |
| Delivery strategy       | ask-on-risk |
| Chain strategy          | pending     |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                             | Likely PR | Notes                     |
| ---- | ------------------------------------------------ | --------- | ------------------------- |
| 1    | Skeleton components + screen integration + tests | PR 1      | Single PR; ~100–150 lines |

## Phase 1: Skeleton Components

- [x] 1.1 Create `src/components/Skeleton.tsx` with `SkeletonBlock` (pulse anim, configurable w/h/borderRadius) + `ParkDetailSkeleton` + `ParksListSkeleton` + `ProfileSkeleton`
- [x] 1.2 Create `src/components/__tests__/Skeleton.test.tsx`: render `SkeletonBlock` with dimensions and testID, verify `ParkDetailSkeleton` renders without error

## Phase 2: Screen Integration

- [x] 2.1 `ParkDetailScreen.tsx`: replace `<Text>Loading...</Text>` with `<ParkDetailSkeleton />` at `isParkLoading` guard
- [x] 2.2 `ParksListScreen.tsx`: destructure `isLoading` from `useSearchParks`; show `<ParksListSkeleton />` while loading (guard: `isLoading && !hasLoadedOnce`)
- [x] 2.3 `ProfileScreen.tsx`: replace `<Text>Loading...</Text>` with `<ProfileSkeleton />` at `!profile` guard

## Phase 3: Testing

- [x] 3.1 Update screen tests for skeleton visibility: `ParkDetailScreen`, `ParksListScreen`, `ProfileScreen` — assert skeleton present on load, absent after data arrives
- [x] 3.2 All 110 tests pass (`npx jest --passWithNoTests`)
