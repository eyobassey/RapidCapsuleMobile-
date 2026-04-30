// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
      createAnimatedComponent: (comp) => comp,
      addWhitelistedNativeProps: jest.fn(),
      addWhitelistedUIProps: jest.fn(),
    },
    useSharedValue: jest.fn((val) => ({ value: val })),
    useAnimatedStyle: jest.fn((cb) => cb()),
    useAnimatedProps: jest.fn((cb) => cb()),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
    withRepeat: jest.fn((val) => val),
    withSequence: jest.fn((val) => val),
    withDelay: jest.fn((val) => val),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    makeMutable: jest.fn((val) => ({ value: val })),
    measure: jest.fn(() => ({ x: 0, y: 0, width: 0, height: 0, pageX: 0, pageY: 0 })),
    scrollTo: jest.fn(),
    useDerivedValue: jest.fn((cb) => ({ value: cb() })),
    cancelAnimation: jest.fn(),
    interpolate: jest.fn((v) => v),
    Extrapolate: { CLAMP: 'clamp', IDENTITY: 'identity', EXTEND: 'extend' },
    Extrapolation: { CLAMP: 'clamp', IDENTITY: 'identity', EXTEND: 'extend' },
    Animated: {
      View: View,
      Text: require('react-native').Text,
      Image: require('react-native').Image,
      ScrollView: require('react-native').ScrollView,
      createAnimatedComponent: (comp) => comp,
    },
  };
});

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    KeyboardAvoidingView: ({ children, style }) => (
      <View style={style}>{children}</View>
    ),
    KeyboardProvider: ({ children }) => children,
    KeyboardStickyView: ({ children, style }) => (
      <View style={style}>{children}</View>
    ),
    useKeyboardHandler: jest.fn(),
    useKeyboardAnimation: jest.fn(() => ({
      height: { value: 0 },
      progress: { value: 0 },
    })),
    useReanimatedKeyboardAnimation: jest.fn(() => ({
      height: { value: 0 },
      progress: { value: 0 },
    })),
    useKeyboardController: jest.fn(() => ({ setEnabled: jest.fn(), isEnabled: true })),
  };
});

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve({password: 'mock-token'})),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
  },
}));

// Mock react-native-onesignal
jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    initialize: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    Notifications: {
      requestPermission: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    User: {
      addTag: jest.fn(),
      addTags: jest.fn(),
      removeTag: jest.fn(),
      removeTags: jest.fn(),
      getTags: jest.fn(),
      addAlias: jest.fn(),
      removeAlias: jest.fn(),
      pushSubscription: {
        id: 'mock-push-id',
        token: 'mock-push-token',
        optedIn: true,
      },
    },
    InAppMessages: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Debug: {
      setLogLevel: jest.fn(),
    },
  },
}));

// react-native-gesture-handler requires a Jest setup shim
require('react-native-gesture-handler/jestSetup');

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  const mockMMKV = {
    getString: jest.fn((key) => store.get(key)),
    set: jest.fn((key, value) => store.set(key, value)),
    remove: jest.fn((key) => store.delete(key)),
    // Some code uses `delete` (MMKV API) — alias to `remove` for tests.
    delete: jest.fn((key) => store.delete(key)),
    clearAll: jest.fn(() => store.clear()),
  };
  return {
    createMMKV: () => mockMMKV,
  };
});

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({isConnected: true, type: 'wifi'})),
}));

// Mock react-native-webview (native dependency)
jest.mock('react-native-webview', () => ({
  WebView: () => null,
}));

// Mock react-native-device-info (native dependency)
jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn(() => '0.0.0'),
  getBuildNumber: jest.fn(() => '0'),
}));

// Mock expo-image-picker (native)
jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
}));

// Mock react-native-html-to-pdf (native + ESM)
jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(() => Promise.resolve({ filePath: '/tmp/mock.pdf' })),
}));

// Mock expo-sharing (native)
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @kingstinct/react-native-healthkit (native + Nitro Modules, iOS-only)
jest.mock('@kingstinct/react-native-healthkit', () => ({
  isHealthDataAvailable: jest.fn(() => false),
  requestAuthorization: jest.fn(() => Promise.resolve(false)),
  queryQuantitySamples: jest.fn(() => Promise.resolve([])),
  queryCategorySamples: jest.fn(() => Promise.resolve([])),
  CategoryValueSleepAnalysis: { inBed: 0, asleepUnspecified: 1, awake: 2, asleepCore: 3, asleepDeep: 4, asleepREM: 5 },
}));

// Mock Paystack WebView (ships untranspiled JSX in some builds)
jest.mock('react-native-paystack-webview', () => {
  return {
    PaystackProvider: ({children}) => children,
  };
});

// Mock Google Sign-In native module
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ type: 'success', data: {} })),
    getTokens: jest.fn(() => Promise.resolve({ idToken: 'mock-google-id-token' })),
    configure: jest.fn(),
  },
}));

// Mock Apple Auth native module
jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: {
    performRequest: jest.fn(() =>
      Promise.resolve({
        identityToken: 'mock-apple-id-token',
        authorizationCode: 'mock-apple-auth-code',
        state: 'Patient',
        email: null,
        fullName: null,
      })
    ),
    Operation: { LOGIN: 1 },
    Scope: { FULL_NAME: 0, EMAIL: 1 },
  },
  appleAuthAndroid: {
    isSupported: true,
    configure: jest.fn(),
    signIn: jest.fn(() =>
      Promise.resolve({
        id_token: 'mock-apple-id-token',
        code: 'mock-apple-auth-code',
        state: 'Patient',
        user: null,
      })
    ),
    ResponseType: { ALL: 0 },
    Scope: { ALL: 0 },
  },
}));

// Mock react-native-passkey (native module — WebAuthn / FIDO2)
jest.mock('react-native-passkey', () => ({
  Passkey: {
    create: jest.fn(() => Promise.resolve({})),
    get: jest.fn(() => Promise.resolve({})),
    isSupported: jest.fn(() => false),
  },
  UserCancelledError: { error: 'UserCancelled', message: 'The user cancelled the request.' },
  NotSupportedError: { error: 'NotSupported', message: 'Passkeys are not supported.' },
}));

// NOTE: We rely on built-in matchers from React Native Testing Library v12+,
// so we intentionally do not import '@testing-library/jest-native/extend-expect'
