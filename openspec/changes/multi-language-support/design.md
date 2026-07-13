# Design: Multi-Language Support (EN + ES)

## Technical Approach

Install `i18next` + `react-i18next`, create a `src/i18n/` module with flat JSON locale files, a `useLanguage` hook wrapping AsyncStorage persistence, and locale-aware formatters. Wrap the app in `I18nextProvider`. Replace ~68 hardcoded strings across 18 components with `t('key')` calls. Inject translated strings into the LeafletMap WebView HTML via the template builder.

## Architecture Decisions

| Decision        | Options                                               | Tradeoff                                                                                                | Choice                          |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------- |
| i18n library    | i18next / react-intl / expo-localization standalone   | i18next has the richest RN ecosystem, built-in pluralization, and react-i18next provides reactive hooks | **i18next + react-i18next**     |
| Locale format   | Nested JSON / flat keys                               | Flat keys (`common.search`, `parkDetail.share`) avoid deep merging surprises and make key lookup O(1)   | **Flat section.key**            |
| WebView strings | Inject via HTML template param / postMessage on mount | Template param is simpler and avoids race conditions — strings are baked into the HTML before render    | **Build-time locale injection** |
| Tab labels      | Route name string / `t()` call                        | Route names are used for navigation logic, not display; decouple via `tabBarLabel` prop using `t()`     | **`t('tab.map')`**              |
| Runtime switch  | i18next.changeLanguage vs reload                      | i18next + react-i18next is reactive by default; no reload needed                                        | **changeLanguage**              |

## Data Flow

```
App.tsx
  │
  └── I18nextProvider ── i18next config ── en.json / es.json
       │
       ├── useLanguage() hook ── AsyncStorage (@opencoaster/language)
       │
       ├── RootNavigator ── t('tab.*') for tab labels
       │
       ├── ~18 components ── useTranslation() → t('section.key')
       │
       └── LeafletMap ── buildMapHtml(locale) → HTML with translated labels
```

Locale load: `AsyncStorage.getItem` → detect persisted choice → `i18next.init`. Fallback: `en`.

## File Changes

| File                                                   | Action | Description                                                                                                     |
| ------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `src/i18n/config.ts`                                   | Create | i18next initialization with `en`/`es` resources, fallback language                                              |
| `src/i18n/useLanguage.ts`                              | Create | `useLanguage()` hook: returns `{language, setLanguage, isReady}`, persists to AsyncStorage                      |
| `src/i18n/formatters.ts`                               | Create | `formatDate()`, `formatDistance()`, `formatWait()` with pluralization                                           |
| `src/i18n/locales/en.json`                             | Create | ~68 flat keys, English translations                                                                             |
| `src/i18n/locales/es.json`                             | Create | ~68 flat keys, Spanish translations (complete, missing keys fallback to en)                                     |
| `App.tsx`                                              | Modify | Wrap app tree in `<I18nextProvider>`; init i18next before render                                                |
| `src/navigation/RootNavigator.tsx`                     | Modify | Replace display route names with `t('tab.map')`, `t('tab.parks')`, `t('tab.profile')` via `tabBarLabel`         |
| `src/features/profile/ProfileScreen.tsx`               | Modify | Replace static "Idioma / Español" row with functional language picker (Picker or modal) calling `setLanguage()` |
| `src/features/onboarding/OnboardingCarousel.tsx`       | Modify | Slide titles, body text, "Skip", "Next", "Get Started" → `t()`                                                  |
| `src/features/discovery/LeafletMap.tsx`                | Modify | `buildMapHtml()` accepts locale param; button label "Ver más" → injected string                                 |
| `src/features/park-details/WeatherCard.tsx`            | Modify | Condition labels, card title → `t()`                                                                            |
| `src/features/park-details/AttractionList.tsx`         | Modify | Type labels, wait/status strings, "Added" badge, "+ Itinerary" → `t()`                                          |
| `src/features/discovery/DiscoveryScreen.tsx`           | Modify | Proximity toggle text, stale pill, search placeholder, results empty → `t()`                                    |
| `src/features/parks-list/ParksListScreen.tsx`          | Modify | Search placeholders, "Clear history", error message → `t()`                                                     |
| `src/features/visit-planner/VisitPlannerScreen.tsx`    | Modify | "Create Itinerary", placeholders, empty state → `t()`                                                           |
| `src/features/visit-planner/ItineraryDetailScreen.tsx` | Modify | "Delete Itinerary", alert titles, wait/status → `t()`                                                           |
| `src/features/visit-planner/ItineraryPickerModal.tsx`  | Modify | Title, "Create New", "Cancel", empty text → `t()`                                                               |
| `package.json`                                         | Modify | Add `i18next ^24.0`, `react-i18next ^15.0`                                                                      |

**Totals**: 5 created, 13 modified, 0 deleted.

## Interfaces / Contracts

```typescript
// src/i18n/useLanguage.ts
export function useLanguage(): {
  language: 'en' | 'es';
  setLanguage: (lang: 'en' | 'es') => Promise<void>;
  isReady: boolean;
};

// src/i18n/formatters.ts
export function formatDate(date: Date, locale?: string): string;
export function formatDistance(meters: number, locale?: string): string;
export function formatWait(minutes: number, locale?: string): string;

// LeafletMap locale injection (new prop)
interface LeafletMapProps {
  /* existing props */
  locale?: string; // 'en' | 'es'
}
```

## Testing Strategy

| Layer       | What to Test                               | Approach                                                                      |
| ----------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| Unit        | i18next config loads en/es, fallback works | Jest: init i18next, call `t()` for existing and missing keys                  |
| Unit        | `useLanguage` get/set/persist              | Mock AsyncStorage, verify `setLanguage` calls `changeLanguage` + storage      |
| Unit        | `formatWait` pluralization                 | `formatWait(1)` → "1 min", `formatWait(5)` → "5 mins"                         |
| Integration | ProfileScreen picker changes language      | TL-RN render, tap picker option, verify `t()` output changes                  |
| Integration | Tab labels update on language switch       | Render `RootNavigator` with mocked `useTranslation`, verify tab labels        |
| E2E         | Full language switch flow                  | Maestro: profile → switch to ES → verify discovery/parks/planner show Spanish |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Add deps, create files, replace strings component-by-component. No data migration.

## Open Questions

- [ ] Should LeafletMap locale be passed as a prop or read directly from i18next inside the component? (Prop is simpler for the template builder; reading from i18next inside avoids prop drilling.)
