import React from 'react';
import { View, Text } from 'react-native';

// Mock for @react-navigation/native-stack

let mockInitialRouteName = 'Discovery';
const registeredScreens: Record<string, React.ComponentType<any>> = {};

const routeMap: Record<string, { key: string; name: string; params: Record<string, any> }> = {
  Discovery: { key: 'Discovery', name: 'Discovery', params: {} },
  ParkDetail: { key: 'ParkDetail', name: 'ParkDetail', params: { parkId: 'test-park' } },
};

export function createNativeStackNavigator() {
  return {
    Navigator: ({
      children,
      initialRouteName,
    }: {
      children: React.ReactNode;
      initialRouteName?: string;
    }) => {
      mockInitialRouteName = initialRouteName ?? 'Discovery';
      // Collect screen registrations from children
      React.Children.forEach(children, (child) => {
        if (
          React.isValidElement(child) &&
          child.props &&
          typeof child.props === 'object' &&
          'name' in child.props &&
          'component' in child.props
        ) {
          const props = child.props as { name: string; component: React.ComponentType<any> };
          registeredScreens[props.name] = props.component;
        }
      });
      const ScreenComponent = registeredScreens[mockInitialRouteName];
      const route = routeMap[mockInitialRouteName] ?? {
        key: 'UnknownRoute',
        name: mockInitialRouteName,
        params: {},
      };
      const navigation = {
        navigate: jest.fn().mockName('navigate'),
        goBack: jest.fn().mockName('goBack'),
        setOptions: jest.fn().mockName('setOptions'),
        addListener: jest.fn().mockName('addListener').mockReturnValue(jest.fn()),
      };
      return React.createElement(
        View,
        { testID: 'stack-navigator' },
        ScreenComponent
          ? React.createElement(ScreenComponent, { route, navigation })
          : React.createElement(View, { testID: 'fallback-view' },
              React.createElement(Text, null, 'Screen not found'),
            ),
      );
    },
    Screen: ({
      name,
      component: Component,
    }: {
      name: string;
      component: React.ComponentType<any>;
    }) => {
      registeredScreens[name] = Component;
      return null;
    },
    Group: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
}
