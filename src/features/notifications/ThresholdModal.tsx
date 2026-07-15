import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

interface ThresholdModalProps {
  visible: boolean;
  attractionName: string;
  onConfirm: (thresholdMin: number) => void;
  onCancel: () => void;
}

const MIN_THRESHOLD = 5;
const MAX_THRESHOLD = 120;
const DEFAULT_THRESHOLD = 30;
const STEP = 5;

/**
 * Modal with a slider (5–120 min range) for setting a wait-time notification threshold.
 */
export function ThresholdModal({
  visible,
  attractionName,
  onConfirm,
  onCancel,
}: ThresholdModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);

  // Reset threshold when modal opens for a new attraction
  React.useEffect(() => {
    if (visible) {
      setThreshold(DEFAULT_THRESHOLD);
    }
  }, [visible]);

  const handleIncrease = () => {
    setThreshold((prev) => Math.min(prev + STEP, MAX_THRESHOLD));
  };

  const handleDecrease = () => {
    setThreshold((prev) => Math.max(prev - STEP, MIN_THRESHOLD));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{attractionName}</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t('notifications.threshold')}
          </Text>

          {/* Stepper controls instead of Slider (cross-platform compatible) */}
          <View style={styles.stepperRow}>
            <Pressable
              testID="threshold-decrease"
              onPress={handleDecrease}
              style={[styles.stepButton, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.stepButtonText}>−</Text>
            </Pressable>

            <View style={styles.valueContainer}>
              <Text style={[styles.valueText, { color: colors.text }]}>{threshold}</Text>
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                {t('notifications.minutes')}
              </Text>
            </View>

            <Pressable
              testID="threshold-increase"
              onPress={handleIncrease}
              style={[styles.stepButton, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.stepButtonText}>+</Text>
            </Pressable>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              testID="threshold-cancel"
              onPress={onCancel}
              style={[styles.actionButton, { backgroundColor: colors.border }]}
            >
              <Text style={[styles.actionText, { color: colors.text }]}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              testID="threshold-confirm"
              onPress={() => onConfirm(threshold)}
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.actionText, { color: '#fff' }]}>
                {t('notifications.setThreshold')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 16,
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  valueText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
