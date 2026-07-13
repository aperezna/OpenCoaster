# Map Markers Specification

**Change**: `map-markers-offline-share-history`

## Purpose

Show park location pins on LeafletMap with clustering at low zoom levels.

## Requirements

### Requirement: Park Marker Rendering

The system MUST render a marker on the LeafletMap for each park that has coordinates. Each marker MUST represent the park's geographic location.

#### Scenario: Park with coordinates renders marker

- GIVEN the park data includes latitude and longitude
- WHEN the map renders
- THEN a marker appears at the park's coordinates

#### Scenario: Park without coordinates

- GIVEN the park data has no latitude or longitude
- WHEN the map renders
- THEN no marker is rendered for that park

### Requirement: Marker Clustering

The system MUST cluster park markers when the zoom level causes markers to overlap. Clustered markers MUST display the count of parks in that cluster.

#### Scenario: Overlapping markers cluster

- GIVEN multiple parks in close proximity
- WHEN the map zoom level causes overlap
- THEN markers group into a single cluster icon
- AND the cluster shows the park count

#### Scenario: Zoom in expands cluster

- GIVEN a cluster is visible on the map
- WHEN the user zooms in past the cluster threshold
- THEN the cluster splits into individual markers or smaller clusters

### Requirement: Marker Data Source

The system MUST receive park coordinate data from the application layer and inject it into the LeafletMap WebView.

#### Scenario: Data bridge from app to map

- GIVEN the discovery screen has loaded park data with coordinates
- WHEN the map viewport renders
- THEN park coordinates are passed to the map WebView
- AND markers are rendered accordingly

#### Scenario: Empty data set handled gracefully

- GIVEN no parks have coordinates
- WHEN the map renders
- THEN no markers or clusters are shown
- AND the map displays without error
