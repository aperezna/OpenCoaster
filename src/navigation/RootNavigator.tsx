import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoveryScreen } from '../features/discovery/DiscoveryScreen';
import { ParkDetailScreen } from '../features/park-details/ParkDetailScreen';

export type RootStackParamList = {
  Discovery: undefined;
  ParkDetail: { parkId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function FallbackView(): React.JSX.Element {
  return (
    <View testID="fallback-view">
      <Text>Screen not found</Text>
    </View>
  );
}

interface RootNavigatorProps {
  initialRouteName?: keyof RootStackParamList;
}

const validRoutes: Record<string, true> = { Discovery: true, ParkDetail: true };

export function RootNavigator({
  initialRouteName = 'Discovery',
}: RootNavigatorProps): React.JSX.Element {
  if (!validRoutes[initialRouteName as string]) {
    return <FallbackView />;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName as keyof RootStackParamList}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Discovery"
        component={DiscoveryScreen}
      />
      <Stack.Screen
        name="ParkDetail"
        component={ParkDetailScreen}
      />
    </Stack.Navigator>
  );
}
