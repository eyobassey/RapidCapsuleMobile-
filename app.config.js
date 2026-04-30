/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'RapidCapsules',
  slug: 'rapidcapsules',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,

  ios: {
    bundleIdentifier: 'com.rapidcapsule.mobileapp',
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription: 'Required for video consultations and profile photos.',
      NSMicrophoneUsageDescription: 'Required for audio during video consultations.',
      NSHealthShareUsageDescription: 'Required to read health data for your care plan.',
      NSHealthUpdateUsageDescription: 'Required to log health metrics to Apple Health.',
      NSUserTrackingUsageDescription:
        'This helps us improve your experience with personalised content.',
    },
  },

  android: {
    package: 'com.rapidcapsule.mobileapp',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#151c2c',
    },
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      'android.permission.WAKE_LOCK',
      'android.permission.ACCESS_WIFI_STATE',
    ],
  },

  plugins: [
    'expo-modules-core',
  ],
};
