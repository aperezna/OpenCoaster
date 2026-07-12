import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ParkHours } from '../../data/models/ParkHours';

interface HoursCardProps {
  hours: ParkHours;
}

/** Extract a readable time (e.g. "9:00 AM") from an ISO datetime or plain time string. */
function formatTime(iso: string): string {
  // Handle plain time strings like "09:00" directly
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(iso)) {
    const [h, m] = iso.split(':');
    const hour = parseInt(h ?? '0', 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${display}:${m?.padStart(2, '0') ?? '00'} ${ampm}`;
  }

  // Try parsing as ISO date
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString('es-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export function HoursCard({ hours }: HoursCardProps): React.JSX.Element {
  return (
    <View testID="hours-card" style={styles.card}>
      <Text style={styles.cardTitle}>Horario</Text>
      <View style={styles.content}>
        <Text style={styles.label}>Apertura</Text>
        <Text style={styles.time}>{formatTime(hours.opening)}</Text>
        <Text style={styles.label}>Cierre</Text>
        <Text style={styles.time}>{formatTime(hours.closing)}</Text>
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
