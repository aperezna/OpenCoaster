import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { ParkSummary } from '../../data/models/ParkSummary';
import type { ThemeColors } from '../../theme/colors';

interface ParkResultListProps {
  parks: ParkSummary[];
  onParkPress: (parkId: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ParkResultList({
  parks,
  onParkPress,
  refreshing = false,
  onRefresh,
}: ParkResultListProps): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (parks.length === 0) {
    return (
      <View testID="park-result-list-empty" style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No parks found</Text>
      </View>
    );
  }

  return (
    <FlatList
      testID="park-result-list"
      data={parks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          testID={`park-item-${item.id}`}
          style={styles.item}
          onPress={() => onParkPress(item.id)}
        >
          <Text style={styles.parkName}>{item.name}</Text>
          {item.city ? (
            <Text style={styles.parkMeta}>
              {item.city}
              {item.country ? `, ${item.country}` : ''}
            </Text>
          ) : null}
        </TouchableOpacity>
      )}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    emptyContainer: {
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    item: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    parkName: {
      fontSize: 16,
      fontWeight: '600',
    },
    parkMeta: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
}
