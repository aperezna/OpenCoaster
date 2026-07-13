# Delta for search-park

## ADDED Requirements

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
