import React from 'react';
import { Text } from 'react-native';

interface IoniconsProps {
  name: string;
  size?: number;
  color?: string;
}

export function Ionicons({ name, size, color }: IoniconsProps) {
  return React.createElement(Text, {
    testID: `ionicon-${name}`,
    children: name,
    style: { color, fontSize: size },
  });
}
