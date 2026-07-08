import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ParkHours } from '../../data/models/ParkHours';

interface HoursCardProps {
  hours: ParkHours;
}

export function HoursCard({ hours }: HoursCardProps): React.JSX.Element {
  return (
    <View testID="hours-card" style={styles.card}>
      <Text style={styles.cardTitle}>Horario</Text>
      <View style={styles.content}>
        <Text style={styles.label}>Apertura</Text>
        <Text style={styles.time}>{hours.opening}</Text>
        <Text style={styles.label}>Cierre</Text>
        <Text style={styles.time}>{hours.closing}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  content: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  time: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});
