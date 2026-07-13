import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import type { ParquesStackParamList } from '../../navigation/ParquesStackNavigator';
import { useItineraries } from './useItineraries';
import type { Itinerary } from '../../data/models/Itinerary';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VisitPlannerScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<ParquesStackParamList>>();
  const route = useRoute<RouteProp<ParquesStackParamList, 'VisitPlanner'>>();

  const { itineraries, isLoading, createItinerary } = useItineraries();

  const [isCreating, setIsCreating] = useState(false);
  const [parkNameInput, setParkNameInput] = useState('');
  const [parkIdInput, setParkIdInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  const handleStartCreating = useCallback(() => {
    setParkNameInput(route.params?.parkName ?? '');
    setParkIdInput(route.params?.parkId ?? '');
    setDateInput('');
    setIsCreating(true);
  }, [route.params?.parkName, route.params?.parkId]);

  const handleCancelCreating = useCallback(() => {
    setIsCreating(false);
    setParkNameInput('');
    setParkIdInput('');
    setDateInput('');
  }, []);

  const handleConfirmCreate = useCallback(() => {
    if (!parkIdInput || !parkNameInput.trim()) {
      return;
    }
    createItinerary(parkIdInput, parkNameInput.trim(), dateInput || undefined);
    setIsCreating(false);
    setParkNameInput('');
    setParkIdInput('');
    setDateInput('');
  }, [parkIdInput, parkNameInput, dateInput, createItinerary]);

  const handleItineraryPress = useCallback(
    (itineraryId: string) => {
      navigation.navigate('ItineraryDetail', { itineraryId });
    },
    [navigation],
  );

  const renderItineraryItem = useCallback(
    ({ item }: { item: Itinerary }) => (
      <TouchableOpacity
        testID={`itinerary-card-${item.id}`}
        style={styles.card}
        onPress={() => handleItineraryPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardParkName}>{item.parkName}</Text>
          <Text style={styles.cardMeta}>
            {item.date ?? 'Date TBD'} · {item.items.length} attractions
          </Text>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>
    ),
    [handleItineraryPress, styles],
  );

  const keyExtractor = useCallback((item: Itinerary) => item.id, []);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <View style={styles.container} testID="visit-planner-screen">
      {/* Create button */}
      {!isCreating && (
        <TouchableOpacity
          testID="create-itinerary-button"
          style={styles.createButton}
          onPress={handleStartCreating}
          activeOpacity={0.7}
        >
          <Text style={styles.createButtonText}>+ Create Itinerary</Text>
        </TouchableOpacity>
      )}

      {/* Create form */}
      {isCreating && (
        <View style={styles.form} testID="create-form">
          <TextInput
            testID="itinerary-park-input"
            style={styles.input}
            placeholder="Park name"
            value={parkNameInput}
            onChangeText={setParkNameInput}
            editable={!route.params?.parkName} // prevent editing when pre-filled
          />
          <TextInput
            testID="itinerary-date-input"
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            value={dateInput}
            onChangeText={setDateInput}
          />
          <View style={styles.formActions}>
            <TouchableOpacity
              testID="confirm-create-button"
              style={styles.confirmButton}
              onPress={handleConfirmCreate}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="cancel-create-button"
              style={styles.cancelButton}
              onPress={handleCancelCreating}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Itinerary list or empty state */}
      {!isLoading && itineraries.length === 0 ? (
        <View style={styles.emptyState} testID="empty-state">
          <Text style={styles.emptyTitle}>No itineraries yet</Text>
          <Text style={styles.emptySubtitle}>Create an itinerary to plan your park visit</Text>
        </View>
      ) : (
        <FlatList
          data={itineraries}
          keyExtractor={keyExtractor}
          renderItem={renderItineraryItem}
          contentContainerStyle={styles.listContent}
          testID="itinerary-list"
        />
      )}
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
    createButton: {
      margin: 16,
      paddingVertical: 14,
      backgroundColor: colors.accent,
      borderRadius: 8,
      alignItems: 'center',
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    form: {
      margin: 16,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.background,
      borderRadius: 6,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      color: colors.text,
    },
    formActions: {
      flexDirection: 'row',
      gap: 12,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      backgroundColor: colors.accent,
      borderRadius: 6,
      alignItems: 'center',
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 8,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    cardContent: {
      flex: 1,
    },
    cardParkName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    cardMeta: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    cardArrow: {
      fontSize: 22,
      color: colors.textTertiary,
      marginLeft: 8,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
