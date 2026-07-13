import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
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
    refetchAll,
  } = useParkDetail(parkId, provider);

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

      {/* Weather + Hours cards row with individual loading */}
      <View style={styles.cardsRow}>
        {weather ? (
          <WeatherCard weather={weather} />
        ) : isWeatherLoading ? (
          <WeatherCardSkeleton />
        ) : null}
        {hours ? <HoursCard hours={hours} /> : isHoursLoading ? <HoursCardSkeleton /> : null}
      </View>

      {/* Attractions with individual loading */}
      {attractions ? (
        <AttractionList
          attractions={attractions}
          onAddToItinerary={handleAddToItinerary}
          isAttractionAdded={isAttractionInItinerary}
        />
      ) : isAttractionsLoading ? (
        <AttractionListSkeleton />
      ) : null}

      {/* Itinerary picker modal */}
      <ItineraryPickerModal
        visible={selectedAttraction !== null}
        itineraries={itineraries}
        onSelect={handlePickerSelect}
        onCreateNew={handlePickerCreateNew}
        onClose={handlePickerClose}
      />
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
    cardsRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      marginBottom: 8,
    },
  });
}
