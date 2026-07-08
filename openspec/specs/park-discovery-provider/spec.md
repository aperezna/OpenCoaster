# Park Discovery Provider Specification

**Proposal Source**: `mvp-discovery-foundation` — New Capability `park-discovery-provider`

## Purpose

Define the `ParkDiscoveryProvider` interface, the normalized `ParkSummary` model, and fixture data that backs the discovery flow. The provider boundary enables later real-API swaps without changing consumers.

## Requirements

### Requirement: ParkSummary Model

The system MUST define a `ParkSummary` type with at minimum: `id`, `name`, `city`, `country`, and `latitude`/`longitude`. Additional fields MAY include `photoUrl` and `timezone`.

#### Scenario: ParkSummary includes required fields

- GIVEN a `ParkSummary` instance is created from fixture data
- THEN it MUST have a non-empty `id`, `name`, `city`, `country`, `latitude`, and `longitude`

#### Scenario: ParkSummary handles optional fields

- GIVEN a `ParkSummary` instance
- WHEN `photoUrl` is not provided
- THEN the field MUST be `undefined` or `null` without causing render errors

### Requirement: ParkDiscoveryProvider Interface

The system MUST expose a `ParkDiscoveryProvider` interface with a method `searchParks(query)` returning `ParkSummary[]`.

#### Scenario: Provider returns fixture results

- GIVEN the provider is initialized with fixture data
- WHEN `searchParks` is called with a query matching a fixture park name
- THEN it returns an array of matching `ParkSummary` objects

#### Scenario: Provider returns all parks on empty query

- GIVEN the provider has fixture data
- WHEN `searchParks` is called with an empty string
- THEN it SHOULD return all available parks

#### Scenario: Provider returns empty array for no match

- GIVEN the provider has fixture data
- WHEN `searchParks` is called with a query matching no parks
- THEN it returns an empty array

### Requirement: Fixture Data

The system MUST ship at least three fixture parks with realistic data for testing and development.

#### Scenario: Fixtures include diverse parks

- GIVEN the fixture data set
- THEN it MUST include at least one park in the US and one park in Europe
- AND each fixture MUST have all required `ParkSummary` fields filled
