import React, { useMemo } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import type { Itinerary } from '../../data/models/Itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItineraryPickerModalProps {
  visible: boolean;
  itineraries: Itinerary[];
  onSelect: (itinerary: Itinerary) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ItineraryPickerModal({
  visible,
  itineraries,
  onSelect,
  onCreateNew,
  onClose,
}: ItineraryPickerModalProps): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      testID="itinerary-picker-modal"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{t('itineraryPicker.title')}</Text>

          <FlatList
            data={itineraries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={`itinerary-pick-${item.id}`}
                style={styles.itineraryItem}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.itineraryName}>{item.parkName}</Text>
                <Text style={styles.itineraryMeta}>
                  {item.date ?? t('visitPlanner.dateTbd')} ·{' '}
                  {t('visitPlanner.attractionsCount', { count: item.items.length })}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('itineraryPicker.empty')}</Text>}
          />

          <TouchableOpacity
            testID="itinerary-picker-create-new"
            style={styles.createNewButton}
            onPress={onCreateNew}
            activeOpacity={0.7}
          >
            <Text style={styles.createNewText}>{t('itineraryPicker.createNew')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="itinerary-picker-close"
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 24,
      paddingBottom: 48,
      maxHeight: '80%',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    itineraryItem: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    itineraryName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    itineraryMeta: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 24,
    },
    createNewButton: {
      paddingVertical: 14,
      backgroundColor: colors.accent,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    createNewText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    closeButton: {
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    closeText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
  });
}
