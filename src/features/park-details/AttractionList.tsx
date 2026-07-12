import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import type { Attraction } from '../../data/models/Attraction';

const typeLabels: Record<string, string> = {
  roller_coaster: 'Montaña rusa',
  water_ride: 'Atracción acuática',
  dark_ride: 'Atracción oscura',
  flat_ride: 'Atracción plana',
  show: 'Espectáculo',
  family: 'Familiar',
};

const statusColors: Record<string, string> = {
  operating: '#4CAF50',
  closed: '#FF9800',
  down: '#F44336',
};

interface AttractionListProps {
  attractions: Attraction[];
}

export function AttractionList({ attractions }: AttractionListProps): React.JSX.Element {
  if (attractions.length === 0) {
    return (
      <View testID="attraction-list-empty" style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No attractions available</Text>
      </View>
    );
  }

  return (
    <View testID="attraction-list" style={styles.container}>
      <Text style={styles.sectionTitle}>Atracciones</Text>
      <FlatList
        data={attractions}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View testID={`attraction-${item.id}`} style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.attractionName}>{item.name}</Text>
              <Text style={styles.attractionType}>{typeLabels[item.type] ?? item.type}</Text>
            </View>
            <View style={styles.itemRight}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColors[item.status] ?? '#999' }]}
              />
              <Text style={[styles.waitTime, item.waitTime > 30 && styles.waitTimeLong]}>
                {item.status === 'operating'
                  ? `${item.waitTime} min`
                  : item.status === 'closed'
                    ? 'Cerrado'
                    : 'Fuera de servicio'}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  attractionType: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  waitTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  waitTimeLong: {
    color: '#F44336',
  },
});
