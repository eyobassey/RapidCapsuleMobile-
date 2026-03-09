module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-mmkv|react-native-keychain|@shopify/flash-list|lucide-react-native|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|nativewind|react-native-svg)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/'],
};
