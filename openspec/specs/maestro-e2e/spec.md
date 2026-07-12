# Maestro E2E Specification

## Purpose

Define Maestro YAML end-to-end flows that verify critical user journeys using existing `testID` attributes.

## Requirements

### Requirement: Launch Flow

The system MUST provide a Maestro flow validating that the app launches and the discovery screen renders.

#### Scenario: App launches to discovery

- GIVEN the app is installed and launched via Maestro
- WHEN `maestro test .maestro/flows/launch.yaml` executes
- THEN the discovery screen (`testID: "discovery-screen"`) is visible
- AND the search input (`testID: "search-name-input"`) is visible

### Requirement: Search Flow

The system MUST provide a Maestro flow validating that text input filters search results.

#### Scenario: Typing filters results

- GIVEN the discovery screen is displayed
- WHEN the user types in `search-name-input`
- THEN results with `testID` matching `search-result-*` update to show matching parks only

### Requirement: Detail Navigation Flow

The system MUST provide a Maestro flow validating navigation from parks list to park detail.

#### Scenario: Tap park opens detail

- GIVEN the parks list displays items (`testID: "park-item-*"`)
- WHEN the user taps a park item
- THEN the park detail screen (`testID: "park-detail-screen"`) is visible

### Requirement: Flow File Location

All Maestro flows MUST be stored under `.maestro/flows/` and MUST use existing `testID` attributes for element selectors.

#### Scenario: Flows in correct directory

- GIVEN the `.maestro/flows/` directory exists
- WHEN Maestro discovers flows
- THEN all YAML files under that directory are available for execution
