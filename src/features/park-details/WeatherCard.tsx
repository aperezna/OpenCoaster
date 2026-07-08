import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ParkWeather } from '../../data/models/ParkWeather';

const conditionLabels: Record<string, string> = {
  sunny: 'Soleado',
  cloudy: 'Nublado',
  storm: 'Tormenta',
  rainy: 'Lluvioso',
};

const conditionEmojis: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  storm: '⛈️',
  rainy: '🌧️',
};

interface WeatherCardProps {
  weather: ParkWeather;
}

export function WeatherCard({ weather }: WeatherCardProps): React.JSX.Element {
  const label = conditionLabels[weather.condition] ?? weather.condition;
  const emoji = conditionEmojis[weather.condition] ?? '';

  return (
    <View testID="weather-card" style={styles.card}>
      <Text style={styles.cardTitle}>Clima</Text>
      <View style={styles.content}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.temperature}>
          {weather.temperature}°{weather.unit}
        </Text>
        <Text style={styles.condition}>{label}</Text>
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
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  temperature: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  condition: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
