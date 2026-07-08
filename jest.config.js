/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.js'],
  roots: ['<rootDir>/src', '<rootDir>/__tests__', '<rootDir>/app'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@tanstack|expo-.*)/)',
  ],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^expo-location$':
      '<rootDir>/src/data/location/__tests__/FakeLocationService.ts',
    '^react-native-maps$': '<rootDir>/__mocks__/react-native-maps.ts',
    '^react-native-screens$': '<rootDir>/__mocks__/react-native-screens.ts',
    '^react-native-safe-area-context$':
      '<rootDir>/__mocks__/react-native-safe-area-context.ts',
    '^@react-navigation/native$':
      '<rootDir>/__mocks__/@react-navigation/native.tsx',
    '^@react-navigation/native-stack$':
      '<rootDir>/__mocks__/@react-navigation/native-stack.tsx',
    '^@react-navigation/bottom-tabs$':
      '<rootDir>/__mocks__/@react-navigation/bottom-tabs.tsx',
  },
};
