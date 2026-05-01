require('dotenv').config();

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

  updates: {
    url: 'https://u.expo.dev/029a2460-8f33-43fc-90b4-e6f3cdcc1543',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },

  extra: {
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY ?? '',
    eas: {
      projectId: '029a2460-8f33-43fc-90b4-e6f3cdcc1543',
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
};
