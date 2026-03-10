// Environment configuration
// Values reference ecosystem.config.js (RC-Backend / RC-Frontend env)
const ENV = {
  API_BASE_URL: 'https://api.rapidcapsule.com/api',
  PAYSTACK_PUBLIC_KEY: 'pk_test_bebdcdfe6568286e9dbbde99182fb3adb543be83',
  SOCKET_URL: 'https://api.rapidcapsule.com',
  REQUEST_TIMEOUT: 30000,

  // Google Sign-In (GOOGLE_CLIENT_ID from ecosystem)
  GOOGLE_WEB_CLIENT_ID: '963693127130-tejh2eddf09e2vt72dnusqvm1p28c2ub.apps.googleusercontent.com',

  // Apple Sign-In (APPLE_CLIENT_ID, APPLE_CALLBACK from ecosystem)
  APPLE_CLIENT_ID: 'com.rapidcapsules.login',
  APPLE_REDIRECT_URI: 'https://rapidcapsule.com/api/auth/apple/redirect',
} as const;

export default ENV;
