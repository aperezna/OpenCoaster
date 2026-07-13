import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSearchParks } from '../discovery/useSearchParks';
import { useSearchHistory } from '../discovery/useSearchHistory';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import type { ParkSearchQuery } from '../../data/providers/ParkDiscoveryProvider';
import { ParkResultList } from '../discovery/ParkResultList';
import { ParksListSkeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import type { ParquesStackParamList } from '../../navigation/ParquesStackNavigator';
import type { ThemeColors } from '../../theme/colors';

export function ParksListScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<ParquesStackParamList>>();
  const provider = useParkDiscoveryProvider();

  // Search state with debounce
  const [searchText, setSearchText] = useState('');
  const [cityText, setCityText] = useState('');
  const [countryText, setCountryText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState<ParkSearchQuery>({});
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Track whether data has ever been loaded — prevents skeleton on re-fetch
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { queries: searchHistory, add, clear: clearHistory } = useSearchHistory();

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

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchText.trim();
    if (trimmed) {
      add(trimmed);
    }
  }, [searchText, add]);

  const showResults = isSearchFocused && searchText.length > 0;
  const showHistory = isSearchFocused && searchHistory.length > 0 && !showResults;

  const renderSearchInputs = () => (
    <>
      <TextInput
        testID="park-search-input"
        style={styles.searchInput}
        placeholder={t('common.searchPlaceholder')}
        value={searchText}
        onChangeText={setSearchText}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        onSubmitEditing={handleSearchSubmit}
      />
      <TextInput
        testID="park-city-input"
        style={styles.searchInput}
        placeholder={t('parkList.city')}
        value={cityText}
        onChangeText={setCityText}
      />
      <TextInput
        testID="park-country-input"
        style={styles.searchInput}
        placeholder={t('parkList.country')}
        value={countryText}
        onChangeText={setCountryText}
      />
    </>
  );

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
        {renderSearchInputs()}
        <ErrorState message={t('parkList.loadError')} onRetry={handleRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="parks-list-screen">
      {renderSearchInputs()}
      {showHistory && (
        <View testID="search-history-list" style={styles.historyContainer}>
          <FlatList
            data={searchHistory}
            keyExtractor={(item, index) => `history-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={`search-history-item-${item.replace(/\s+/g, '-')}`}
                style={styles.historyItem}
                onPress={() => {
                  setSearchText(item);
                  setIsSearchFocused(false);
                }}
              >
                <Text style={styles.historyItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            testID="clear-history-button"
            style={styles.clearHistoryButton}
            onPress={clearHistory}
          >
            <Text style={styles.clearHistoryText}>{t('common.clearHistory')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {!showHistory && (
        <ParkResultList
          parks={parks ?? []}
          onParkPress={handleParkPress}
          refreshing={isFetching}
          onRefresh={handleRefresh}
        />
      )}
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
      marginHorizontal: 12,
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderRadius: 8,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyContainer: {
      flex: 1,
      paddingHorizontal: 12,
    },
    historyItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
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
  });
}
