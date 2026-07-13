import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import type { ParquesStackParamList } from '../../navigation/ParquesStackNavigator';
import { useItineraries } from './useItineraries';
import { useParkDiscoveryProvider } from '../../data/providers/ParkDiscoveryProviderContext';
import { useParkDetail } from '../park-details/useParkDetail';
import type { ItineraryItem } from '../../data/models/Itinerary';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ItineraryDetailScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const route = useRoute<RouteProp<ParquesStackParamList, 'ItineraryDetail'>>();
  const navigation = useNavigation();
  const { itineraryId } = route.params;

  const { itineraries, deleteItinerary, moveItemUp, moveItemDown } = useItineraries();
  const provider = useParkDiscoveryProvider();

  const itinerary = useMemo(
    () => itineraries.find((i) => i.id === itineraryId),
    [itineraries, itineraryId],
  );

  const { attractions, refetchAll } = useParkDetail(itinerary?.parkId ?? '', provider);

  // Refresh wait times whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (itinerary?.parkId) {
        refetchAll();
      }
    }, [itinerary?.parkId, refetchAll]),
  );

  const handleMoveUp = useCallback(
    (attractionId: string) => {
      moveItemUp(itineraryId, attractionId);
    },
    [itineraryId, moveItemUp],
  );

  const handleMoveDown = useCallback(
    (attractionId: string) => {
      moveItemDown(itineraryId, attractionId);
    },
    [itineraryId, moveItemDown],
  );

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Itinerary', 'Are you sure you want to delete this itinerary?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteItinerary(itineraryId);
          navigation.goBack();
        },
      },
    ]);
  }, [itineraryId, deleteItinerary, navigation]);

  // Look up wait time/status for an attraction from useParkDetail data
  const getAttractionInfo = useCallback(
    (attractionId: string) => {
      if (!attractions) return null;
      return attractions.find((a) => a.id === attractionId) ?? null;
    },
    [attractions],
  );

  const renderItem = useCallback(
    ({ item }: { item: ItineraryItem }) => {
      const attractionInfo = getAttractionInfo(item.attractionId);

      let waitDisplay = '—';
      if (attractionInfo) {
        if (attractionInfo.status === 'operating') {
          waitDisplay = `${attractionInfo.waitTime} min`;
        } else if (attractionInfo.status === 'closed') {
          waitDisplay = 'Closed';
        } else {
          waitDisplay = 'Down';
        }
      }

      return (
        <View style={styles.item} testID={`detail-item-${item.order}`}>
          <View style={styles.moveButtons}>
            <TouchableOpacity
              testID={`move-up-${item.id}`}
              onPress={() => handleMoveUp(item.attractionId)}
              style={styles.moveButton}
              activeOpacity={0.6}
            >
              <Text style={styles.moveButtonText}>↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`move-down-${item.id}`}
              onPress={() => handleMoveDown(item.attractionId)}
              style={styles.moveButton}
              activeOpacity={0.6}
            >
              <Text style={styles.moveButtonText}>↓</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          <View style={styles.waitContainer}>
            <Text
              style={[
                styles.waitText,
                attractionInfo?.status === 'operating' &&
                  attractionInfo.waitTime > 30 &&
                  styles.waitLong,
              ]}
            >
              {waitDisplay}
            </Text>
          </View>
        </View>
      );
    },
    [getAttractionInfo, handleMoveUp, handleMoveDown, styles],
  );

  const keyExtractor = useCallback((item: ItineraryItem) => item.id, []);

  // -------------------------------------------------------------------
  // Not found state
  // -------------------------------------------------------------------

  if (!itinerary) {
    return (
      <View style={styles.centerContainer} testID="itinerary-detail-screen">
        <Text style={styles.notFoundText}>Itinerary not found.</Text>
      </View>
    );
  }

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <View style={styles.container} testID="itinerary-detail-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.parkName}>{itinerary.parkName}</Text>
        <Text style={styles.date}>
          {itinerary.date ?? 'Date TBD'} · {itinerary.items.length} attractions
        </Text>
      </View>

      {/* Item list */}
      <FlatList
        data={itinerary.items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        testID="itinerary-items-list"
      />

      {/* Delete button */}
      <View style={styles.footer}>
        <TouchableOpacity
          testID="delete-itinerary-button"
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Delete Itinerary</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    notFoundText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    header: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    parkName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    date: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    listContent: {
      padding: 16,
      paddingBottom: 100,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    moveButtons: {
      flexDirection: 'column',
      marginRight: 12,
      gap: 4,
    },
    moveButton: {
      width: 32,
      height: 28,
      backgroundColor: colors.background,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    moveButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '700',
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    waitContainer: {
      marginLeft: 8,
      minWidth: 60,
      alignItems: 'flex-end',
    },
    waitText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    waitLong: {
      color: '#F44336',
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: colors.background,
    },
    deleteButton: {
      paddingVertical: 14,
      backgroundColor: '#F44336',
      borderRadius: 8,
      alignItems: 'center',
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });
}
