import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { DiscoveryScreen } from '../features/discovery/DiscoveryScreen';
import { ParquesStackNavigator } from './ParquesStackNavigator';
import type { ParquesStackParamList } from './ParquesStackNavigator';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';

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
  const { t } = useTranslation();
  return (
    <View testID="fallback-view">
      <Text>{t('nav.screenNotFound')}</Text>
    </View>
  );
}

interface RootNavigatorProps {
  initialRouteName?: keyof RootTabParamList;
}

const validRoutes: Record<string, true> = { Mapa: true, Parques: true, Usuario: true };

function getTabLabel(routeName: keyof RootTabParamList, t: (key: string) => string): string {
  switch (routeName) {
    case 'Mapa':
      return t('nav.map');
    case 'Parques':
      return t('nav.parks');
    case 'Usuario':
      return t('nav.profile');
  }
}

export function RootNavigator({
  initialRouteName = 'Mapa',
}: RootNavigatorProps): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

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
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarLabel: getTabLabel(route.name as keyof RootTabParamList, t),
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      height: 68,
      paddingTop: 8,
      paddingBottom: 8,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 8,
    },
    tabBarItem: {
      paddingVertical: 4,
    },
    tabBarIcon: {
      marginBottom: 2,
    },
    tabBarLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
}
