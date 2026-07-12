import React from 'react';
import { View, Text } from 'react-native';

// Mock for @react-navigation/native-stack
// Handles initialParams, auto-detected initialRouteName, and dynamic routes

const registeredScreens: Record<
  string,
  {
    component: React.ComponentType<any>;
    initialParams?: Record<string, any>;
  }
> = {};

export function createNativeStackNavigator() {
  // Reset on each call to prevent stale registrations across tests
  for (const key of Object.keys(registeredScreens)) {
    delete registeredScreens[key];
  }

  return {
    Navigator: ({
      children,
      initialRouteName,
    }: {
      children: React.ReactNode;
      initialRouteName?: string;
    }) => {
      let firstScreenName: string | undefined;
      const screenNames: string[] = [];

      // Collect screen registrations from children
      React.Children.forEach(children, (child) => {
        if (
          React.isValidElement(child) &&
          child.props &&
          typeof child.props === 'object' &&
          'name' in child.props &&
          'component' in child.props
        ) {
          const props = child.props as {
            name: string;
            component: React.ComponentType<any>;
            initialParams?: Record<string, any>;
          };
          registeredScreens[props.name] = {
            component: props.component,
            initialParams: props.initialParams,
          };
          screenNames.push(props.name);
          if (!firstScreenName) {
            firstScreenName = props.name;
          }
        }
      });

      const resolvedInitial = initialRouteName ?? firstScreenName ?? 'Discovery';
      const screenEntry = registeredScreens[resolvedInitial];
      const route = {
        key: resolvedInitial,
        name: resolvedInitial,
        params: screenEntry?.initialParams ?? {},
      };
      const navigation = {
        navigate: jest.fn().mockName('navigate'),
        goBack: jest.fn().mockName('goBack'),
        setOptions: jest.fn().mockName('setOptions'),
        setParams: jest.fn().mockName('setParams'),
        addListener: jest.fn().mockName('addListener').mockReturnValue(jest.fn()),
        getParent: jest.fn().mockName('getParent').mockReturnValue(null),
      };

      return React.createElement(
        View,
        { testID: 'stack-navigator' },
        screenEntry
          ? React.createElement(screenEntry.component, { route, navigation })
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
      initialParams,
    }: {
      name: string;
      component: React.ComponentType<any>;
      initialParams?: Record<string, any>;
    }) => {
      registeredScreens[name] = { component: Component, initialParams };
      return null;
    },
    Group: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
}
