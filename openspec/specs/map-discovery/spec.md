# Map Discovery Specification

**Proposal Source**: `mvp-discovery-foundation` — New Capability `map-discovery`

## Purpose

Define the map screen behavior: OpenStreetMap rendering, geolocation permission handling, and current-location marker display. Location is an optional input — denial must not crash the app.

## Requirements

### Requirement: Map Screen

The system MUST render a map using `react-native-maps` configured for OpenStreetMap tiles.

#### Scenario: Map renders at launch

- GIVEN the user opens the discovery screen
- WHEN the screen renders
- THEN a map view is displayed with default region coordinates

#### Scenario: Initial region is set

- GIVEN the map screen is mounted
- WHEN the map finishes loading
- THEN the initial visible region SHOULD be a reasonable default (e.g., lat `0`, lng `0`, or a configurable fallback)

### Requirement: Geolocation Permission Handling

The system MUST request and handle location permissions gracefully.

#### Scenario: Permission granted — map shows current location

- GIVEN the device location service is enabled
- WHEN the user grants location permission
- THEN a marker is shown at the device's current location
- AND the map MAY animate to the user's coordinates

#### Scenario: Permission denied — no crash

- GIVEN the user denies location permission
- WHEN the app requests location
- THEN the map renders without a current-location marker
- AND the system navigates to or enables the manual search input without error

#### Scenario: Permission undetermined — request is shown

- GIVEN the app has not yet requested location permission
- WHEN the discovery screen mounts
- THEN the system SHOULD request permission via the platform permission dialog

#### Scenario: Permission error — graceful fallback

- GIVEN the location service encounters an error (e.g., unavailable on emulator)
- WHEN the app attempts to read position
- THEN the map renders without a location marker
- AND an error state is surfaced without crashing the UI
