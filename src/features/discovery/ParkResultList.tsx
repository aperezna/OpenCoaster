import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { ParkSummary } from '../../data/models/ParkSummary';

interface ParkResultListProps {
  parks: ParkSummary[];
  onParkPress: (parkId: string) => void;
}

export function ParkResultList({
  parks,
  onParkPress,
}: ParkResultListProps): React.JSX.Element {
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
              {item.city}{item.country ? `, ${item.country}` : ''}
            </Text>
          ) : null}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  parkName: {
    fontSize: 16,
    fontWeight: '600',
  },
  parkMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
