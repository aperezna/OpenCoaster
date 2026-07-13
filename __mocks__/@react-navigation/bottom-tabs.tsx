import React from 'react';
import { View, Text } from 'react-native';

// Mock for @react-navigation/bottom-tabs

let mockInitialRouteName = 'Mapa';
const registeredScreens: Record<
  string,
  React.ComponentType<any> | ((props: any) => React.ReactElement)
> = {};

const routeMap: Record<string, { key: string; name: string; params: Record<string, any> }> = {
  Mapa: { key: 'Mapa', name: 'Mapa', params: {} },
  Parques: { key: 'Parques', name: 'Parques', params: { parkId: 'magic-kingdom' } },
  Usuario: { key: 'Usuario', name: 'Usuario', params: {} },
};

type MockRoute = { key: string; name: string; params: Record<string, any> };

type ScreenOptions =
  | {
      tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
      tabBarLabel?: string;
    }
  | ((props: { route: MockRoute }) => {
      tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
      tabBarLabel?: string;
    });

export function createBottomTabNavigator() {
  return {
    Navigator: ({
      children,
      initialRouteName,
      screenOptions,
    }: {
      children: React.ReactNode;
      initialRouteName?: string;
      screenOptions?: ScreenOptions;
    }) => {
      mockInitialRouteName = initialRouteName ?? 'Mapa';
      // Clear any previously registered screens
      for (const key of Object.keys(registeredScreens)) {
        delete registeredScreens[key];
      }

      // Collect screen registrations from children
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props && typeof child.props === 'object') {
          const props = child.props as {
            name: string;
            component?: React.ComponentType<any>;
            children?: React.ReactNode | ((props: any) => React.ReactElement);
          };
          if (props.name && props.component) {
            registeredScreens[props.name] = props.component;
          } else if (props.name && typeof props.children === 'function') {
            registeredScreens[props.name] = props.children as (props: any) => React.ReactElement;
          }
        }
      });

      const screenEntry = registeredScreens[mockInitialRouteName];
      const route = routeMap[mockInitialRouteName] ?? {
        key: 'UnknownRoute',
        name: mockInitialRouteName,
        params: {},
      };
      const resolvedScreenOptions =
        typeof screenOptions === 'function' ? screenOptions({ route }) : screenOptions;
      const navigation = {
        navigate: jest.fn().mockName('navigate'),
        goBack: jest.fn().mockName('goBack'),
        setOptions: jest.fn().mockName('setOptions'),
        addListener: jest.fn().mockName('addListener').mockReturnValue(jest.fn()),
        reset: jest.fn().mockName('reset'),
      };
      return React.createElement(
        View,
        { testID: 'tab-navigator' },
        resolvedScreenOptions?.tabBarLabel
          ? React.createElement(
              Text,
              { testID: `tab-label-${route.name}` },
              resolvedScreenOptions.tabBarLabel,
            )
          : null,
        resolvedScreenOptions?.tabBarIcon
          ? React.createElement(
              View,
              { testID: `tab-icon-${route.name}` },
              resolvedScreenOptions.tabBarIcon({
                focused: true,
                color: '#007AFF',
                size: 24,
              }),
            )
          : null,
        screenEntry
          ? typeof screenEntry === 'function'
            ? (screenEntry as (props: any) => React.ReactElement)({ route, navigation })
            : React.createElement(screenEntry as React.ComponentType<any>, { route, navigation })
          : React.createElement(
              View,
              { testID: 'fallback-view' },
              React.createElement(Text, null, 'Screen not found'),
            ),
      );
    },
    Screen: ({
      name,
      component: Component,
      children,
    }: {
      name: string;
      component?: React.ComponentType<any>;
      children?: React.ReactNode | ((props: any) => React.ReactElement);
    }) => {
      if (Component) {
        registeredScreens[name] = Component;
      } else if (typeof children === 'function') {
        registeredScreens[name] = children;
      }
      return null;
    },
    Group: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
}
