// Environment configuration
// Values reference ecosystem.config.js (RC-Backend / RC-Frontend env)
const ENV = {
  API_BASE_URL: 'https://api.rapidcapsule.com/api',
  PAYSTACK_PUBLIC_KEY: 'pk_test_bebdcdfe6568286e9dbbde99182fb3adb543be83',
  SOCKET_URL: 'https://api.rapidcapsule.com',
  REQUEST_TIMEOUT: 30000,
<<<<<<< HEAD

  // Google Sign-In
  // webClientId: Web OAuth client (for backend id_token verification)
  // iosClientId: iOS OAuth client (required for native flow - create in GC Console → iOS)
  GOOGLE_WEB_CLIENT_ID: '963693127130-tejh2eddf09e2vt72dnusqvm1p28c2ub.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: '963693127130-778nldm94hsldij2vklks22k3i1koreq.apps.googleusercontent.com',

  // Apple Sign-In (APPLE_CLIENT_ID, APPLE_CALLBACK from ecosystem)
  APPLE_CLIENT_ID: 'com.rapidcapsules.login',
  APPLE_REDIRECT_URI: 'https://rapidcapsule.com/api/auth/apple/redirect',
=======
  // Google Sign-In: web client ID from Google Cloud Console
  // Aarav: replace with your project's OAuth 2.0 web client ID
  GOOGLE_WEB_CLIENT_ID: '',
>>>>>>> 2301e5f (Implement Google and Apple Sign-In authentication)
} as const;

export default ENV;
