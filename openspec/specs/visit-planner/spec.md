# Visit Planner Specification

## Purpose

Allow users to plan park visits by creating and managing day itineraries with selected attractions, dates, and persistence via StorageAdapter.

## Requirements

### Requirement: Create Itinerary

The system MUST allow creating an itinerary by selecting a park and optionally a date.

#### Scenario: Create with park and date

- GIVEN the user is on the Visit Planner create screen
- WHEN the user selects a park, picks a date, and confirms
- THEN a new itinerary is saved via StorageAdapter with the selected park and date

#### Scenario: Create without date

- GIVEN the user is on the Visit Planner create screen
- WHEN the user selects a park but leaves the date unset
- THEN the itinerary is created with an undefined date
- AND the system displays "Date TBD"

### Requirement: Add and Remove Attractions

The system MUST allow adding attractions to an itinerary and removing them.

#### Scenario: Add from park detail

- GIVEN the park detail screen displays attraction cards
- AND the user has at least one itinerary
- WHEN the user taps "Add to itinerary" and selects an itinerary
- THEN the attraction is added to the selected itinerary

#### Scenario: Remove from itinerary

- GIVEN the itinerary detail screen shows a list of attractions
- WHEN the user taps "Remove" on an attraction
- THEN the attraction is removed from the itinerary

#### Scenario: Add with no itineraries

- GIVEN the park detail screen displays an attraction card
- AND the user has no itineraries
- WHEN the user taps "Add to itinerary"
- THEN the system navigates to the create itinerary flow

### Requirement: Reorder Attractions

The system SHOULD allow reordering attractions via move up/down buttons.

#### Scenario: Move up

- GIVEN the itinerary detail screen shows attractions in order
- WHEN the user taps "Move Up" on the second attraction
- THEN the second attraction moves ahead of the first

#### Scenario: Boundary at last position

- GIVEN the itinerary detail screen shows attractions in order
- WHEN the user taps "Move Down" on the last attraction
- THEN the order does not change

### Requirement: Delete Itinerary

The system MUST allow deleting an itinerary with confirmation.

#### Scenario: Delete and navigate back

- GIVEN the user is viewing an itinerary detail
- WHEN the user taps "Delete" and confirms
- THEN the itinerary is removed from storage
- AND the user is navigated to the itinerary list

### Requirement: Persistence

Itineraries MUST persist across app restarts via StorageAdapter.

#### Scenario: Survive restart

- GIVEN the user created an itinerary in a previous session
- WHEN the app restarts and the user views itineraries
- THEN the itinerary is still present

### Requirement: Wait Time Refresh

The system SHOULD refresh wait times when the itinerary detail screen opens.

#### Scenario: Refresh on screen focus

- GIVEN the itinerary detail screen contains attractions
- WHEN the screen gains focus
- THEN the system fetches current wait times for the relevant park
- AND the displayed wait times update
