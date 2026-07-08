# Search Park Specification

**Proposal Source**: `mvp-discovery-foundation` — New Capability `search-park`

## Purpose

Define the manual park search by name and city, the result list rendering, and the placeholder detail screen. This is the fallback when geolocation is unavailable or the user wants to browse.

## Requirements

### Requirement: Search Input

The system MUST provide a text input for park name and a text input for city.

#### Scenario: Search renders with empty inputs

- GIVEN the search screen is displayed
- WHEN no text has been entered
- THEN both name and city inputs are shown as empty
- AND an initial result set (all parks or empty) is visible

#### Scenario: Search by name returns matching parks

- GIVEN the user enters a park name in the name input
- WHEN the search executes (on change or submit)
- THEN the result list shows parks whose name contains the query text

#### Scenario: Search by name + city narrows results

- GIVEN the user enters a park name AND a city
- WHEN the search executes
- THEN results match BOTH the name AND the city criteria

### Requirement: Result List

The system MUST display search results as a scrollable list showing at minimum the park name and city.

#### Scenario: Results display park info

- GIVEN search results are returned
- WHEN the list renders
- THEN each item shows the park name and city
- AND each item is tappable

#### Scenario: No results shows empty state

- GIVEN a search returns zero results
- WHEN the result list renders
- THEN a message such as "No parks found" is displayed
- AND the list is empty

### Requirement: ParkDetailScreen Placeholder

The system MUST show a detail placeholder screen when a park is selected, displaying at minimum the park name and location.

#### Scenario: Selecting a park opens detail

- GIVEN a search result list with parks
- WHEN the user taps a park item
- THEN the app navigates to the detail screen
- AND the detail screen shows the selected park's name and city

#### Scenario: Detail screen handles missing photo

- GIVEN a park with no `photoUrl`
- WHEN the detail screen renders
- THEN the photo area SHOULD show a placeholder image or be omitted without breaking layout
