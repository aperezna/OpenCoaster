import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import type { Attraction } from '../../data/models/Attraction';
import type { ThemeColors } from '../../theme/colors';

const typeKeys: Record<string, string> = {
  roller_coaster: 'attractions.typeRollerCoaster',
  water_ride: 'attractions.typeWaterRide',
  dark_ride: 'attractions.typeDarkRide',
  flat_ride: 'attractions.typeFlatRide',
  show: 'attractions.typeShow',
  family: 'attractions.typeFamily',
};

const statusColors: Record<string, string> = {
  operating: '#4CAF50',
  closed: '#FF9800',
  down: '#F44336',
};

interface AttractionListProps {
  attractions: Attraction[];
  onAddToItinerary?: (attraction: Attraction) => void;
  isAttractionAdded?: (attractionId: string) => boolean;
}

export function AttractionList({
  attractions,
  onAddToItinerary,
  isAttractionAdded,
}: AttractionListProps): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (attractions.length === 0) {
    return (
      <View testID="attraction-list-empty" style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('attractions.empty')}</Text>
      </View>
    );
  }

  return (
    <View testID="attraction-list" style={styles.container}>
      <Text style={styles.sectionTitle}>{t('attractions.title')}</Text>
      <FlatList
        data={attractions}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isAdded = isAttractionAdded?.(item.id) ?? false;
          const showAdd = onAddToItinerary && !isAdded;

          return (
            <View testID={`attraction-${item.id}`} style={styles.item}>
              <View style={styles.itemContent}>
                <View style={styles.itemLeft}>
                  <Text style={styles.attractionName}>{item.name}</Text>
                  <Text style={styles.attractionType}>{t(typeKeys[item.type] ?? item.type)}</Text>
                </View>
                <View style={styles.itemRight}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusColors[item.status] ?? '#999' },
                    ]}
                  />
                  <Text style={[styles.waitTime, item.waitTime > 30 && styles.waitTimeLong]}>
                    {item.status === 'operating'
                      ? `${item.waitTime} min`
                      : item.status === 'closed'
                        ? t('attractions.closed')
                        : t('attractions.outOfService')}
                  </Text>
                </View>
              </View>
              <View style={styles.itemActions}>
                {isAdded && (
                  <View testID={`added-indicator-${item.id}`} style={styles.addedBadge}>
                    <Text style={styles.addedText}>{t('attractions.added')}</Text>
                  </View>
                )}
                {showAdd && (
                  <TouchableOpacity
                    testID={`add-to-itinerary-${item.id}`}
                    style={styles.addButton}
                    onPress={() => onAddToItinerary(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addButtonText}>{t('attractions.addToItinerary')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginTop: 16,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    emptyContainer: {
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    item: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    itemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    itemLeft: {
      flex: 1,
      marginRight: 12,
    },
    attractionName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    attractionType: {
      fontSize: 12,
      color: colors.textTertiary,
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
      color: colors.textSecondary,
    },
    waitTimeLong: {
      color: '#F44336',
    },
    itemActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addButton: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      backgroundColor: colors.accent,
      borderRadius: 6,
    },
    addButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#fff',
    },
    addedBadge: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      backgroundColor: colors.surface,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    addedText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
  });
}
