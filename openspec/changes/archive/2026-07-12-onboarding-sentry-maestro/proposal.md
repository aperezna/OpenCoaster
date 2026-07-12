# Proposal: Batch 5 Polish — Onboarding + Sentry + Maestro

## Intent

Deliver three independent polish items before wider release: first-launch onboarding UX, crash reporting for production monitoring, and E2E test coverage for confidence. Grouped under one change for workflow efficiency.

## Scope

### In Scope

- Onboarding carousel (3–4 slides, first-launch only, AsyncStorage gate)
- Sentry crash reporting integration (`@sentry/react-native` v8 + Expo plugin)
- Maestro E2E test flows (launch → parks → search → detail → back)

### Out of Scope

- Splash screen integration (deferred — expo-splash-screen planned pre-release)
- Sentry performance monitoring (available but not configured in this change)
- CI pipeline for Maestro (flows written for local emulator, CI adapter deferred)
- Onboarding skip button or re-trigger from settings

## Capabilities

### New Capabilities

- `onboarding`: first-launch carousel flow with AsyncStorage gate, inline conditional in App.tsx
- `sentry-crash-reporting`: Sentry SDK init, Expo native plugin, `.env`-based DSN, error boundary
- `maestro-e2e`: Maestro YAML flows using existing testID attributes

### Modified Capabilities

- None

## Approach

**Onboarding**: Inline conditional in `App.tsx` — useState/useEffect reads `hasSeenOnboarding` from AsyncStorage, renders `OnboardingScreen` or `RootNavigator`. Handle read delay with a brief loading/splash state. Infer approach from existing `AsyncStorageAdapter` pattern used in `useFavorites`.

**Sentry**: Install `@sentry/react-native` v8, add Expo plugin to `app.json`, call `Sentry.init()` in `App.tsx` with `Sentry.wrap()`. DSN read from `.env` at build time (never committed). Add React error boundary wrapper.

**Maestro**: Create `.maestro/flows/` with YAML flows targeting existing `testID` attributes. Flows: cold launch → parks list → search → park detail → navigate back.

## Affected Areas

| Area                                    | Impact   | Description                                        |
| --------------------------------------- | -------- | -------------------------------------------------- |
| `App.tsx`                               | Modified | Onboarding conditional + Sentry.init + Sentry.wrap |
| `app.json`                              | Modified | Add @sentry/react-native/expo plugin               |
| `src/features/onboarding/`              | New      | OnboardingScreen, slides, tests                    |
| `src/data/storage/onboardingStorage.ts` | New      | hasSeenOnboarding get/set via AsyncStorage         |
| `.maestro/flows/`                       | New      | Maestro YAML E2E test flows                        |
| `.env`                                  | New      | Sentry DSN (in .gitignore, never committed)        |
| `package.json`                          | Modified | Add @sentry/react-native dependency                |

## Risks

| Risk                                       | Likelihood | Mitigation                                                         |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------ |
| AsyncStorage read delay → flicker          | Med        | Add brief loading state; use useFocusEffect for readiness          |
| DSN accidentally committed                 | Low        | Add `.env` to `.gitignore`, use placeholder in source              |
| Maestro CLI/emulator not available locally | High       | Write flows first; document setup separately; can run in CI later  |
| Sentry native build breaks Expo Go         | Med        | Document that Sentry crashes only capture in dev builds/production |

## Rollback Plan

1. **Onboarding**: Revert `App.tsx` conditional logic — app returns to direct `RootNavigator` render. Delete `src/features/onboarding/`.
2. **Sentry**: Revert `App.tsx` Sentry.init/wrap. Remove Expo plugin from `app.json`. Remove `@sentry/react-native` dep from `package.json`. Delete `.env`.
3. **Maestro**: Delete `.maestro/flows/` directory. No runtime code change.

## Dependencies

- Sentry DSN (provided: `https://bfb31fb17a041add81cb37e66dc4ff7a@o4511722633363456.ingest.de.sentry.io/4511722646929488`)
- `@sentry/react-native` v8 + its Expo native plugin
- Maestro CLI (local install required for execution)
- Android emulator (local, for Maestro runs)

## Success Criteria

- [ ] Onboarding carousel renders on fresh install, skipped on subsequent launches
- [ ] Sentry captures an unhandled exception in dev build (manually verified)
- [ ] All existing Jest tests still pass (`npx jest --passWithNoTests`)
- [ ] Maestro flow completes end-to-end on local Android emulator
- [ ] No secrets (DSN) present in tracked source files
