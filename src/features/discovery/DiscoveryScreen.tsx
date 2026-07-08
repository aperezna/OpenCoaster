import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';
import { DEFAULT_REGION } from '../../config/constants';
import { SearchBar } from './SearchBar';
import { ParkResultList } from './ParkResultList';
import { useSearchParks } from './useSearchParks';
import type { LocationService, Coords } from '../../data/location/LocationService';
import type { ParkDiscoveryProvider, ParkSearchQuery } from '../../data/providers/ParkDiscoveryProvider';

interface DiscoveryScreenProps {
  locationService: LocationService;
  parkDiscoveryProvider: ParkDiscoveryProvider;
}

export function DiscoveryScreen({
  locationService,
  parkDiscoveryProvider,
}: DiscoveryScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState<ParkSearchQuery>({});

  // Handle location on mount
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
          // Location obtained — marker rendering deferred to future
        }
      })
      .catch(() => {
        // Location error — no crash, search still works
      });
  }, [locationService]);

  const { parks } = useSearchParks(searchQuery, parkDiscoveryProvider);

  const handleNameChange = useCallback((name: string) => {
    setSearchQuery((prev) => ({ ...prev, name }));
  }, []);

  const handleCityChange = useCallback((city: string) => {
    setSearchQuery((prev) => ({ ...prev, city }));
  }, []);

  return (
    <View testID="discovery-screen" style={styles.container}>
      <MapView
        testID="discovery-map"
        initialRegion={DEFAULT_REGION}
      >
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapView>
      <SearchBar
        name={searchQuery.name ?? ''}
        city={searchQuery.city ?? ''}
        onNameChange={handleNameChange}
        onCityChange={handleCityChange}
      />
      <ParkResultList
        parks={parks ?? []}
        onParkPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
