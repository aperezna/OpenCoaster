# Delta for Search Park

## MODIFIED Requirements

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
