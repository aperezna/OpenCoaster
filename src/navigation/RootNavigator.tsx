import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams } from '@react-navigation/native';
import { DiscoveryScreen } from '../features/discovery/DiscoveryScreen';
import { ParquesStackNavigator } from './ParquesStackNavigator';
import type { ParquesStackParamList } from './ParquesStackNavigator';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';

export type RootTabParamList = {
  Mapa: undefined;
  Parques: NavigatorScreenParams<ParquesStackParamList> | undefined;
  Usuario: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function getTabBarIconName(routeName: keyof RootTabParamList, focused: boolean) {
  switch (routeName) {
    case 'Mapa':
      return focused ? 'map' : 'map-outline';
    case 'Parques':
      return focused ? 'business' : 'business-outline';
    case 'Usuario':
      return focused ? 'person' : 'person-outline';
  }
}

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
  const { colors } = useTheme();

  if (!validRoutes[initialRouteName as string]) {
    return <FallbackView />;
  }

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName as keyof RootTabParamList}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={getTabBarIconName(route.name as keyof RootTabParamList, focused)}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Mapa" children={() => <DiscoveryScreen />} />
      <Tab.Screen name="Parques" children={() => <ParquesStackNavigator />} />
      <Tab.Screen name="Usuario" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
