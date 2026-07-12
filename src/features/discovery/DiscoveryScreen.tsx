import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { LeafletMap } from './LeafletMap';
import { DEFAULT_REGION } from '../../config/constants';
import { useSearchParks } from './useSearchParks';
import { ExpoLocationService } from '../../data/location/ExpoLocationService';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import ErrorState from '../../components/ErrorState';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { LocationService, Coords } from '../../data/location/LocationService';
import type { ParkSearchQuery } from '../../data/providers/ParkDiscoveryProvider';
import type { ParkSummary } from '../../data/models/ParkSummary';
import type { RootTabParamList } from '../../navigation/RootNavigator';
import type { ThemeColors } from '../../theme/colors';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [searchQuery, setSearchQuery] = useState<ParkSearchQuery>({});
  const [showResults, setShowResults] = useState(false);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
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
          // No auto-proximity filter — show ALL parks by default
        }
      })
      .catch(() => {
        // Location error — no crash, parks load globally
      });
  }, [locationService]);

  // Sync proximityEnabled state into the search query
  useEffect(() => {
    setSearchQuery((prev) => {
      if (proximityEnabled && userCoords) {
        return {
          ...prev,
          proximity: {
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
            radiusKm: 100,
          },
        };
      }
      // Remove proximity filter but keep other query params
      const { proximity: _p, ...rest } = prev;
      return rest;
    });
  }, [proximityEnabled, userCoords]);

  const handleToggleProximity = useCallback(() => {
    setProximityEnabled((prev) => !prev);
  }, []);

  const { parks, error, refetch } = useSearchParks(searchQuery, provider);

  const handleNameChange = useCallback((text: string) => {
    setSearchQuery((prev) => ({ ...prev, name: text }));
    setShowResults(text.length > 0);
  }, []);

  const handleSelectPark = useCallback(
    (parkId: string) => {
      setShowResults(false);
      setSearchQuery({});
      navigation.navigate('Parques', {
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

      {/* Proximity toggle */}
      {userCoords && (
        <View testID="proximity-toggle" style={styles.proximityToggle}>
          <TouchableOpacity
            testID="proximity-toggle-button"
            style={[
              styles.proximityToggleButton,
              proximityEnabled && styles.proximityToggleButtonActive,
            ]}
            onPress={handleToggleProximity}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.proximityToggleText,
                proximityEnabled && styles.proximityToggleTextActive,
              ]}
            >
              {proximityEnabled ? 'Todo el mundo' : 'Cerca de mí'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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

      {error && (
        <View testID="discovery-error-overlay" style={styles.errorOverlay}>
          <ErrorState
            message="No se pudieron cargar los parques. Verifica tu conexión."
            onRetry={() => refetch()}
            testID="discovery-error"
          />
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    map: {
      width: '100%',
      height: '100%',
    },
    proximityToggle: {
      position: 'absolute',
      top: 8,
      right: 12,
      zIndex: 10,
    },
    proximityToggleButton: {
      backgroundColor: 'rgba(255,255,255,0.95)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#ddd',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    proximityToggleButtonActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    proximityToggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#333',
    },
    proximityToggleTextActive: {
      color: '#fff',
    },
    searchContainer: {
      position: 'absolute',
      top: 8,
      left: 12,
      right: 100,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingVertical: 12,
      fontSize: 16,
      shadowColor: colors.cardShadow,
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
      backgroundColor: colors.surface,
      borderRadius: 12,
      maxHeight: 250,
      shadowColor: colors.cardShadow,
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
      borderBottomColor: colors.border,
    },
    resultName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    resultSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textTertiary,
      padding: 16,
      textAlign: 'center',
    },
    errorOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
      zIndex: 100,
    },
  });
}
