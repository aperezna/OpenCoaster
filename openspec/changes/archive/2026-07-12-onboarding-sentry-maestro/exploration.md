## Exploration: Onboarding Carousel + Sentry + Maestro E2E

### 1. Onboarding Carousel

#### Current State

The app has no onboarding flow. On first launch, the `App.tsx` renders directly into `RootNavigator` (bottom tabs: Mapa, Parques, Usuario). AsyncStorage is already used for:

- Query cache persistence (`opencoaster:query-cache`)
- Favorites storage (`opencoaster:favorites`), via the `AsyncStorageAdapter` which implements the `StorageAdapter` interface.

The `useFavorites` hook at `src/features/favorites/useFavorites.ts` is the canonical pattern: inject `StorageAdapter`, load on mount, persist on mutation, handle corrupt data gracefully.

No expo-splash-screen is configured — `app.json` defines a static splash image but the app doesn't manage splash lifecycle programmatically.

#### Affected Files

- `App.tsx` — entry point: needs conditional render (onboarding vs main app)
- `src/features/onboarding/OnboardingScreen.tsx` — new: the carousel component
- `src/data/storage/onboardingStorage.ts` — new: `hasSeenOnboarding` get/set (or inline in a hook)
- `src/navigation/RootNavigator.tsx` — may need to accept `initialRouteName` with onboarding awareness
- `src/features/onboarding/__tests__/` — new tests
- `app.json` — may add splash screen hide config if using expo-splash-screen

#### Approaches

1. **Inline conditional in App.tsx** — simplest: check `hasSeenOnboarding` in a useState/useEffect, render onboarding or main app based on flag.
   - Pros: No navigation complexity; onboarding shown before any navigator mounts
   - Cons: Adds async loading state to App; onboarding lives outside navigation tree
   - Effort: Low

2. **Navigation-based with onboarding as a screen** — add onboarding as the initial route in a stack navigator that wraps the tab navigator.
   - Pros: Full navigation features (swipe, skip button, back behavior)
   - Cons: More moving parts; navigation container must be set up before onboarding check
   - Effort: Medium

3. **Splash screen → onboarding → main app** — use `expo-splash-screen` to keep splash visible while checking storage, then transition to onboarding or main app.
   - Pros: Smooth UX, no flash of app before async check
   - Cons: Adds expo-splash-screen dependency; more configuration
   - Effort: Medium

#### Recommendation

**Approach 1** for MVP — it's the simplest, matches the existing pattern (App.tsx is already thin), and avoids coupling navigation with onboarding state. Use a `useEffect` + `useState` pattern like `useFavorites` does. The brief "loading" flash is acceptable for MVP. Evolve to Approach 3 before release.

#### Risks

- AsyncStorage read delay could cause a flicker on cold start (mitigate with splash screen later)
- Must handle corrupt `hasSeenOnboarding` value gracefully (treat as not-seen)

---

### 2. Sentry Crash Reporting

#### Current State

No Sentry or error tracking is installed. The project uses Expo SDK 52. `@sentry/react-native` v8.18.0 is available on npm; `sentry-expo` v7.2.0 also exists but is the predecessor package.

The app has no error boundaries, no crash reporting, and no centralized error handler.

#### Affected Files

- `App.tsx` — wrap with `Sentry.wrap()` and call `Sentry.init()`
- `app.json` — add `@sentry/react-native/expo` plugin configuration
- `.env` (new) — store DSN (user needs to provide it)
- `package.json` — add `@sentry/react-native` dependency

#### Approaches

1. **`@sentry/react-native` (v8, recommended)** — the current SDK. Install directly, use `Sentry.init()` at app startup, wrap App with `Sentry.wrap()`. Uses the Expo plugin `@sentry/react-native/expo` for native builds.
   - Pros: Current SDK, active development, Expo native plugin support, full crash reporting + performance
   - Cons: Requires native build (not available in Expo Go)
   - Effort: Low

2. **`sentry-expo`** — predecessor package, wraps the same SDK but adds Expo-specific conveniences.
   - Pros: Historically the go-to for Expo
   - Cons: Lags behind `@sentry/react-native` releases; v7.2.0 vs v8.18.0; documentation now recommends `@sentry/react-native` directly for Expo SDK 50+
   - Effort: Low

#### Recommendation

**Approach 1** — `@sentry/react-native` v8 directly. Expo SDK 52 is fully compatible. Add the `@sentry/react-native/expo` plugin to `app.json` for native source map uploads. User MUST provide a DSN (ask in proposal phase).

#### Risks

- **User action required**: DSN must be provided. Cannot proceed without it.
- Native build needed — Sentry crashes won't capture in Expo Go (dev preview only JS errors)
- The Expo plugin adds native build dependency — `expo prebuild` must be run
- Performance monitoring adds bundle size (~200KB uncompressed)

---

### 3. Maestro E2E Tests

#### Current State

- **E2E capability**: none. The `openspec/config.yaml` shows `e2e.available: false`.
- **Maestro CLI**: NOT installed on this machine.
- **Java**: NOT available (Maestro requires JDK 11+).
- **.NET SDK**: NOT available.
- **Android emulator**: unknown if installed (no `emulator` or `adb` in PATH check).
- **iOS simulator**: not available on Windows.
- **Project**: Expo SDK 52, RN 0.76 — fully compatible with Maestro.
- **testID attributes**: heavily used across existing screens — `testID="discovery-screen"`, `testID="parks-list-screen"`, `testID="park-detail-screen"`, `testID="park-search-input"`, etc. This is excellent for Maestro.
- **No `.maestro/` directory** exists yet.

#### Would be needed

- JDK 11+ (for Android emulator)
- Android emulator running
- Maestro CLI installed (`curl -Ls https://get.maestro.mobile.dev | bash`)
- The app must be built and installed on emulator

#### Affected Areas (new files)

- `.maestro/flows/` — directory for Maestro YAML flows
- `.maestro/config.yaml` — optional Maestro configuration
- `package.json` — add scripts for Maestro: `e2e:android:build`, `e2e:maestro`

#### Approaches

1. **Local Android emulator + Maestro** — install Maestro CLI, build APK with `npx expo run:android`, install on emulator, run `maestro test .maestro/flows/`
   - Pros: Fastest feedback loop, full control
   - Cons: Requires JDK, Android SDK, emulator setup; significant local setup
   - Effort: High (setup) + Low (once running)

2. **EAS Build + Maestro** — use Expo EAS to build the APK remotely, download and install on local emulator, then run Maestro flows.
   - Pros: No local build toolchain needed
   - Cons: Requires EAS account; slower build loop
   - Effort: Medium

3. **CI-only (GitHub Actions)** — write Maestro flows but only run them in CI. Require the user to set up Maestro Cloud or self-hosted runner.
   - Pros: No local setup burden
   - Cons: No feedback during development
   - Effort: Medium

#### Recommendation

**Approach 1** for local development, with the flows designed to also run in CI (Approach 3) later. Write the Maestro flows first (they're just YAML), then tackle the environment setup. The user should verify they have an Android emulator before committing to Maestro.

#### Risks

- **Maestro CLI not installed** — user must run the install script
- **JDK not available** — Android development prerequisite
- **Windows limitations**: Maestro works on Windows but Android emulator setup is more complex than macOS/Linux
- **emulator availability**: unknown if user has a working Android emulator
- Maestro flows rely on `testID` which the app already has — this is good

---

### E2E Flow Design (proposed)

```yaml
# .maestro/flows/app-launch.yaml
appId: com.opencoaster.app
---
- launchApp:
    clearState: true
- assertVisible: 'discovery-screen'
- tapOn:
    id: 'tab-parques'
- assertVisible: 'parks-list-screen'
- tapOn:
    id: 'park-search-input'
- inputText: 'Magic'
- assertVisible: 'Magic Kingdom'
- tapOn:
    id: 'park-item-magic-kingdom'
- assertVisible: 'park-detail-screen'
- assertVisible: 'Magic Kingdom'
- back
- assertVisible: 'parks-list-screen'
```

(This is a design sketch — `appId` and exact IDs would be finalized in proposal.)

---

### Cross-cutting Risks

- **Scope**: these three features touch different layers (UI, infrastructure, testing) with minimal overlap — they can be implemented independently as separate changes.
- **Ordering**: Sentry benefits from being early (captures bugs from other features). Onboarding is independent. Maestro depends on the app being functional.
- **No env file handling**: the project has no `.env` pattern. Sentry DSN and other secrets need a mechanism (recommend `expo-constants` + `.env` pattern).

### Ready for Proposal

**Yes** — but the orchestrator should present these as **three separate proposals** since they have zero dependency on each other and each has a clean scope boundary. Recommended order: Sentry → Onboarding → Maestro (or Sentry → Maestro → Onboarding, depending on priority).

Ask the user:

1. For each feature: "Do you want a proposal for this?"
2. For Sentry: "Do you have a Sentry DSN ready?"
3. For Maestro: "Do you have an Android emulator set up?"
