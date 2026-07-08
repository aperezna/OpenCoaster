# App Bootstrap Specification

**Proposal Source**: `mvp-discovery-foundation` — New Capability `app-bootstrap`

## Purpose

Define the Expo + React Native + TypeScript application shell, including navigation structure and TanStack Query client setup. This is the foundation all screens and features mount into.

## Requirements

### Requirement: Expo App Shell

The system MUST boot an Expo-managed React Native application in TypeScript mode with a working Metro dev server.

#### Scenario: Expo app launches

- GIVEN a clean Expo project with TypeScript enabled
- WHEN `npx expo start` is invoked
- THEN the Metro bundler starts without errors
- AND the app renders a root view on the target platform

#### Scenario: TypeScript compilation passes

- GIVEN the project has TypeScript configured
- WHEN `npx tsc --noEmit` is run
- THEN no type errors are reported for the app shell files

### Requirement: Navigation Stack

The system MUST provide a navigation container with at least two screens: a discovery (map/search) screen and a park-detail placeholder screen.

#### Scenario: Navigation mounts both screens

- GIVEN the navigation stack is configured with a stack navigator
- WHEN the app initializes
- THEN the initial route is the discovery (map/search) screen
- AND navigating to the park-detail screen renders the placeholder

#### Scenario: Unknown route shows fallback

- GIVEN the navigation stack
- WHEN a route name does not match any registered screen
- THEN the app SHOULD show a fallback view instead of crashing

### Requirement: TanStack Query Provider

The system MUST wrap the app root in a `QueryClientProvider` with a configured `QueryClient`.

#### Scenario: Query client is available to screens

- GIVEN the app root is wrapped in `QueryClientProvider`
- WHEN any screen or hook calls `useQuery`
- THEN the query executes against the configured client without manual setup
