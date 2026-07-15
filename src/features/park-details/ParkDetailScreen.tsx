import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import { useParkDetail } from './useParkDetail';
import { useFavorites } from '../favorites/useFavorites';
import { useItineraries } from '../visit-planner/useItineraries';
import { ItineraryPickerModal } from '../visit-planner/ItineraryPickerModal';
import { WeatherCard } from './WeatherCard';
import { HoursCard } from './HoursCard';
import { AttractionList } from './AttractionList';
import { BusyMeter } from './BusyMeter';
import { calculateBusyLevel } from './calculateBusyLevel';
import { ThresholdModal } from '../notifications/ThresholdModal';
import { useNotificationPreferences } from '../notifications/useNotificationPreferences';
import {
  ParkDetailSkeleton,
  WeatherCardSkeleton,
  HoursCardSkeleton,
  AttractionListSkeleton,
} from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import type { RouteProp } from '@react-navigation/native';
import type { ParquesStackParamList } from '../../navigation/ParquesStackNavigator';
import type { Attraction } from '../../data/models/Attraction';

const DEFAULT_PARK_ID = '75ea578a-adc8-4116-a54d-dccb60765ef9'; // Magic Kingdom Park

export function ParkDetailScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const route = useRoute<RouteProp<ParquesStackParamList, 'ParkDetail'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<ParquesStackParamList, 'ParkDetail'>>();
  const parkId = route.params?.parkId ?? DEFAULT_PARK_ID;
  const provider = useParkDiscoveryProvider();
  const { isFavorite, toggleFavorite } = useFavorites();
  const {
    itineraries,
    isLoading: _itinerariesLoading,
    addAttraction,
    isAttractionInItinerary,
  } = useItineraries();

  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);

  const {
    park,
    weather,
    hours,
    attractions,
    isLoading: _isLoading,
    isParkLoading,
    isWeatherLoading,
    isHoursLoading,
    isAttractionsLoading,
    isFetching,
    error,
    weatherError,
    hoursError,
    attractionsError,
    refetchAll,
  } = useParkDetail(parkId, provider);

  const busyMeterResult = useMemo(
    () => (attractions ? calculateBusyLevel(attractions, new Date()) : null),
    [attractions],
  );

  const {
    preferences,
    setThreshold,
    removeThreshold,
    getMonitored,
    isLoading: _notifPrefsLoading,
  } = useNotificationPreferences();
  const [thresholdAttraction, setThresholdAttraction] = useState<Attraction | null>(null);
  const monitoredIds = useMemo(
    () => new Set(getMonitored().map((m) => m.attractionId)),
    [getMonitored, preferences],
  );

  const handleDirections = useCallback(() => {
    if (park) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`;
      Linking.openURL(url);
    }
  }, [park]);

  const handleShare = useCallback(() => {
    if (!park) {
      return;
    }
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`;
    const title =
      park.city && park.country
        ? t('parkDetail.shareTitle', {
            parkName: park.name,
            city: park.city,
            country: park.country,
          })
        : t('parkDetail.shareTitleNoLocation', { parkName: park.name });
    const message = `${title}\n\n${mapsUrl}`;
    Share.share({ message }).catch(() => {
      // User cancelled — noop
    });
  }, [park, t]);

  const handleRefresh = useCallback(() => {
    refetchAll();
  }, [refetchAll]);

  const handlePlanVisit = useCallback(() => {
    navigation.navigate('VisitPlanner', { parkId, parkName: park?.name });
  }, [navigation, parkId, park?.name]);

  const handleAddToItinerary = useCallback(
    (attraction: Attraction) => {
      if (itineraries.length === 0) {
        // No itineraries exist → navigate to create itinerary flow
        navigation.navigate('VisitPlanner', { parkId, parkName: park?.name });
      } else {
        // Show picker modal
        setSelectedAttraction(attraction);
      }
    },
    [itineraries.length, navigation, parkId, park?.name],
  );

  const handlePickerSelect = useCallback(
    (itinerary: { id: string }) => {
      if (selectedAttraction) {
        addAttraction(itinerary.id, {
          id: selectedAttraction.id,
          name: selectedAttraction.name,
        });
      }
      setSelectedAttraction(null);
    },
    [selectedAttraction, addAttraction],
  );

  const handlePickerCreateNew = useCallback(() => {
    setSelectedAttraction(null);
    navigation.navigate('VisitPlanner', { parkId, parkName: park?.name });
  }, [navigation, parkId, park?.name]);

  const handlePickerClose = useCallback(() => {
    setSelectedAttraction(null);
  }, []);

  const handleAttractionLongPress = useCallback((attraction: Attraction) => {
    setThresholdAttraction(attraction);
  }, []);

  const handleThresholdConfirm = useCallback(
    (thresholdMin: number) => {
      if (thresholdAttraction) {
        setThreshold(
          thresholdAttraction.parkId,
          thresholdAttraction.id,
          thresholdAttraction.name,
          thresholdMin,
        )
          .then((permissionStatus) => {
            if (permissionStatus === 'denied') {
              Alert.alert(t('notifications.permissionDenied'), '', [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('notifications.openSettings'),
                  onPress: () => {
                    Linking.openURL('app-settings:').catch(() => {
                      // OS settings deep-link unavailable — noop
                    });
                  },
                },
              ]);
            }
          })
          .catch(() => {
            // AsyncStorage write failure — non-fatal, modal just re-closes
          });
      }
      setThresholdAttraction(null);
    },
    [thresholdAttraction, setThreshold, t],
  );

  const handleThresholdCancel = useCallback(() => {
    setThresholdAttraction(null);
  }, []);

  const renderUnavailableSection = useCallback(
    (titleKey: string, testID: string) => (
      <View testID={testID} style={styles.unavailableCard}>
        <Text style={styles.unavailableTitle}>{t(titleKey)}</Text>
        <Text style={styles.unavailableMessage}>{t('parkDetail.sectionUnavailable')}</Text>
      </View>
    ),
    [styles, t],
  );

  if (error && !park) {
    return (
      <View testID="park-detail-screen" style={styles.container}>
        <ErrorState message={t('parkDetail.loadError')} onRetry={handleRefresh} />
      </View>
    );
  }

  if (isParkLoading) {
    return (
      <View testID="park-detail-screen" style={styles.container}>
        <ParkDetailSkeleton />
      </View>
    );
  }

  if (!park) {
    return (
      <View testID="park-detail-screen" style={styles.container}>
        <ErrorState message={t('parkDetail.notFound')} />
      </View>
    );
  }

  return (
    <ScrollView
      testID="park-detail-screen"
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />}
    >
      {/* Photo header */}
      {park.photoUrl ? (
        <Image testID="park-photo" source={{ uri: park.photoUrl }} style={styles.photo} />
      ) : (
        <View testID="park-photo-placeholder" style={styles.photoPlaceholder}>
          <Text style={styles.placeholderText}>{t('parkDetail.noPhoto')}</Text>
        </View>
      )}

      {/* Park info */}
      <View style={styles.infoSection}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{park.name}</Text>
          <View style={styles.titleActions}>
            <TouchableOpacity
              testID="share-button"
              onPress={handleShare}
              style={styles.shareButton}
            >
              <Text style={styles.shareIcon}>↗</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="favorite-toggle"
              onPress={() => toggleFavorite(parkId, park.name)}
              style={styles.favoriteButton}
            >
              <Text
                testID={isFavorite(parkId) ? 'favorite-toggle-filled' : 'favorite-toggle-outline'}
                style={styles.favoriteIcon}
              >
                {isFavorite(parkId) ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.location}>
          {park.city}, {park.country}
        </Text>

        {park.address ? <Text style={styles.address}>{park.address}</Text> : null}

        {park.phone ? <Text style={styles.phone}>{park.phone}</Text> : null}

        {/* Directions button */}
        <TouchableOpacity
          testID="directions-button"
          style={styles.directionsButton}
          onPress={handleDirections}
        >
          <Text style={styles.directionsText}>{t('parkDetail.directions')}</Text>
        </TouchableOpacity>

        {/* Plan visit CTA */}
        <TouchableOpacity
          testID="plan-visit-button"
          style={styles.planVisitButton}
          onPress={handlePlanVisit}
          activeOpacity={0.7}
        >
          <Text style={styles.planVisitText}>{t('parkDetail.planVisit')}</Text>
        </TouchableOpacity>
      </View>

      {/* Busy meter */}
      {busyMeterResult && (
        <View style={styles.busyMeterContainer}>
          <BusyMeter result={busyMeterResult} />
        </View>
      )}

      {/* Weather + Hours cards row with individual loading */}
      <View style={styles.cardsRow}>
        {weather ? (
          <WeatherCard weather={weather} />
        ) : isWeatherLoading ? (
          <WeatherCardSkeleton />
        ) : weatherError ? (
          renderUnavailableSection('weather.title', 'weather-error-card')
        ) : null}
        {hours ? (
          <HoursCard hours={hours} />
        ) : isHoursLoading ? (
          <HoursCardSkeleton />
        ) : hoursError ? (
          renderUnavailableSection('hours.title', 'hours-error-card')
        ) : null}
      </View>

      {/* Attractions with individual loading */}
      {attractions ? (
        <AttractionList
          attractions={attractions}
          onAddToItinerary={handleAddToItinerary}
          isAttractionAdded={isAttractionInItinerary}
          onLongPress={handleAttractionLongPress}
          monitoredIds={monitoredIds}
        />
      ) : isAttractionsLoading ? (
        <AttractionListSkeleton />
      ) : attractionsError ? (
        <View testID="attractions-error-state" style={styles.attractionsUnavailableContainer}>
          <Text style={styles.attractionsUnavailableTitle}>{t('attractions.title')}</Text>
          <Text style={styles.unavailableMessage}>{t('parkDetail.sectionUnavailable')}</Text>
        </View>
      ) : null}

      {/* Itinerary picker modal */}
      <ItineraryPickerModal
        visible={selectedAttraction !== null}
        itineraries={itineraries}
        onSelect={handlePickerSelect}
        onCreateNew={handlePickerCreateNew}
        onClose={handlePickerClose}
      />

      {/* Threshold setting modal */}
      {thresholdAttraction && (
        <ThresholdModal
          visible={thresholdAttraction !== null}
          attractionName={thresholdAttraction.name}
          onConfirm={handleThresholdConfirm}
          onCancel={handleThresholdCancel}
        />
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingBottom: 32,
    },
    container: {
      flex: 1,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    photo: {
      width: '100%',
      height: 220,
      resizeMode: 'cover',
    },
    photoPlaceholder: {
      width: '100%',
      height: 220,
      backgroundColor: colors.skeleton,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textTertiary,
    },
    infoSection: {
      padding: 16,
      backgroundColor: colors.surface,
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    name: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
      flex: 1,
    },
    titleActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    shareButton: {
      padding: 4,
      marginRight: 4,
    },
    shareIcon: {
      fontSize: 24,
      color: colors.textSecondary,
    },
    favoriteButton: {
      padding: 4,
      marginLeft: 4,
    },
    favoriteIcon: {
      fontSize: 28,
    },
    location: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    address: {
      fontSize: 14,
      color: colors.textTertiary,
      marginBottom: 4,
    },
    phone: {
      fontSize: 14,
      color: colors.textTertiary,
      marginBottom: 12,
    },
    directionsButton: {
      backgroundColor: colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
    directionsText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    planVisitButton: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    planVisitText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    busyMeterContainer: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    cardsRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    unavailableCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 120,
      justifyContent: 'center',
    },
    unavailableTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    unavailableMessage: {
      fontSize: 14,
      color: colors.textTertiary,
      lineHeight: 20,
    },
    attractionsUnavailableContainer: {
      marginTop: 16,
      marginHorizontal: 16,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    attractionsUnavailableTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
  });
}
