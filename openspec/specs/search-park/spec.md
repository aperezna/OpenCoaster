# Search Park Specification

**Proposal Source**: `mvp-discovery-foundation` — New Capability `search-park`

## Purpose

Define the manual park search by name and city, the result list rendering, and the placeholder detail screen. This is the fallback when geolocation is unavailable or the user wants to browse.

## Requirements

### Requirement: Search Input

The system MUST provide text inputs for park name, city, and country. The system MUST filter results by country when a country value is provided, and MAY combine city + country + name filters.
(Previously: text inputs for name and city only; no country filter)

#### Scenario: Search renders with empty inputs

- GIVEN the search screen is displayed
- WHEN no text has been entered
- THEN the name, city, and country inputs are shown as empty
- AND an initial result set is visible

#### Scenario: Search by name returns matching parks

- GIVEN the user enters a park name in the name input
- WHEN the search executes
- THEN the result list shows parks whose name contains the query text

#### Scenario: Search filters by country

- GIVEN the user enters a country in the country input
- WHEN the search executes
- THEN results are filtered to parks in that country

#### Scenario: Search combines name + city + country

- GIVEN the user enters a park name, a city, AND a country
- WHEN the search executes
- THEN results match ALL three criteria

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

### Requirement: Search History Persistence

The system MUST persist the last 10 successful search queries to AsyncStorage. On search submit, the current query MUST be saved to the history. History MUST be capped at 10 entries, evicting the oldest when exceeded. Duplicate queries MUST move to the top without creating a duplicate entry.

#### Scenario: Save search query on submit

- GIVEN the user enters a query and submits
- WHEN the search executes successfully
- THEN the query is added to the search history in AsyncStorage

#### Scenario: Evict oldest at limit

- GIVEN the history already contains 10 entries
- WHEN a new query is submitted
- THEN the oldest entry is evicted
- AND the new query is added

#### Scenario: Duplicate query moves to top

- GIVEN an existing query is in the history
- WHEN the same query is submitted again
- THEN the query moves to the top of the history
- AND no duplicate entry is created

### Requirement: Recent Searches UI

The system SHOULD render a recent searches list below the search input when the input is focused AND history is non-empty. Each item MUST be tappable to re-run that search.

#### Scenario: Show recent searches on focus

- GIVEN the history is non-empty
- WHEN the search input receives focus
- THEN a recent searches list appears below the input

#### Scenario: Tap recent search re-runs query

- GIVEN the recent searches list is visible
- WHEN the user taps a history item
- THEN the search input is populated with that query
- AND the search executes

### Requirement: Clear Search History

The system SHOULD provide a "Clear history" action visible when the recent searches list is displayed.

#### Scenario: Clear history empties list

- GIVEN the recent searches list is visible
- WHEN the user taps "Clear history"
- THEN the history in AsyncStorage is emptied
- AND the recent searches list disappears

#### Scenario: Clear history hidden when empty

- GIVEN the search history is empty
- WHEN the user views the search screen
- THEN no "Clear history" action is shown
