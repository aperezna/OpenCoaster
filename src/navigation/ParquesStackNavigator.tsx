import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParksListScreen } from '../features/parks-list/ParksListScreen';
import { ParkDetailScreen } from '../features/park-details/ParkDetailScreen';
import { VisitPlannerScreen } from '../features/visit-planner/VisitPlannerScreen';
import { ItineraryDetailScreen } from '../features/visit-planner/ItineraryDetailScreen';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ParquesStackParamList = {
  ParksList: { parkId?: string };
  ParkDetail: { parkId: string };
  VisitPlanner: { parkId?: string; parkName?: string };
  ItineraryDetail: { itineraryId: string };
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
      <Stack.Screen name="VisitPlanner" component={VisitPlannerScreen} />
      <Stack.Screen name="ItineraryDetail" component={ItineraryDetailScreen} />
    </Stack.Navigator>
  );
}
