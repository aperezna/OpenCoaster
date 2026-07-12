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
