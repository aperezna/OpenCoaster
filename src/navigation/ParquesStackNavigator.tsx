import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParksListScreen } from '../features/parks-list/ParksListScreen';
import { ParkDetailScreen } from '../features/park-details/ParkDetailScreen';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ParquesStackParamList = {
  ParksList: { parkId?: string };
  ParkDetail: { parkId: string };
};

const Stack = createNativeStackNavigator<ParquesStackParamList>();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ParquesStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ParksList" component={ParksListScreen} />
      <Stack.Screen name="ParkDetail" component={ParkDetailScreen} />
    </Stack.Navigator>
  );
}
