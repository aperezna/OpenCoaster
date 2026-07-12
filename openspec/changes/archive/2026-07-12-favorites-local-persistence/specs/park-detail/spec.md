# Park Detail Screen Specification

## Purpose

Show park information and provide a favorite toggle (star) button.

## Requirements

### Requirement: Favorite Toggle

The ParkDetailScreen SHOULD render a favorite toggle button. The button MUST call `toggleFavorite` from `useFavorites` with the current park's ID and name when pressed. The button's visual state SHOULD reflect whether the park is favorited (filled star when favorited, outline when not).

#### Scenario: Toggle on adds favorite

- GIVEN the current park is not favorited
- WHEN the user presses the toggle button
- THEN the park appears in `useFavorites().favorites`
- AND the toggle visually changes to filled/active state

#### Scenario: Toggle off removes favorite

- GIVEN the current park is favorited
- WHEN the user presses the toggle button
- THEN the park is removed from `useFavorites().favorites`
- AND the toggle visually changes to outline/inactive state

#### Scenario: Visual indicator reflects state on load

- GIVEN the current park is favorited
- WHEN ParkDetailScreen renders with the park's ID
- THEN the toggle button renders in the filled/active state
