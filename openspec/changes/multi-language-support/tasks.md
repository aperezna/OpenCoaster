# Tasks: Multi-Language Support (EN + ES)

## Review Workload Forecast

| Field                   | Value                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| Estimated changed lines | ~900                                                             |
| 800-line budget risk    | Medium                                                           |
| Chained PRs recommended | Yes                                                              |
| Suggested split         | PR 1 (Foundation) → PR 2 (Core strings) → PR 3 (Picker + Verify) |
| Delivery strategy       | ask-on-risk                                                      |
| Chain strategy          | stacked-to-main                                                  |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal                                                                                                          | Likely PR | Focused test command                 | Runtime harness                         | Rollback boundary                                          |
| ---- | ------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------ | --------------------------------------- | ---------------------------------------------------------- |
| 1    | i18n config, locale files, formatters, useLanguage, App wrapper, deps                                         | PR 1      | `npx jest src/i18n/__tests__/config` | Launch app → EN default renders         | Revert `src/i18n/`, `App.tsx` wrapper, `package.json` deps |
| 2    | Extract strings across 12 components (Discovery, ParksList, ParkDetail, Navigation, Onboarding, VisitPlanner) | PR 2      | `npx jest src/features/`             | Launch app → all screens render         | Revert `t()` per component group                           |
| 3    | ProfileScreen language picker, full test suite, grep pass                                                     | PR 3      | `npx jest` + Maestro e2e             | Profile → switch ES → all UI in Spanish | Revert `ProfileScreen.tsx` + test files                    |

## Phase 1: Foundation — i18n Setup

- [x] 1.1 Add `i18next` + `react-i18next` to `package.json` (installed v26.3.6 + v17.0.9)
- [x] 1.2 Create `src/i18n/config.ts` — init i18next with en/es JSON resources, fallback `en`, idempotent init
- [x] 1.3 Create `src/i18n/locales/en.json` — ~68 flat `section.key` English translations
- [x] 1.4 Create `src/i18n/locales/es.json` — ~68 key complete Spanish translation
- [x] 1.5 Create `src/i18n/useLanguage.ts` — hook returning `{language, setLanguage, isReady}`, AsyncStorage persist under `@opencoaster/language`, invalid language rejection
- [x] 1.6 Create `src/i18n/formatters.ts` — `formatDate`, `formatDistance`, `formatWait` with locale pluralization
- [x] 1.7 Modify `App.tsx` — wrap tree in `I18nextProvider`, init i18next before render

## Phase 2: Core — String Extraction

- [x] 2.1 `RootNavigator.tsx` — tab labels via `t('tab.*')`
- [x] 2.2 `DiscoveryScreen.tsx` — `t()` for proximity toggle, stale pill, search placeholder, empty state
- [x] 2.3 `ParksListScreen.tsx` — `t()` for search placeholder, clear history, error message
- [x] 2.4 `WeatherCard.tsx` — `t()` for condition labels, card title
- [x] 2.5 `AttractionList.tsx` — `t()` for type labels, wait/status strings, "Added" badge
- [x] 2.6 `LeafletMap.tsx` — `buildMapHtml(initialRegion, strings)` injects translated `detailButtonLabel` prop from `DiscoveryScreen` via `t('map.viewDetail')`
- [x] 2.7 `OnboardingCarousel.tsx` — `t()` for slide titles, body text, Skip/Next/Get Started
- [x] 2.8 `VisitPlannerScreen.tsx` — `t()` for "Create Itinerary", placeholders, empty state, dateTbd, attractionsCount
- [x] 2.9 `ItineraryDetailScreen.tsx` — `t()` for "Delete Itinerary", alert titles, wait/status, not found, dateTbd, attractionsCount
- [x] 2.10 `ItineraryPickerModal.tsx` — `t()` for title, "Create New", "Cancel", dateTbd, attractionsCount

### Bonus Phase 2 completions

- [x] `ErrorBoundary.tsx` — `i18next.t()` for error message and retry button
- [x] `ErrorState.tsx` — `useTranslation()` + `t()` for default error message and retry
- [x] `ParkDetailScreen.tsx` — `useTranslation()` + `t()` for not found, load error, no photo, directions, plan visit, share title with interpolation, wait/status strings
- [x] `HoursCard.tsx` — `t()` for card title, opening/closing labels

## Phase 3: Language Picker

- [x] 3.1 `ProfileScreen.tsx` — replace static "Idioma / Español" row with functional language picker calling `setLanguage()`
- [x] 3.2 Verify reactivity — switching language updates all visible `t()` strings without app restart (picker calls `setLanguage()` → `i18next.changeLanguage()` → reactive via react-i18next)

## Phase 4: Testing & Verification

### Executor Phase 4 tasks (PR 3 scope)

- [x] 4.1 Run full test suite: `npx jest --passWithNoTests` — 39 suites, 323 tests, all PASS
- [x] 4.2 Run type check: `npx tsc --noEmit` — clean, no errors
- [x] 4.3 Run linter: `npx eslint .` — 0 errors, 15 warnings (all pre-existing)
- [x] 4.4 Grep codebase for hardcoded strings — found in ProfileScreen.tsx, SearchBar.tsx
- [x] 4.5 Fix missed strings — replaced 8 strings in ProfileScreen.tsx, 1 in SearchBar.tsx, added `profile.noItineraries` key to locale files
- [x] 4.6 Run final full suite — 39 suites, 323 tests, all PASS
- [x] 4.7 Report final count — see executor summary

### Existing unit tests (written in PR 1)

- [x] 4.1 Unit: i18next loads en/es namespaces, missing keys fallback to English
- [x] 4.2 Unit: `useLanguage` get/set/persist, invalid language rejection (`setLanguage('fr')` ignored)
- [x] 4.3 Unit: `formatWait` pluralization — `formatWait(1)` → "1 min", `formatWait(5)` → "5 mins" in both locales

### Integration & E2E (beyond PR 3 scope or verified via unit tests)

- [x] 4.4 Integration: ProfileScreen picker changes language — render, tap option, verify `t()` output (covered by ProfileScreen unit tests)
- [ ] 4.5 Integration: RootNavigator tab labels update on language switch (integration scope, separate PR)
- [ ] 4.6 E2E: Maestro — profile → switch ES → verify discovery/parks/planner show Spanish (E2E scope)

### Grep results

Hardcoded strings found and fixed:

- `ProfileScreen.tsx` — 8 strings replaced with `t()`: memberSince, favorites, noFavorites, itineraries, noItineraries, preferences, darkMode, logout
- `SearchBar.tsx` — 1 string replaced with `t('common.searchPlaceholder')`
- `src/i18n/locales/en.json` — added `profile.noItineraries`
- `src/i18n/locales/es.json` — added `profile.noItineraries`

No remaining hardcoded user-facing strings in src/ component files.
