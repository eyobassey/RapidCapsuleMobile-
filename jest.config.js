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
    // pnpm stores real files at node_modules/.pnpm/<pkg@ver>/node_modules/<pkg>/
    // Pattern 1 handles that path — transform the allowed ESM packages inside .pnpm
    'node_modules/\\.pnpm/[^/]+/node_modules/(?!(' +
      'react-native|' +
      '@react-native|' +
      '@react-native-community|' +
      '@react-navigation|' +
      'react-native-mmkv|' +
      'react-native-keychain|' +
      '@shopify|' +
      'lucide-react-native|' +
      'react-native-css-interop|' +
      'react-native-reanimated|' +
      'react-native-worklets|' +
      'react-native-gesture-handler|' +
      'react-native-screens|' +
      'react-native-safe-area-context|' +
      'nativewind|' +
      'react-native-svg|' +
      'react-native-onesignal' +
    ')/)',
    // Pattern 2 handles flat node_modules; exclude .pnpm (already handled above)
    'node_modules/(?!(' +
      '\\.pnpm|' +
      'react-native|' +
      '@react-native|' +
      '@react-native-community|' +
      '@react-navigation|' +
      'react-native-mmkv|' +
      'react-native-keychain|' +
      '@shopify|' +
      'lucide-react-native|' +
      'react-native-css-interop|' +
      'react-native-reanimated|' +
      'react-native-worklets|' +
      'react-native-gesture-handler|' +
      'react-native-screens|' +
      'react-native-safe-area-context|' +
      'nativewind|' +
      'react-native-svg|' +
      'react-native-onesignal' +
    ')/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/'],
};
