// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve({password: 'mock-token'})),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
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

// Mock react-native-image-picker (native + ESM)
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn((_options, cb) => cb && cb({ didCancel: true })),
  launchCamera: jest.fn((_options, cb) => cb && cb({ didCancel: true })),
}));

// Mock react-native-html-to-pdf (native + ESM)
jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(() => Promise.resolve({ filePath: '/tmp/mock.pdf' })),
}));

// Mock react-native-share (native)
jest.mock('react-native-share', () => ({
  open: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock react-native-health (native + ESM)
jest.mock('react-native-health', () => {
  const permissionsProxy = new Proxy(
    {},
    {
      get: (_target, prop) => String(prop),
    }
  );
  return {
    __esModule: true,
    default: {
      Constants: {
        Permissions: permissionsProxy,
      },
      initHealthKit: jest.fn((_perms, cb) => cb && cb(null)),
    },
    // Named exports are only used for TS types; keep placeholders for runtime imports.
    HealthKitPermissions: {},
    HealthValue: {},
    HealthInputOptions: {},
  };
});

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

// NOTE: We rely on built-in matchers from React Native Testing Library v12+,
// so we intentionally do not import '@testing-library/jest-native/extend-expect'
