import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LeafletMap } from './LeafletMap';
import { DEFAULT_REGION } from '../../config/constants';
import { useSearchParks } from './useSearchParks';
import { ExpoLocationService } from '../../data/location/ExpoLocationService';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import type { NavigationProp } from '@react-navigation/native';
import type { LocationService, Coords } from '../../data/location/LocationService';
import type { ParkSearchQuery } from '../../data/providers/ParkDiscoveryProvider';
import type { ParkSummary } from '../../data/models/ParkSummary';
import type { RootTabParamList } from '../../navigation/RootNavigator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Earth radius in km for Haversine distance */
const EARTH_RADIUS_KM = 6371;

/**
 * Compute the great-circle distance in km between two coordinates using the
 * Haversine formula.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format distance in km or m for display */
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DiscoveryScreenProps {
  locationService?: LocationService;
  onParkSelect?: (parkId: string) => void;
}

const defaultLocationService = new ExpoLocationService();

export function DiscoveryScreen({
  locationService = defaultLocationService,
  onParkSelect,
}: DiscoveryScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState<ParkSearchQuery>({});
  const [showResults, setShowResults] = useState(false);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const provider = useParkDiscoveryProvider();

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
          setUserCoords(coords);
          // Once we have the user's location, auto-filter parks within 50 km
          setSearchQuery((prev) => ({
            ...prev,
            proximity: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              radiusKm: 50,
            },
          }));
        }
      })
      .catch(() => {
        // Location error — no crash, parks filter globally
      });
  }, [locationService]);

  const { parks } = useSearchParks(searchQuery, provider);

  const handleNameChange = useCallback((text: string) => {
    setSearchQuery((prev) => ({ ...prev, name: text }));
    setShowResults(text.length > 0);
  }, []);

  const handleSelectPark = useCallback(
    (parkId: string) => {
      setShowResults(false);
      setSearchQuery({});
      (navigation.navigate as unknown as (name: string, params: unknown) => void)('Parques', {
        screen: 'ParkDetail',
        params: { parkId },
      });
      onParkSelect?.(parkId);
    },
    [navigation, onParkSelect],
  );

  return (
    <View testID="discovery-screen" style={styles.container}>
      <LeafletMap
        testID="discovery-map"
        initialRegion={DEFAULT_REGION}
        markers={parks ?? []}
        onMarkerPress={handleSelectPark}
        userLocation={userCoords}
      />

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
            renderItem={({ item }: { item: ParkSummary }) => {
              // Compute distance from user location when available
              let subtitle = item.timezone || '';
              if (userCoords) {
                const dist = haversineKm(
                  userCoords.latitude,
                  userCoords.longitude,
                  item.latitude,
                  item.longitude,
                );
                subtitle = `${formatDistance(dist)}`;
                if (item.timezone) {
                  subtitle += ` · ${item.timezone.replace('_', ' ').split('/').pop()}`;
                }
              }
              return (
                <TouchableOpacity
                  testID={`search-result-${item.id}`}
                  style={styles.resultItem}
                  onPress={() => handleSelectPark(item.id)}
                >
                  <Text style={styles.resultName}>{item.name}</Text>
                  {subtitle ? <Text style={styles.resultSubtitle}>{subtitle}</Text> : null}
                </TouchableOpacity>
              );
            }}
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
  resultSubtitle: {
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
