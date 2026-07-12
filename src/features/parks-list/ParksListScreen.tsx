import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSearchParks } from '../discovery/useSearchParks';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import { ParkResultList } from '../discovery/ParkResultList';
import { ParksListSkeleton } from '../../components/Skeleton';
import type { ParquesStackParamList } from '../../navigation/ParquesStackNavigator';

export function ParksListScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<ParquesStackParamList>>();
  const provider = useParkDiscoveryProvider();

  // Search state with debounce
  const [searchText, setSearchText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');

  // Track whether data has ever been loaded — prevents skeleton on re-fetch
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { parks, isLoading } = useSearchParks(
    debouncedText ? { name: debouncedText } : {},
    provider,
  );

  useEffect(() => {
    if (parks && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [parks, hasLoadedOnce]);

  const handleParkPress = (parkId: string) => {
    navigation.navigate('ParkDetail', { parkId });
  };

  if (isLoading && !hasLoadedOnce) {
    return (
      <View style={styles.container} testID="parks-list-screen">
        <ParksListSkeleton />
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
      <ParkResultList parks={parks ?? []} onParkPress={handleParkPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    margin: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
