import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DiscoveryScreen } from '../features/discovery/DiscoveryScreen';
import { ParkDetailScreen } from '../features/park-details/ParkDetailScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';

export type RootTabParamList = {
  Mapa: undefined;
  Parques: { parkId?: string } | undefined;
  Usuario: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function FallbackView(): React.JSX.Element {
  return (
    <View testID="fallback-view">
      <Text>Screen not found</Text>
    </View>
  );
}

interface RootNavigatorProps {
  initialRouteName?: keyof RootTabParamList;
}

const validRoutes: Record<string, true> = { Mapa: true, Parques: true, Usuario: true };

export function RootNavigator({
  initialRouteName = 'Mapa',
}: RootNavigatorProps): React.JSX.Element {
  if (!validRoutes[initialRouteName as string]) {
    return <FallbackView />;
  }

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName as keyof RootTabParamList}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Mapa"
        children={() => <DiscoveryScreen />}
      />
      <Tab.Screen
        name="Parques"
        children={() => <ParkDetailScreen />}
      />
      <Tab.Screen
        name="Usuario"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}
