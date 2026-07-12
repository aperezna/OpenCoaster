import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import { useFavorites } from '../favorites/useFavorites';
import { ProfileSkeleton } from '../../components/Skeleton';
import type { UserProfile } from '../../data/models/UserProfile';
import type { FavoritePark } from '../../data/models/FavoritePark';
import type { ThemeColors } from '../../theme/colors';

export function ProfileScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const provider = useParkDiscoveryProvider();
  const { favorites } = useFavorites();
  const navigation = useNavigation();

  useEffect(() => {
    provider.getUserProfile().then(setProfile);
  }, [provider]);

  const handleFavoritePress = (item: FavoritePark) => {
    (navigation.navigate as unknown as (name: string, params: unknown) => void)('Parques', {
      screen: 'ParkDetail',
      params: { parkId: item.parkId },
    });
  };

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
        {profile.avatarUrl ? (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{profile.username.charAt(0).toUpperCase()}</Text>
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{profile.username.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      <Text testID="profile-username" style={styles.username}>
        {profile.username}
      </Text>
      <Text testID="profile-email" style={styles.email}>
        {profile.email}
      </Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Miembro desde</Text>
        <Text testID="profile-member-since" style={styles.infoValue}>
          {profile.memberSince}
        </Text>
      </View>

      {/* Favorites section */}
      <View style={styles.favoritesSection}>
        <Text style={styles.favoritesTitle}>Favorites</Text>
        {favorites.length === 0 ? (
          <Text style={styles.emptyFavorites}>No favorites yet</Text>
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

      <TouchableOpacity testID="logout-button" style={styles.logoutButton} onPress={() => {}}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
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
