# Tasks: Batch 5 Polish — Onboarding, Sentry, Maestro

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

| Field                   | Value      |
| ----------------------- | ---------- |
| Estimated changed lines | ~300       |
| 400-line budget risk    | Low        |
| Chained PRs recommended | No         |
| Suggested split         | Single PR  |
| Delivery strategy       | auto-chain |
| Chain strategy          | pending    |

No work units needed — all three features fit within the review budget.

## Phase 1: Infrastructure — Sentry + Environment

- [x] 1.1 Install `@sentry/react-native` via `npx expo install @sentry/react-native`
- [x] 1.2 Create `.env.example` with `EXPO_PUBLIC_SENTRY_DSN=your-dsn-here`
- [x] 1.3 Modify `App.tsx` — init Sentry before render, wrap provider tree with `Sentry.wrap()`

## Phase 2: Onboarding Carousel

- [x] 2.1 RED: Write test for `useHasSeenOnboarding` (loading, seen, unseen, corrupt data fallback)
- [x] 2.2 GREEN: Create `src/features/onboarding/useHasSeenOnboarding.ts`
- [x] 2.3 RED: Write test for `OnboardingCarousel` (3 slides render, Skip dismisses, Get Started calls onComplete)
- [x] 2.4 GREEN: Create `src/features/onboarding/OnboardingCarousel.tsx`
- [x] 2.5 Modify `App.tsx` — import `useHasSeenOnboarding`, show carousel when unseen, main app when seen

## Phase 3: Maestro E2E Flows

- [x] 3.1 Create `.maestro/flows/launch.yaml` — app launches, `discovery-screen` visible
- [x] 3.2 Create `.maestro/flows/search.yaml` — type text, `search-name-input` appears
- [x] 3.3 Create `.maestro/flows/park-detail.yaml` — tap `park-item-*`, `park-detail-screen` visible
- [x] 3.4 Create `.maestro/README.md` — local Maestro setup instructions

## Phase 4: Integration Tests

- [x] 4.1 Create `app/__tests__/App.test.tsx` — mock AsyncStorage for onboarding scenarios + `app/__tests__/SentryInit.test.tsx` for Sentry init/no-init scenarios

## TDD Cycle Evidence

| Task | Phase       | Result                            | Notes                                                                                        |
| ---- | ----------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| 2.1  | RED         | 1 suite failed (module not found) | Test written with 6 cases: loading, seen, unseen, corrupt, completeOnboarding, storage error |
| 2.2  | GREEN       | 6/6 passed                        | Hook with injectable AsyncStorage default + cancel-safe effect                               |
| 2.3  | RED         | 1 suite failed (module not found) | Test written with 8 cases: 3 slides render, Skip, Next, Get Started, dots, scrollview        |
| 2.4  | GREEN       | 8/8 passed                        | ScrollView carousel with paging, button navigation, dot indicators                           |
| 2.5  | INTEGRATION | App.test.tsx passes               | Conditional render based on useHasSeenOnboarding, loading/states                             |
