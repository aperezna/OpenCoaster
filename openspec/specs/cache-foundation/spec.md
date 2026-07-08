# Cache Foundation Specification

**Proposal Source**: `mvp-discovery-foundation` — New Capability `cache-foundation`

## Purpose

Define the TanStack Query configuration, persisted cache type definitions, and storage adapter contract. This foundation enables stale-while-revalidate caching and prepares for offline persistence.

## Requirements

### Requirement: QueryClient Configuration

The system MUST configure a TanStack Query `QueryClient` with a default `staleTime` of at least 30 seconds.

#### Scenario: Default staleTime is applied

- GIVEN the QueryClient is created with `staleTime: 30000`
- WHEN a query resolves successfully
- THEN subsequent reads within 30 seconds do NOT refetch

#### Scenario: QueryClient provides retry on failure

- GIVEN the QueryClient is configured
- WHEN a query fails
- THEN the client SHOULD retry at least once before surfacing the error

### Requirement: Storage Adapter Types

The system MUST define a `StorageAdapter` interface for persisting query cache data to a local store, with `getItem`, `setItem`, and `removeItem` methods.

#### Scenario: StorageAdapter interface is defined

- GIVEN the cache foundation module
- THEN it MUST export a `StorageAdapter` type or interface
- AND the interface MUST specify `getItem(key: string): Promise<string | null>`, `setItem(key: string, value: string): Promise<void>`, and `removeItem(key: string): Promise<void>`

#### Scenario: StorageAdapter is accepted by cache config

- GIVEN a valid `StorageAdapter` implementation (e.g., `AsyncStorage` wrapper)
- WHEN it is passed to the cache configuration
- THEN the TanStack Query `persistQueryClient` plugin can use it without type errors

### Requirement: Cache Key Namespace

The system MUST prefix all TanStack Query cache keys with `opencoaster:` to avoid collisions.

#### Scenario: Query keys are namespaced

- GIVEN a park discovery query
- WHEN the query key is created
- THEN it MUST start with `["opencoaster"]` as the first segment
