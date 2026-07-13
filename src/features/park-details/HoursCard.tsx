import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import type { ParkHours } from '../../data/models/ParkHours';
import type { ThemeColors } from '../../theme/colors';

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
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View testID="hours-card" style={styles.card}>
      <Text style={styles.cardTitle}>{t('hours.title')}</Text>
      <View style={styles.content}>
        <Text style={styles.label}>{t('hours.opening')}</Text>
        <Text style={styles.time}>{formatTime(hours.opening)}</Text>
        <Text style={styles.label}>{t('hours.closing')}</Text>
        <Text style={styles.time}>{formatTime(hours.closing)}</Text>
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
    label: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 4,
    },
    time: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
  });
}
