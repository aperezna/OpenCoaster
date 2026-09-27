import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
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
        <ParkResultItem item={item} onPress={onParkPress} styles={styles} />
      )}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
    />
  );
}

function ParkResultItem({
  item,
  onPress,
  styles,
}: {
  item: ParkSummary;
  onPress: (parkId: string) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const displayImage = item.image;
  const imageUrl = displayImage?.thumbnailUrl ?? item.photoUrl;

  return (
    <TouchableOpacity
      testID={`park-item-${item.id}`}
      style={styles.item}
      onPress={() => onPress(item.id)}
    >
      {imageUrl ? (
        <Image testID={`park-image-${item.id}`} source={{ uri: imageUrl }} style={styles.image} />
      ) : null}
      <Text style={styles.parkName}>{item.name}</Text>
      {item.city ? (
        <Text style={styles.parkMeta}>
          {item.city}
          {item.country ? `, ${item.country}` : ''}
        </Text>
      ) : null}
    </TouchableOpacity>
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
    image: {
      width: '100%',
      height: 96,
      marginBottom: 8,
      borderRadius: 6,
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
