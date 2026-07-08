import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FixtureParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProvider';
import type { ParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProvider';
import type { ParkSummary } from '../../data/models/ParkSummary';

interface ParkDetailScreenProps {
  route: {
    key: string;
    name: string;
    params: { parkId: string };
  };
  parkDiscoveryProvider?: ParkDiscoveryProvider;
}

const defaultParkProvider = new FixtureParkDiscoveryProvider();

export function ParkDetailScreen({
  route,
  parkDiscoveryProvider = defaultParkProvider,
}: ParkDetailScreenProps): React.JSX.Element {
  const { parkId } = route.params;
  const [park, setPark] = useState<ParkSummary | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    parkDiscoveryProvider
      .searchParks({})
      .then((parks) => {
        const found = parks.find((p) => p.id === parkId);
        setPark(found ?? null);
      })
      .catch(() => {
        setError('Failed to load park details');
      });
  }, [parkId, parkDiscoveryProvider]);

  if (error) {
    return (
      <View testID="park-detail-screen" style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (park === undefined) {
    return (
      <View testID="park-detail-screen" style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (park === null) {
    return (
      <View testID="park-detail-screen" style={styles.container}>
        <Text>Park not found</Text>
      </View>
    );
  }

  return (
    <View testID="park-detail-screen" style={styles.container}>
      {park.photoUrl ? (
        <Image
          testID="park-photo"
          source={{ uri: park.photoUrl }}
          style={styles.photo}
        />
      ) : (
        <View testID="park-photo-placeholder" style={styles.placeholder}>
          <Text>No photo available</Text>
        </View>
      )}
      <Text style={styles.name}>{park.name}</Text>
      <Text style={styles.location}>
        {park.city}, {park.country}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  photo: {
    width: 300,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  placeholder: {
    width: 300,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
});
