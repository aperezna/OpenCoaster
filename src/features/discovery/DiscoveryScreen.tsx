import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  AppState,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { LeafletMap } from './LeafletMap';
import { DEFAULT_REGION } from '../../config/constants';
import { useSearchParks } from './useSearchParks';
import { useSearchHistory } from './useSearchHistory';
import { ExpoLocationService } from '../../data/location/ExpoLocationService';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import ErrorState from '../../components/ErrorState';
import { OPENCOASTER_KEY_PREFIX } from '../../data/cache/queryClient';
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
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [searchQuery, setSearchQuery] = useState<ParkSearchQuery>({});
  const [showResults, setShowResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const { queries: searchHistory, add: addToHistory, clear: clearHistory } = useSearchHistory();
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
  const queryClient = useQueryClient();

  // Stale-data pill
  const [staleAgeMinutes, setStaleAgeMinutes] = useState<number | null>(null);
  const staleKey = [...OPENCOASTER_KEY_PREFIX, 'searchParks', searchQuery];

  const computeStaleAge = useCallback(() => {
    const state = queryClient.getQueryState(staleKey);
    if (!state?.dataUpdatedAt) {
      setStaleAgeMinutes(null);
      return;
    }
    const ageMs = Date.now() - state.dataUpdatedAt;
    if (ageMs > 30_000) {
      setStaleAgeMinutes(Math.floor(ageMs / 60_000));
    } else {
      setStaleAgeMinutes(null);
    }
  }, [queryClient, staleKey]);

  useEffect(() => {
    computeStaleAge();
  }, [computeStaleAge, parks]);

  // Recompute stale age when app returns to foreground
  useEffect(() => {
    if (typeof AppState?.addEventListener !== 'function') {
      return;
    }
    const subscription = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'active') {
        computeStaleAge();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [computeStaleAge]);

  const handleNameChange = useCallback((text: string) => {
    setSearchQuery((prev) => ({ ...prev, name: text }));
    setShowResults(text.length > 0);
  }, []);

  const handleSubmitEditing = useCallback(() => {
    const text = searchQuery.name ?? '';
    if (text.trim().length > 0) {
      addToHistory(text.trim());
    }
  }, [searchQuery.name, addToHistory]);

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
        detailButtonLabel={t('map.seeMore')}
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
              {t(proximityEnabled ? 'discovery.allOver' : 'discovery.nearMe')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stale-data pill */}
      {staleAgeMinutes !== null && (
        <View testID="stale-data-pill" style={styles.stalePill}>
          <Text style={styles.stalePillText}>
            {t('discovery.staleData', { minutes: staleAgeMinutes })}
          </Text>
        </View>
      )}

      {/* Floating search bar */}
      <View testID="search-bar" style={styles.searchContainer}>
        <TextInput
          testID="search-name-input"
          style={styles.searchInput}
          placeholder={t('common.searchPlaceholder')}
          placeholderTextColor="#999"
          value={searchQuery.name ?? ''}
          onChangeText={handleNameChange}
          onSubmitEditing={handleSubmitEditing}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
      </View>

      {/* Search history list */}
      {isSearchFocused && searchHistory.length > 0 && !showResults && (
        <View testID="search-history-list" style={styles.historyContainer}>
          <FlatList
            data={searchHistory}
            keyExtractor={(item, index) => `history-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={`search-history-item-${item.replace(/\s+/g, '-')}`}
                style={styles.historyItem}
                onPress={() => {
                  setSearchQuery((prev) => ({ ...prev, name: item }));
                  setShowResults(true);
                }}
              >
                <Text style={styles.historyItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            testID="clear-history-button"
            style={styles.clearHistoryButton}
            onPress={() => {
              clearHistory();
            }}
          >
            <Text style={styles.clearHistoryText}>{t('common.clearHistory')}</Text>
          </TouchableOpacity>
        </View>
      )}

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
          <Text style={styles.emptyText}>{t('common.noParksFound')}</Text>
        </View>
      )}

      {error && (
        <View testID="discovery-error-overlay" style={styles.errorOverlay}>
          <ErrorState
            message={t('common.connectionError')}
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
    stalePill: {
      position: 'absolute',
      top: 52,
      alignSelf: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#ddd',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      zIndex: 10,
    },
    stalePillText: {
      fontSize: 12,
      color: '#888',
      fontWeight: '500',
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
    historyContainer: {
      position: 'absolute',
      top: 60,
      left: 12,
      right: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      maxHeight: 200,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      paddingVertical: 4,
    },
    historyItem: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyItemText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    clearHistoryButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignItems: 'center',
    },
    clearHistoryText: {
      fontSize: 13,
      color: colors.textTertiary,
      fontWeight: '500',
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
