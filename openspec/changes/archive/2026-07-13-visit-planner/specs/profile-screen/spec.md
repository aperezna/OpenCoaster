# Delta for profile-screen

## ADDED Requirements

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
