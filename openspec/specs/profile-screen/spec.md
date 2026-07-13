# Profile Screen Specification

## Purpose

Display the user's favorited parks and allow navigation to park details.

## Requirements

### Requirement: Favorites List

When the user has favorited parks, the ProfileScreen MUST render a list of `FavoritePark` entries. Each item MUST display the park name.

#### Scenario: Shows favorited parks

- GIVEN the user has three favorited parks
- WHEN ProfileScreen renders
- THEN the favorites list is visible with three entries showing park names

#### Scenario: Tap navigates to park detail

- GIVEN the favorites list is displayed
- WHEN the user taps a favorite entry
- THEN the app navigates to `ParkDetail` with that park's `parkId`

### Requirement: Empty State

When no favorites exist, the screen SHOULD display "No favorites yet" instead of a list.

#### Scenario: Shows empty message

- GIVEN the user has no favorited parks
- WHEN ProfileScreen renders
- THEN the screen shows "No favorites yet" text

### Requirement: Itineraries List

When the user has saved itineraries, the ProfileScreen MUST display a "My Itineraries" section below the favorites list. Each entry MUST show the park name, date (or "Date TBD"), and number of attractions. Tapping an entry MUST navigate to the itinerary detail screen.

#### Scenario: Shows saved itineraries

- GIVEN the user has two saved itineraries with different parks
- WHEN ProfileScreen renders
- THEN a "My Itineraries" section is visible with two entries
- AND each entry displays the park name, date, and attraction count

#### Scenario: Tap navigates to itinerary detail

- GIVEN the "My Itineraries" section displays an itinerary entry
- WHEN the user taps the entry
- THEN the app navigates to ItineraryDetailScreen with that itinerary's ID

### Requirement: Itineraries Empty State

When no itineraries exist, the ProfileScreen SHOULD display "No itineraries yet" in the itinerary section instead of a list.

#### Scenario: Shows empty message

- GIVEN the user has no saved itineraries
- WHEN ProfileScreen renders
- THEN the itinerary section shows "No itineraries yet" text

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
