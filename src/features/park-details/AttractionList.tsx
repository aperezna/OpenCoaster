import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import type { Attraction } from '../../data/models/Attraction';
import type { ThemeColors } from '../../theme/colors';
import { ImageAttribution } from '../../components/ImageAttribution';
import { ImageWithFallback } from '../../components/ImageWithFallback';

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
  onLongPress?: (attraction: Attraction) => void;
  monitoredIds?: Set<string>;
}

export function AttractionList({
  attractions,
  onAddToItinerary,
  isAttractionAdded,
  onLongPress,
  monitoredIds,
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
        renderItem={({ item }) => (
          <AttractionRow
            item={item}
            isAdded={isAttractionAdded?.(item.id) ?? false}
            showAdd={Boolean(onAddToItinerary && !(isAttractionAdded?.(item.id) ?? false))}
            isMonitored={monitoredIds?.has(item.id) ?? false}
            onAddToItinerary={onAddToItinerary}
            onLongPress={onLongPress}
            styles={styles}
            t={t}
          />
        )}
      />
    </View>
  );
}

function AttractionRow({
  item,
  isAdded,
  showAdd,
  isMonitored,
  onAddToItinerary,
  onLongPress,
  styles,
  t,
}: {
  item: Attraction;
  isAdded: boolean;
  showAdd: boolean;
  isMonitored: boolean;
  onAddToItinerary?: (attraction: Attraction) => void;
  onLongPress?: (attraction: Attraction) => void;
  styles: ReturnType<typeof createStyles>;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  const displayImage = item.image;
  return (
    <Pressable
      testID={`attraction-${item.id}`}
      style={styles.item}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      disabled={!onLongPress}
    >
      {displayImage ? (
        <ImageWithFallback
          testID={`attraction-image-${item.id}`}
          sources={[displayImage.thumbnailUrl, displayImage.originalUrl]}
          style={styles.image}
        />
      ) : null}
      <View style={styles.itemContent}>
        <View style={styles.itemLeft}>
          <View style={styles.nameRow}>
            <Text style={styles.attractionName}>{item.name}</Text>
            {isMonitored && (
              <Text
                testID={`bell-indicator-${item.id}`}
                style={styles.bellIcon}
                accessibilityLabel={t('attractions.bellIndicator')}
              >
                🔔
              </Text>
            )}
          </View>
          <Text style={styles.attractionType}>{t(typeKeys[item.type] ?? item.type)}</Text>
        </View>
        <View style={styles.itemRight}>
          <View
            style={[styles.statusDot, { backgroundColor: statusColors[item.status] ?? '#999' }]}
          />
          <Text style={[styles.waitTime, item.waitTime > 30 && styles.waitTimeLong]}>
            {item.status === 'operating'
              ? t('attractions.waitTime', { time: item.waitTime })
              : item.status === 'closed'
                ? t('attractions.closed')
                : t('attractions.outOfService')}
          </Text>
        </View>
      </View>
      {displayImage ? (
        <ImageAttribution image={displayImage} testID={`attraction-image-source-${item.id}`} />
      ) : null}
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
            onPress={() => onAddToItinerary?.(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>{t('attractions.addToItinerary')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
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
    image: {
      width: '100%',
      height: 120,
      borderRadius: 6,
      marginBottom: 8,
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
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    attractionName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    bellIcon: {
      fontSize: 14,
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
