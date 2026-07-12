# Parks List Specification

## Purpose

Define the browsable park list screen with search, navigation to detail, and deep-link handling for the Parques tab.

## Requirements

### Requirement: Parks List Display

The system MUST display all parks when the list screen mounts, using `useSearchParks` with an empty query.

#### Scenario: List loads all parks on mount

- GIVEN the user navigates to the Parques tab
- WHEN the parks list screen mounts
- THEN the screen calls `useSearchParks({})`
- AND all known parks display as a scrollable list

#### Scenario: Empty system shows empty state

- GIVEN no parks exist in the system
- WHEN the list screen mounts
- THEN "No parks found" is displayed
- AND the list is empty

### Requirement: Search Filter

The system SHOULD filter the displayed parks by name as the user types in the search bar.

#### Scenario: Typing filters parks

- GIVEN the parks list displays multiple parks
- WHEN the user types a partial park name in the search bar
- THEN the list updates to show only parks whose name contains the typed text

#### Scenario: No matches shows empty state

- GIVEN the user has typed a query matching no parks
- WHEN the list re-renders
- THEN "No parks found" is displayed
- AND the list is empty

### Requirement: Navigation to Detail

The system MUST navigate to `ParkDetailScreen` with the selected `parkId` when the user taps a park item.

#### Scenario: Tapping a park opens detail

- GIVEN the parks list displays park items
- WHEN the user taps a park item
- THEN the app navigates to `ParkDetail` with the tapped park's `parkId`

#### Scenario: Detail handles missing park gracefully

- GIVEN the user taps a park whose data fails to load
- WHEN the detail screen renders
- THEN an error or "Park not found" state is shown

### Requirement: Back Navigation

The system MUST provide a working back button on `ParkDetailScreen` when accessed from the parks list.

#### Scenario: Back button returns to list

- GIVEN the user navigated from the parks list to park detail
- WHEN the user presses the back button
- THEN the app returns to the parks list
- AND the list retains its prior search state

### Requirement: Deep Link from Discovery

The system MUST auto-navigate to `ParkDetail` when the Parques tab receives a `parkId` parameter from `DiscoveryScreen`, bypassing the list.

#### Scenario: Deep link navigates directly to detail

- GIVEN DiscoveryScreen calls `navigate('Parques', { parkId })` with a valid park ID
- WHEN the Parques tab mounts
- THEN the list screen intercepts the params
- AND navigates directly to `ParkDetail` with that `parkId`

#### Scenario: Deep link with unknown parkId

- GIVEN DiscoveryScreen passes a `parkId` that does not exist
- WHEN the Parques tab mounts and auto-navigates to detail
- THEN the detail screen shows a "Park not found" fallback

### Requirement: Auto-nav Guard

The system MUST NOT re-trigger auto-navigation when the user presses back after a deep link.

#### Scenario: Back from deep link shows list without re-trigger

- GIVEN the user auto-navigated to park detail via deep link
- WHEN the user presses back to the list
- THEN the list is displayed
- AND pressing the back button does NOT re-trigger auto-navigation

#### Scenario: User taps different park after returning

- GIVEN the user returned to the list after a deep link
- WHEN the user taps a different park
- THEN the app navigates to the new park's detail screen
