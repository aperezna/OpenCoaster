import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import { DEFAULT_REGION } from '../../config/constants';
import { useSearchParks } from './useSearchParks';
import { ExpoLocationService } from '../../data/location/ExpoLocationService';
import { FixtureParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProvider';
import type { LocationService, Coords } from '../../data/location/LocationService';
import type { ParkDiscoveryProvider, ParkSearchQuery } from '../../data/providers/ParkDiscoveryProvider';
import type { ParkSummary } from '../../data/models/ParkSummary';

interface DiscoveryScreenProps {
  locationService?: LocationService;
  parkDiscoveryProvider?: ParkDiscoveryProvider;
  onParkSelect?: (parkId: string) => void;
}

const defaultLocationService = new ExpoLocationService();
const defaultParkProvider = new FixtureParkDiscoveryProvider();

export function DiscoveryScreen({
  locationService = defaultLocationService,
  parkDiscoveryProvider = defaultParkProvider,
  onParkSelect,
}: DiscoveryScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState<ParkSearchQuery>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    locationService
      .requestPermission()
      .then((status) => {
        if (status === 'granted') {
          return locationService.getCurrentPosition();
        }
        return null;
      })
      .then((coords: Coords | null) => {
        if (coords) {
          // Location obtained
        }
      })
      .catch(() => {
        // Location error — no crash
      });
  }, [locationService]);

  const { parks } = useSearchParks(searchQuery, parkDiscoveryProvider);

  const handleNameChange = useCallback((text: string) => {
    setSearchQuery((prev) => ({ ...prev, name: text }));
    setShowResults(text.length > 0);
  }, []);

  const handleSelectPark = useCallback(
    (parkId: string) => {
      setShowResults(false);
      setSearchQuery({});
      onParkSelect?.(parkId);
    },
    [onParkSelect],
  );

  return (
    <View testID="discovery-screen" style={styles.container}>
      <MapView
        testID="discovery-map"
        style={styles.map}
        initialRegion={DEFAULT_REGION}
      >
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {parks?.map((park) => (
          <Marker
            key={park.id}
            testID={`marker-${park.id}`}
            coordinate={{
              latitude: park.latitude,
              longitude: park.longitude,
            }}
            title={park.name}
            onPress={() => handleSelectPark(park.id)}
          />
        ))}
      </MapView>

      {/* Floating search bar */}
      <View testID="search-bar" style={styles.searchContainer}>
        <TextInput
          testID="search-name-input"
          style={styles.searchInput}
          placeholder="Buscar parques..."
          placeholderTextColor="#999"
          value={searchQuery.name ?? ''}
          onChangeText={handleNameChange}
        />
      </View>

      {/* Search results dropdown */}
      {showResults && parks && parks.length > 0 && (
        <View testID="search-results" style={styles.resultsContainer}>
          <FlatList
            data={parks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: ParkSummary }) => (
              <TouchableOpacity
                testID={`search-result-${item.id}`}
                style={styles.resultItem}
                onPress={() => handleSelectPark(item.id)}
              >
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultCity}>
                  {item.city}, {item.country}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {showResults && parks && parks.length === 0 && (
        <View testID="search-results-empty" style={styles.resultsContainer}>
          <Text style={styles.emptyText}>No parks found</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  resultsContainer: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingVertical: 4,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  resultCity: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    padding: 16,
    textAlign: 'center',
  },
});
