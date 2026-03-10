// Environment configuration
// In production, these should come from react-native-config or similar
const ENV = {
  API_BASE_URL: 'https://api.rapidcapsule.com/api',
  PAYSTACK_PUBLIC_KEY: 'pk_test_bebdcdfe6568286e9dbbde99182fb3adb543be83',
  SOCKET_URL: 'https://api.rapidcapsule.com',
  REQUEST_TIMEOUT: 30000,
  // Google Sign-In: web client ID from Google Cloud Console
  // Aarav: replace with your project's OAuth 2.0 web client ID
  GOOGLE_WEB_CLIENT_ID: '',
} as const;

export default ENV;
