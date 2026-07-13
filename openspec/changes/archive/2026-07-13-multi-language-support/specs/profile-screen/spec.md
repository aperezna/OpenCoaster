# Delta for Profile Screen

## ADDED Requirements

### Requirement: Language Picker

The ProfileScreen MUST display a language picker row below the favorites section. The picker MUST list available languages (`English`, `Español`) with the currently active language selected. Changing the selection MUST call `setLanguage()` from the `useLanguage` hook, updating the app language immediately and persisting the choice to AsyncStorage.

#### Scenario: Picker shows current language

- GIVEN the active language is `en`
- WHEN ProfileScreen renders
- THEN a language picker row is visible with "English" selected

#### Scenario: Language change from picker

- GIVEN the language picker is visible and the current language is `en`
- WHEN the user selects "Español" from the picker
- THEN `setLanguage('es')` is called
- AND all visible UI strings update to Spanish immediately
- AND `@opencoaster/language` persists `"es"` to AsyncStorage
