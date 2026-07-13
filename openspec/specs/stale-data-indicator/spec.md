# Stale Data Indicator Specification

**Change**: `map-markers-offline-share-history`

## Purpose

Surface when displayed park data comes from cache by showing a pill overlay with the data age in minutes.

## Requirements

### Requirement: Cache Age Computation

The system MUST compute the age of cached data by comparing the query client's `dataUpdatedAt` against `Date.now()`. The age MUST be expressed in minutes for display.

#### Scenario: Fresh data shows no indicator

- GIVEN the data was fetched less than 30 seconds ago
- WHEN the discovery screen renders
- THEN no stale-data pill is shown

#### Scenario: Cached data shows age in minutes

- GIVEN the data was fetched 5 minutes ago
- WHEN the discovery screen renders cached data
- THEN a pill displays "Datos de hace 5 min"

### Requirement: Stale Data Pill Rendering

The system SHOULD render a small pill overlay on the DiscoveryScreen when showing cached data older than 30 seconds.

#### Scenario: Pill disappears on fresh fetch

- GIVEN the stale-data pill is visible
- WHEN new data is fetched successfully
- THEN the pill disappears

#### Scenario: Pill updates on app resume

- GIVEN the stale-data pill was visible before going to background
- WHEN the app returns to foreground
- THEN the pill recomputes and displays the updated age

#### Scenario: No cached data on first launch

- GIVEN there is no cached data
- WHEN the discovery screen renders
- THEN no pill is shown
