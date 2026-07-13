import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  testID?: string;
}

function ErrorState({
  message,
  onRetry,
  testID = 'error-state',
}: ErrorStateProps): React.JSX.Element {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message ?? t('common.error')}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} testID={`${testID}-retry`}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    icon: {
      fontSize: 48,
      marginBottom: 16,
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}

export default ErrorState;
