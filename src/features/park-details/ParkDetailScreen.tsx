import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import { useParkDetail } from './useParkDetail';
import { WeatherCard } from './WeatherCard';
import { HoursCard } from './HoursCard';
import { AttractionList } from './AttractionList';
import type { RouteProp } from '@react-navigation/native';
import type { RootTabParamList } from '../../navigation/RootNavigator';

const DEFAULT_PARK_ID = '75ea578a-adc8-4116-a54d-dccb60765ef9'; // Magic Kingdom Park

export function ParkDetailScreen(): React.JSX.Element {
  const route = useRoute<RouteProp<RootTabParamList, 'Parques'>>();
  const parkId = route.params?.parkId ?? DEFAULT_PARK_ID;
  const provider = useParkDiscoveryProvider();

  const { park, weather, hours, attractions, isLoading, isParkLoading, error } = useParkDetail(
    parkId,
    provider,
  );

  const handleDirections = () => {
    if (park) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`;
      Linking.openURL(url);
    }
  };

  if (error) {
    return (
      <View testID="park-detail-screen" style={styles.container}>
        <Text>{error.message}</Text>
      </View>
    );
  }

  if (isParkLoading) {
    return (
      <View testID="park-detail-screen" style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!park) {
    return (
      <View testID="park-detail-screen" style={styles.container}>
        <Text>Park not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="park-detail-screen"
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Photo header */}
      {park.photoUrl ? (
        <Image
          testID="park-photo"
          source={{ uri: park.photoUrl }}
          style={styles.photo}
        />
      ) : (
        <View testID="park-photo-placeholder" style={styles.photoPlaceholder}>
          <Text style={styles.placeholderText}>No photo available</Text>
        </View>
      )}

      {/* Park info */}
      <View style={styles.infoSection}>
        <Text style={styles.name}>{park.name}</Text>
        <Text style={styles.location}>
          {park.city}, {park.country}
        </Text>

        {park.address ? (
          <Text style={styles.address}>{park.address}</Text>
        ) : null}

        {park.phone ? (
          <Text style={styles.phone}>{park.phone}</Text>
        ) : null}

        {/* Directions button */}
        <TouchableOpacity
          testID="directions-button"
          style={styles.directionsButton}
          onPress={handleDirections}
        >
          <Text style={styles.directionsText}>Cómo llegar</Text>
        </TouchableOpacity>
      </View>

      {/* Weather + Hours cards row */}
      <View style={styles.cardsRow}>
        {weather ? <WeatherCard weather={weather} /> : null}
        {hours ? <HoursCard hours={hours} /> : null}
      </View>

      {/* Attractions */}
      <AttractionList attractions={attractions ?? []} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  photo: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  directionsButton: {
    backgroundColor: '#4A90D9',
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
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
});
