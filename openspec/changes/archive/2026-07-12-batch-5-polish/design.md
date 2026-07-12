# Design: Batch 5 Polish — Onboarding, Sentry, Maestro

## Technical Approach

Three independent features delivered together for efficiency. Onboarding uses inline conditional rendering in `App.tsx` with an AsyncStorage-backed hook. Sentry initializes before render with a DSN from environment config. Maestro flows use existing `testID` attributes — no app changes needed.

## Architecture Decisions

| Decision             | Choice                               | Alternatives                      | Rationale                                                                                       |
| -------------------- | ------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Onboarding placement | Inline in `App.tsx`                  | Separate navigator, splash screen | Simplest — no navigation complexity; avoids persisting a "seen" state through navigation params |
| Storage key          | Direct `AsyncStorage.getItem`        | Via `StorageAdapter`              | Onboarding is app-wide, not domain data; avoids coupling to query client lifecycle              |
| Sentry DSN source    | `process.env.EXPO_PUBLIC_SENTRY_DSN` | `.env` file + runtime read        | Expo inlines `EXPO_PUBLIC_*` at build time; `.env` already in `.gitignore`                      |
| Sentry wrapping      | `Sentry.wrap()` around provider tree | Manual `Sentry.setUser` etc.      | `wrap()` is the idiomatic way to capture navigation/rendering errors                            |
| Maestro flows        | Separate YAML per journey            | Single monolithic flow            | Easier to debug, rerun individually, and extend per feature                                     |

## Data Flow

### Onboarding

```
App.tsx mount
  └─ useHasSeenOnboarding()
       ├─ loading (null) → render loading/splash placeholder
       └─ resolved (boolean)
            ├─ false → OnboardingCarousel
            │             └─ "Get Started" / "Skip"
            │                  └─ setItem("hasSeenOnboarding","true") → render main app
            └─ true → main app (providers + navigation)
```

### Sentry

```
process.env.EXPO_PUBLIC_SENTRY_DSN
  ├─ defined → Sentry.init({ dsn }) → Sentry.wrap({ children })
  └─ undefined / empty → skip init, render children directly
```

### Maestro

```
maestro test .maestro/flows/launch.yaml
  → taps nothing, asserts discovery-screen visible
maestro test .maestro/flows/search.yaml
  → types text, asserts search-result-* appear
maestro test .maestro/flows/park-detail.yaml
  → navigates to parks list, taps park-item-*, asserts park-detail-screen
```

## File Changes

| File                                                              | Action | Description                                              |
| ----------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| `src/features/onboarding/useHasSeenOnboarding.ts`                 | Create | Hook: reads/writes `hasSeenOnboarding` in AsyncStorage   |
| `src/features/onboarding/OnboardingCarousel.tsx`                  | Create | 3-slide carousel with Skip + Get Started                 |
| `src/features/onboarding/__tests__/useHasSeenOnboarding.test.tsx` | Create | Unit tests for hook                                      |
| `src/features/onboarding/__tests__/OnboardingCarousel.test.tsx`   | Create | Rendered output + button interaction tests               |
| `App.tsx`                                                         | Modify | Add Sentry init, wrap, and conditional onboarding render |
| `__tests__/App.test.tsx`                                          | Create | Integration test for onboarding + Sentry behavior        |
| `.maestro/flows/launch.yaml`                                      | Create | Launch → discovery screen visible                        |
| `.maestro/flows/search.yaml`                                      | Create | Type in search → results appear                          |
| `.maestro/flows/park-detail.yaml`                                 | Create | Parks list → tap park → detail visible                   |
| `.maestro/README.md`                                              | Create | Local Maestro setup instructions                         |
| `.env.example`                                                    | Create | Document `EXPO_PUBLIC_SENTRY_DSN` var                    |

## Interfaces / Contracts

```typescript
// useHasSeenOnboarding.ts
type OnboardingState = 'loading' | 'seen' | 'unseen';
interface UseHasSeenOnboardingReturn {
  status: OnboardingState;
  completeOnboarding: () => Promise<void>;
}

// OnboardingCarousel.tsx
interface OnboardingCarouselProps {
  onComplete: () => void;
}
```

## Testing Strategy

| Layer       | What                      | Approach                                                                                                                          |
| ----------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | `useHasSeenOnboarding`    | Mock AsyncStorage; test loading→seen/unseen transitions, corrupt value fallback                                                   |
| Unit        | `OnboardingCarousel`      | Render with `@testing-library/react-native`. Assert 3 slides via text content, "Skip" dismisses, "Get Started" calls `onComplete` |
| Integration | `App.tsx` with onboarding | Wrap in test providers. Mock AsyncStorage to return `null` → carousel renders. Mock to return `"true"` → main app renders         |
| Integration | `App.tsx` with Sentry     | Mock `@sentry/react-native`. Assert `init` NOT called when DSN missing; called when DSN present                                   |
| E2E         | Maestro flows             | Real device/emulator — not Jest                                                                                                   |
| E2E         | Sentry                    | Manual verification: DSN configured → crash triggers error in Sentry dashboard                                                    |

## Migration / Rollout

No migration required. All three features are additive:

- **Onboarding**: new users see carousel; existing users have no stored flag → treated as unseen.
- **Sentry**: no-op when DSN is absent; activates once `.env` is configured.
- **Maestro**: flows reference existing `testID`s — no runtime impact.

## Open Questions

- [ ] Should existing users (no stored flag) see the carousel once, or should we set `hasSeenOnboarding=true` for them via a migration?
- [ ] Confirm Sentry DSN variable name format for Expo EAS builds vs local dev.
