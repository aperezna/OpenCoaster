import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSearchParks } from '../discovery/useSearchParks';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import type { ParkSearchQuery } from '../../data/providers/ParkDiscoveryProvider';
import { ParkResultList } from '../discovery/ParkResultList';
import { ParksListSkeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import type { ParquesStackParamList } from '../../navigation/ParquesStackNavigator';
import type { ThemeColors } from '../../theme/colors';

export function ParksListScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<ParquesStackParamList>>();
  const provider = useParkDiscoveryProvider();

  // Search state with debounce
  const [searchText, setSearchText] = useState('');
  const [cityText, setCityText] = useState('');
  const [countryText, setCountryText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState<ParkSearchQuery>({});

  // Track whether data has ever been loaded — prevents skeleton on re-fetch
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q: ParkSearchQuery = {};
      if (searchText) q.name = searchText;
      if (cityText) q.city = cityText;
      if (countryText) q.country = countryText;
      setDebouncedQuery(q);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, cityText, countryText]);

  const { parks, isLoading, isFetching, error, refetch } = useSearchParks(debouncedQuery, provider);

  useEffect(() => {
    if (parks && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [parks, hasLoadedOnce]);

  const handleParkPress = useCallback(
    (parkId: string) => {
      navigation.navigate('ParkDetail', { parkId });
    },
    [navigation],
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading && !hasLoadedOnce) {
    return (
      <View style={styles.container} testID="parks-list-screen">
        <ParksListSkeleton />
      </View>
    );
  }

  if (error && !parks) {
    return (
      <View style={styles.container} testID="parks-list-screen">
        <TextInput
          testID="park-search-input"
          style={styles.searchInput}
          placeholder="Buscar parques..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TextInput
          testID="park-city-input"
          style={styles.searchInput}
          placeholder="Ciudad..."
          value={cityText}
          onChangeText={setCityText}
        />
        <TextInput
          testID="park-country-input"
          style={styles.searchInput}
          placeholder="País..."
          value={countryText}
          onChangeText={setCountryText}
        />
        <ErrorState
          message="No se pudieron cargar los parques. Revisá tu conexión."
          onRetry={handleRefresh}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="parks-list-screen">
      <TextInput
        testID="park-search-input"
        style={styles.searchInput}
        placeholder="Buscar parques..."
        value={searchText}
        onChangeText={setSearchText}
      />
      <TextInput
        testID="park-city-input"
        style={styles.searchInput}
        placeholder="Ciudad..."
        value={cityText}
        onChangeText={setCityText}
      />
      <TextInput
        testID="park-country-input"
        style={styles.searchInput}
        placeholder="País..."
        value={countryText}
        onChangeText={setCountryText}
      />
      <ParkResultList
        parks={parks ?? []}
        onParkPress={handleParkPress}
        refreshing={isFetching}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchInput: {
      margin: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderRadius: 8,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
