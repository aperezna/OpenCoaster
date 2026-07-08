import React from 'react';
import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ParkDetail'>;

export function ParkDetailScreen({ route }: Props): React.JSX.Element {
  const { parkId } = route.params;
  return (
    <View testID="park-detail-screen">
      <Text>Park Detail: {parkId}</Text>
    </View>
  );
}
