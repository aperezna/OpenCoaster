import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  name: string;
  onNameChange: (name: string) => void;
}

export function SearchBar({ name, onNameChange }: SearchBarProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View testID="search-bar" style={styles.container}>
      <TextInput
        testID="search-name-input"
        style={styles.input}
        placeholder={t('common.searchPlaceholder')}
        value={name}
        onChangeText={onNameChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
  },
});
