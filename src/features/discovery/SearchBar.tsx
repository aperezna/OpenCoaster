import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

interface SearchBarProps {
  name: string;
  city: string;
  onNameChange: (name: string) => void;
  onCityChange: (city: string) => void;
}

export function SearchBar({
  name,
  city,
  onNameChange,
  onCityChange,
}: SearchBarProps): React.JSX.Element {
  return (
    <View testID="search-bar" style={styles.container}>
      <TextInput
        testID="search-name-input"
        style={styles.input}
        placeholder="Park name"
        value={name}
        onChangeText={onNameChange}
      />
      <TextInput
        testID="search-city-input"
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={onCityChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginHorizontal: 4,
  },
});
