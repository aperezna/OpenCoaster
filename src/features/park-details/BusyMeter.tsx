import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BusyMeterResult } from '../notifications/notificationTypes';

const LEVEL_COLORS: Record<string, string> = {
  low: '#4CAF50',
  moderate: '#FF9800',
  busy: '#F44336',
};

interface BusyMeterProps {
  result: BusyMeterResult;
}

export function BusyMeter({ result }: BusyMeterProps): React.JSX.Element {
  const { t } = useTranslation();
  const color = LEVEL_COLORS[result.level] ?? '#999';

  const levelKey = `busyMeter.${result.level}`;
  const avgWait = Math.round(result.averageWait);

  return (
    <View style={styles.container}>
      <View testID="busy-meter-chip" style={[styles.chip, { backgroundColor: color }]}>
        <Text style={styles.chipText}>{t(levelKey)}</Text>
        <Text style={styles.avgText}>{avgWait} min</Text>
      </View>
      {result.staleAge != null && (
        <Text testID="busy-meter-stale" style={styles.staleText}>
          {t('busyMeter.cachedAgo', { minutes: result.staleAge })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  chipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  avgText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.9,
  },
  staleText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
    fontStyle: 'italic',
  },
});
