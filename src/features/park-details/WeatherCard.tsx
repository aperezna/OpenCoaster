import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import type { ParkWeather } from '../../data/models/ParkWeather';
import type { ThemeColors } from '../../theme/colors';

const conditionKeys: Record<string, string> = {
  sunny: 'weather.sunny',
  cloudy: 'weather.cloudy',
  storm: 'weather.storm',
  rainy: 'weather.rainy',
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
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const labelKey = conditionKeys[weather.condition] ?? weather.condition;
  const emoji = conditionEmojis[weather.condition] ?? '';

  return (
    <View testID="weather-card" style={styles.card}>
      <Text style={styles.cardTitle}>{t('weather.title')}</Text>
      <View style={styles.content}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.temperature}>
          {weather.temperature}°{weather.unit}
        </Text>
        <Text style={styles.condition}>{t(labelKey)}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
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
      color: colors.textSecondary,
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
      color: colors.text,
    },
    condition: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
}
