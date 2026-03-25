module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  testTimeout: 15000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    '^react-native-linear-gradient$': '<rootDir>/__mocks__/react-native-linear-gradient.js',
    '^react-native-config$': '<rootDir>/__mocks__/react-native-config.js',
    '^react-native-tracking-transparency$': '<rootDir>/__mocks__/react-native-tracking-transparency.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-navigation|react-native-mmkv|react-native-keychain|@shopify/flash-list|lucide-react-native|react-native-css-interop|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|nativewind|react-native-svg|react-native-onesignal)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/'],
};
