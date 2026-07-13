import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import { useFavorites } from '../favorites/useFavorites';
import { useItineraries } from '../visit-planner/useItineraries';
import { ProfileSkeleton } from '../../components/Skeleton';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../i18n/useLanguage';
import type { UserProfile } from '../../data/models/UserProfile';
import type { FavoritePark } from '../../data/models/FavoritePark';
import type { Itinerary } from '../../data/models/Itinerary';
import type { ThemeColors } from '../../theme/colors';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../../navigation/RootNavigator';

const ONBOARDING_KEY = 'opencoaster:hasSeenOnboarding';

type ProfileNavProp = BottomTabNavigationProp<RootTabParamList>;

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' as const },
  { label: 'Español', value: 'es' as const },
];

export function ProfileScreen(): React.JSX.Element {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const provider = useParkDiscoveryProvider();
  const { favorites, clearFavorites } = useFavorites();
  const { itineraries } = useItineraries();
  const navigation = useNavigation<ProfileNavProp>();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    provider.getUserProfile().then(setProfile);
  }, [provider]);

  const handleFavoritePress = useCallback(
    (item: FavoritePark) => {
      navigation.navigate('Parques', {
        screen: 'ParkDetail',
        params: { parkId: item.parkId },
      });
    },
    [navigation],
  );

  const handleItineraryPress = useCallback(
    (itinerary: Itinerary) => {
      navigation.navigate('Parques', {
        screen: 'ItineraryDetail',
        params: { itineraryId: itinerary.id },
      });
    },
    [navigation],
  );

  const handleLogout = useCallback(async () => {
    await clearFavorites();
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    navigation.reset({ index: 0, routes: [{ name: 'Mapa' }] });
  }, [clearFavorites, navigation]);

  if (!profile) {
    return (
      <View testID="profile-screen" style={styles.container}>
        <ProfileSkeleton />
      </View>
    );
  }

  return (
    <View testID="profile-screen" style={styles.container}>
      <View testID="profile-avatar" style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{profile.username.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      <Text testID="profile-username" style={styles.username}>
        {profile.username}
      </Text>
      <Text testID="profile-email" style={styles.email}>
        {profile.email}
      </Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('profile.memberSince')}</Text>
        <Text testID="profile-member-since" style={styles.infoValue}>
          {profile.memberSince}
        </Text>
      </View>

      {/* Favorites section */}
      <View style={styles.favoritesSection}>
        <Text style={styles.favoritesTitle}>{t('profile.favorites')}</Text>
        {favorites.length === 0 ? (
          <Text style={styles.emptyFavorites}>{t('profile.noFavorites')}</Text>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.parkId}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={`favorite-item-${item.parkId}`}
                style={styles.favoriteItem}
                onPress={() => handleFavoritePress(item)}
              >
                <Text style={styles.favoriteParkName}>{item.parkName}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* My Itineraries section */}
      <View style={styles.itinerariesSection}>
        <Text style={styles.itinerariesTitle}>{t('profile.itineraries')}</Text>
        {itineraries.length === 0 ? (
          <Text style={styles.emptyItineraries}>{t('profile.noItineraries')}</Text>
        ) : (
          <FlatList
            data={itineraries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={`itinerary-item-${item.id}`}
                style={styles.itineraryItem}
                onPress={() => handleItineraryPress(item)}
              >
                <Text style={styles.itineraryParkName}>{item.parkName}</Text>
                <Text style={styles.itineraryMeta}>
                  {item.date ?? 'Date TBD'} · {item.items.length} attraction
                  {item.items.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Settings / Preferences section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>{t('profile.preferences')}</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('profile.darkMode')}</Text>
          <Switch
            testID="dark-mode-toggle"
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.textTertiary, true: colors.accent }}
          />
        </View>

        <TouchableOpacity
          testID="language-picker-row"
          style={styles.settingRow}
          onPress={() => setShowLangPicker(true)}
        >
          <Text style={styles.settingLabel}>{t('profile.language')}</Text>
          <Text testID="setting-language-value" style={styles.settingValue}>
            {language === 'en' ? 'English' : 'Español'}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showLangPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLangPicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowLangPicker(false)}>
            <View style={styles.modalContent}>
              {LANGUAGE_OPTIONS.map((option) => {
                const isSelected = language === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    testID={`lang-option-${option.value}`}
                    style={[styles.langOption, isSelected && styles.langOptionSelected]}
                    onPress={() => {
                      setLanguage(option.value);
                      setShowLangPicker(false);
                    }}
                  >
                    <Text
                      style={[styles.langOptionText, isSelected && styles.langOptionTextSelected]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      </View>

      <TouchableOpacity testID="logout-button" style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 24,
      backgroundColor: colors.background,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#fff',
    },
    username: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 16,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    favoritesSection: {
      width: '100%',
      marginTop: 24,
      paddingHorizontal: 16,
    },
    favoritesTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    emptyFavorites: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingVertical: 20,
    },
    favoriteItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    favoriteParkName: {
      fontSize: 16,
      color: colors.accent,
    },
    settingsSection: {
      width: '100%',
      marginTop: 24,
      paddingHorizontal: 16,
    },
    settingsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
    },
    settingValue: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    itinerariesSection: {
      width: '100%',
      marginTop: 24,
      paddingHorizontal: 16,
    },
    itinerariesTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    emptyItineraries: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingVertical: 20,
    },
    itineraryItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itineraryParkName: {
      fontSize: 16,
      color: colors.accent,
    },
    itineraryMeta: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 8,
      width: 200,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    langOption: {
      paddingVertical: 14,
      paddingHorizontal: 24,
    },
    langOptionText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
    langOptionSelected: {
      backgroundColor: colors.accent + '20',
    },
    langOptionTextSelected: {
      fontWeight: '700',
      color: colors.accent,
    },
    logoutButton: {
      width: '100%',
      paddingVertical: 14,
      backgroundColor: '#F44336',
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });
}
