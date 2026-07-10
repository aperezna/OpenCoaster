import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import type { UserProfile } from '../../data/models/UserProfile';

export function ProfileScreen(): React.JSX.Element {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const provider = useParkDiscoveryProvider();

  useEffect(() => {
    provider.getUserProfile().then(setProfile);
  }, [provider]);

  if (!profile) {
    return (
      <View testID="profile-screen" style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View testID="profile-screen" style={styles.container}>
      <View testID="profile-avatar" style={styles.avatarContainer}>
        {profile.avatarUrl ? (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
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

      <TouchableOpacity
        testID="logout-button"
        style={styles.logoutButton}
        onPress={() => {}}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: '#f5f5f5',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90D9',
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
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
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
