/**
 * React Native configuration
 * Fonts in assets/fonts (Open Runde for Android) are linked via:
 *   npx react-native-asset
 * iOS uses ui-rounded (system font); no linking required.
 */
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts'],
  dependencies: {
    // iOS-only package — no Android implementation
    'react-native-tracking-transparency': {
      platforms: { android: null },
    },
  },
};
