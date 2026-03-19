# [1.7.0](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.6.0...v1.7.0) (2026-03-19)

### Features

- **ui:** add action buttons to health insight tip cards ([c653a6f](https://github.com/eyobassey/RapidCapsuleMobile-/commit/c653a6fa7e318eb1fc8e9eb7976fcb2fe2811db4))

# [1.6.0](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.5.1...v1.6.0) (2026-03-19)

### Features

- **ui:** add relative timestamp to health insight tip cards ([7ae1f71](https://github.com/eyobassey/RapidCapsuleMobile-/commit/7ae1f7183e612b9a857c362b3ec2317bf41234f5))

## [1.5.1](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.5.0...v1.5.1) (2026-03-19)

### Bug Fixes

- **ui:** move Health Insights after Next Appointment and fix filter chips ([114d5c7](https://github.com/eyobassey/RapidCapsuleMobile-/commit/114d5c79599e3078b1882d5b199555e98e849861))

# [1.5.0](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.4.1...v1.5.0) (2026-03-19)

### Bug Fixes

- remove strokeWidth prop from HealthGauge (no longer accepted) ([a115e27](https://github.com/eyobassey/RapidCapsuleMobile-/commit/a115e279e27d6851aa923d14f8e7ed0310ed43bc))

### Features

- add AI Health Insights section with dashboard cards and full screen ([0dd464c](https://github.com/eyobassey/RapidCapsuleMobile-/commit/0dd464c251ac9bcb6c8a0df17114b16a57850650))

## [1.4.1](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.4.0...v1.4.1) (2026-03-19)

### Bug Fixes

- **ui:** fix health gauge arc clipping at top ([41b7ebb](https://github.com/eyobassey/RapidCapsuleMobile-/commit/41b7ebb7b6228e91407753702bd594896f567566))

# [1.4.0](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.3.1...v1.4.0) (2026-03-19)

### Features

- **ui:** replace health score ring with semicircular gauge ([ef37149](https://github.com/eyobassey/RapidCapsuleMobile-/commit/ef371494f65a2159cad5b4732bd3dcc055d3f797))

## [1.3.1](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.3.0...v1.3.1) (2026-03-19)

### Bug Fixes

- address code quality issues in auth, storage, and notifications ([efe9918](https://github.com/eyobassey/RapidCapsuleMobile-/commit/efe991840620e6f5c465a4e3ac76376dd08b16b9))

# [1.3.0](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.2.0...v1.3.0) (2026-03-19)

### Bug Fixes

- **auth:** gate e2e auth bypass behind **DEV** ([3dbff28](https://github.com/eyobassey/RapidCapsuleMobile-/commit/3dbff288afaef63c03ef1ed0b7bd1cb7cfe90168))
- **chat:** adjust padding in ChatScreen to accommodate safe area insets ([86def5d](https://github.com/eyobassey/RapidCapsuleMobile-/commit/86def5d04d68bee746092ad4b3c83b7f553a8ee9))
- keyboard covers chat input — remove absolute positioning from input bar ([6604c85](https://github.com/eyobassey/RapidCapsuleMobile-/commit/6604c85f26d7b0119d20d394617839faaac7523a))
- **navigation:** add 'DrugSearch' to HIDE_TAB_SCREENS to prevent tab visibility ([160f6e9](https://github.com/eyobassey/RapidCapsuleMobile-/commit/160f6e90a245e1d114a0da8dd556dcde8ae6d0eb))
- **notifications:** fix accordion row layout — space-between + centred Switch ([1e2bee4](https://github.com/eyobassey/RapidCapsuleMobile-/commit/1e2bee43268506fbf85dedefb384660973f712c2))
- **notifications:** properly centre Switch in accordion rows ([73c01f7](https://github.com/eyobassey/RapidCapsuleMobile-/commit/73c01f749a2100902d97a18505dc2366735d9bb0))
- **pharmacy:** keep cart fab above tab bar ([1a9a1bf](https://github.com/eyobassey/RapidCapsuleMobile-/commit/1a9a1bf2e2cd46c5a521b81a60a2d34b68c5b9a9))
- **pharmacy:** respect safe areas in checkout and payment modal ([8c1c33a](https://github.com/eyobassey/RapidCapsuleMobile-/commit/8c1c33a22d1862282b85d7ee6c2b9c437d5db680))
- **pharmacy:** route My Orders back to Profile ([bc5000b](https://github.com/eyobassey/RapidCapsuleMobile-/commit/bc5000b1de861ae4d469d0a54172e6b9811410a1))
- **profile:** adjust HealthRecordsScreen padding to account for safe area insets ([e56ff22](https://github.com/eyobassey/RapidCapsuleMobile-/commit/e56ff22ff5cf9da20efa8dc093706dff29776a21))
- set default foreground color on Text component to prevent black-on-dark ([bda2ab7](https://github.com/eyobassey/RapidCapsuleMobile-/commit/bda2ab739db0cc40532e4e89f9564b5661ec4e5b))
- **ui:** ensure KeyboardSheet spans full width and refactor SecuritySettingsScreen ([4237bf3](https://github.com/eyobassey/RapidCapsuleMobile-/commit/4237bf37757419a566af6ba8a2f51deb56f872f6))
- **ui:** ensure LoginScreen forgot password sheet spans full width ([3a5d248](https://github.com/eyobassey/RapidCapsuleMobile-/commit/3a5d24823a1f3baeb7a0fdf1a25d4631a2b4dcac))
- **ui:** ensure TextInputs are respected and fix button spacing using dynamic keyboard padding ([76dadba](https://github.com/eyobassey/RapidCapsuleMobile-/commit/76dadbafbf474ea45c78043217f7cb3224a8297f))
- **ui:** prevent tab bar from stretching in empty states ([78ece44](https://github.com/eyobassey/RapidCapsuleMobile-/commit/78ece446c0a92786df465d9e3822504cfc632d42))
- **ui:** resolve 'huge distance' issue between keyboard and buttons across multiple screens ([a0ac680](https://github.com/eyobassey/RapidCapsuleMobile-/commit/a0ac68069a0a813cbab2907d2cab8802b46cf476))
- **ui:** resolve Reanimated error in KeyboardSheet and hide tab bar on EditProfile ([a6ff929](https://github.com/eyobassey/RapidCapsuleMobile-/commit/a6ff9293472a8fec3652a89079831c83d681a584))
- **wallet:** improve funding flow and modal input layout ([84f8c4b](https://github.com/eyobassey/RapidCapsuleMobile-/commit/84f8c4bc07077b6c21b046fcf8ada406891c7f01))

### Features

- add About screen and fix legal URLs ([7dccc58](https://github.com/eyobassey/RapidCapsuleMobile-/commit/7dccc5827fbe0b72966bfff790e9b09935e74123))
- add Referrals & Rewards screen with TanStack Query ([c07b8c9](https://github.com/eyobassey/RapidCapsuleMobile-/commit/c07b8c997b9ef0715bdaa67fcf799c16d640af25))
- add Terms & Conditions and Privacy Policy screens ([fc56a4c](https://github.com/eyobassey/RapidCapsuleMobile-/commit/fc56a4cce6fec049b9c72f34f91d7d004edc9840))
- align referral types and screen to real API payloads ([0223ec8](https://github.com/eyobassey/RapidCapsuleMobile-/commit/0223ec83aec05d4dc8a6f77c69068ab0212d7a73))
- **eka-chat:** improve loading UX with shimmer skeletons and contextual witty phrases ([197b32b](https://github.com/eyobassey/RapidCapsuleMobile-/commit/197b32b984ab557fe1c71891806b42b5e5303583))
- fix keyboard overlap app-wide with react-native-keyboard-controller ([0ec3e2c](https://github.com/eyobassey/RapidCapsuleMobile-/commit/0ec3e2c65c285dbf5c08072cb4070fe355721c4f))
- **notifications:** align preferences to real API payload structure ([83850c0](https://github.com/eyobassey/RapidCapsuleMobile-/commit/83850c0c1dde369a8c10344656c4bf5898ff9233))
- **notifications:** implement full notification preferences screen matching web UI ([8bb0cd0](https://github.com/eyobassey/RapidCapsuleMobile-/commit/8bb0cd0d8e5ce939bb1129e9c0f53cefb45d903e))
- **onboarding:** extend emergency contact details ([df32452](https://github.com/eyobassey/RapidCapsuleMobile-/commit/df324523e0e9b503d5200c8083ef1f6fff8ef2b3))
- **onboarding:** gate Apple Health and use system browser for Google Fit ([0816305](https://github.com/eyobassey/RapidCapsuleMobile-/commit/0816305cae537d27849ec51a4565aee1ce813889))
- **pharmacy:** add cart functionality to DrugCard and integrate with DrugCategoryScreen ([b42d85b](https://github.com/eyobassey/RapidCapsuleMobile-/commit/b42d85b974f24eed034eba4cebdb76754195b2b0))
- **pharmacy:** prefill delivery address from profile ([6817118](https://github.com/eyobassey/RapidCapsuleMobile-/commit/6817118dc6238fb905406c72e2ea5cedad1c600b))
- **profile:** add Notification Preferences screen ([1fe4ada](https://github.com/eyobassey/RapidCapsuleMobile-/commit/1fe4ada49b19a309952208f7d365e1485c024a46))
- **profile:** implement tap to change photo with S3 presigned upload ([56ef240](https://github.com/eyobassey/RapidCapsuleMobile-/commit/56ef2401e01cb5a1c98597a26f23338422a58e05))
- **profile:** show app version in About section ([7ee7fbb](https://github.com/eyobassey/RapidCapsuleMobile-/commit/7ee7fbbefbacdf0546476ee05ac02f57b66b24c8))
- **profile:** switch photo upload to direct Base64 patching and fix social auth token extraction ([c3d90fe](https://github.com/eyobassey/RapidCapsuleMobile-/commit/c3d90fe795fd21d2a8945782be6a6bbd6b4c961c))
- **security:** add Security Settings screen ([6fef614](https://github.com/eyobassey/RapidCapsuleMobile-/commit/6fef614f222b8a152a8d5588d835904967979b8f))
- token refresh interceptor + delete account ([6fcc1b5](https://github.com/eyobassey/RapidCapsuleMobile-/commit/6fcc1b59ab17432f6182ae3c7d67eb3b26220405))

# [1.2.0](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.1.0...v1.2.0) (2026-03-18)

### Bug Fixes

- **test:** add Jest mock for react-native-onesignal ([e76792d](https://github.com/eyobassey/RapidCapsuleMobile-/commit/e76792dd7d326c70fcc8aee819409ffb9a05376c))

### Features

- integrate OneSignal push notifications ([9b9bbc3](https://github.com/eyobassey/RapidCapsuleMobile-/commit/9b9bbc3cfaf6a5e0509d23f5e843d45681c9516b))

# [1.1.0](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.16...v1.1.0) (2026-03-18)

### Features

- add notification preferences screen and notification click navigation ([d0efdfb](https://github.com/eyobassey/RapidCapsuleMobile-/commit/d0efdfbdf0a5fa61b8ab18cafbcb4ac636014c3b))

## [1.0.16](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.15...v1.0.16) (2026-03-18)

### Bug Fixes

- handle nested notification response format from backend ([5033f1f](https://github.com/eyobassey/RapidCapsuleMobile-/commit/5033f1f9fc06f5ebdaee1d4dfad10c73b26deb89))

## [1.0.15](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.14...v1.0.15) (2026-03-17)

### Bug Fixes

- **ci:** monkey-patch OpenSSL to use PKCS[#8](https://github.com/eyobassey/RapidCapsuleMobile-/issues/8) key for all Apple tools ([66ce011](https://github.com/eyobassey/RapidCapsuleMobile-/commit/66ce0116b9daadf60206f29ced4cb4433c178608))

## [1.0.14](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.13...v1.0.14) (2026-03-17)

### Bug Fixes

- **ci:** switch to Admin API key XYZ6XN77NT for cloud signing permissions ([6123165](https://github.com/eyobassey/RapidCapsuleMobile-/commit/612316582cea9923bdb66ce9a2e05f07a7c2dffa))

## [1.0.13](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.12...v1.0.13) (2026-03-17)

### Bug Fixes

- **ci:** add signingStyle automatic and teamID to export options ([55b08b3](https://github.com/eyobassey/RapidCapsuleMobile-/commit/55b08b3658cff98df66eda3bec482a8d53e7de60))

## [1.0.12](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.11...v1.0.12) (2026-03-17)

### Bug Fixes

- **ci:** revert export_method to app-store (fastlane doesn't support app-store-connect) ([4ec21e5](https://github.com/eyobassey/RapidCapsuleMobile-/commit/4ec21e527e43dcd2a21ee20f7bdbfb187756567b))

## [1.0.11](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.10...v1.0.11) (2026-03-17)

### Bug Fixes

- **ci:** use PKCS[#8](https://github.com/eyobassey/RapidCapsuleMobile-/issues/8) key for xcodebuild and EC key for fastlane ([a132d39](https://github.com/eyobassey/RapidCapsuleMobile-/commit/a132d39f63d3a73a3f88b77a847a649edbea5e68))

## [1.0.10](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.9...v1.0.10) (2026-03-17)

### Bug Fixes

- **ci:** use absolute path for API key file ([41a104c](https://github.com/eyobassey/RapidCapsuleMobile-/commit/41a104cd073b14f259d1789d9b837df5069414d1))

## [1.0.9](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.8...v1.0.9) (2026-03-17)

### Bug Fixes

- **ci:** pass API key auth args to xcodebuild for auto-provisioning ([e0fa6aa](https://github.com/eyobassey/RapidCapsuleMobile-/commit/e0fa6aa999fde0a8611a594d0753c8d464981342))

## [1.0.8](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.7...v1.0.8) (2026-03-17)

### Bug Fixes

- **ci:** fix base64 decode flag and secret env var references in key step ([47f7a83](https://github.com/eyobassey/RapidCapsuleMobile-/commit/47f7a831e92bfeff3a226a971ec3c278784fba7e))

## [1.0.7](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.6...v1.0.7) (2026-03-17)

### Bug Fixes

- **ci:** convert .p8 key from PKCS[#8](https://github.com/eyobassey/RapidCapsuleMobile-/issues/8) to EC format for OpenSSL compat ([7e874e3](https://github.com/eyobassey/RapidCapsuleMobile-/commit/7e874e3741d56f4a703dfd0525c86fad0d6f4adb))

## [1.0.6](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.5...v1.0.6) (2026-03-17)

### Bug Fixes

- **ci:** use key_filepath instead of key_content to fix OpenSSL curve error ([270a60a](https://github.com/eyobassey/RapidCapsuleMobile-/commit/270a60ad06bb83cab689289d35fe2826ece4da7c))

## [1.0.5](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.4...v1.0.5) (2026-03-17)

### Bug Fixes

- **ci:** upgrade fastlane to >= 2.232.0 to fix invalid curve name error ([e525c6c](https://github.com/eyobassey/RapidCapsuleMobile-/commit/e525c6cb946aa000ac06d4be85a67cc0b469effd))

## [1.0.4](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.3...v1.0.4) (2026-03-17)

### Bug Fixes

- **ci:** add App Store Connect API key auth and automatic signing for iOS CI builds ([f19ec53](https://github.com/eyobassey/RapidCapsuleMobile-/commit/f19ec535c63df818c8877b1db85eef80ca0c8d0e))

## [1.0.3](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.2...v1.0.3) (2026-03-17)

### Bug Fixes

- **auth:** fix 2FA/OTP login flow not navigating to OTP screen ([00687d0](https://github.com/eyobassey/RapidCapsuleMobile-/commit/00687d0980baa85a2fcc7f53a88df938ec0d5230))

## [1.0.2](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.1...v1.0.2) (2026-03-13)

### Bug Fixes

- **ci:** add root fastlane config, fix permissions and iOS build ([bf31c35](https://github.com/eyobassey/RapidCapsuleMobile-/commit/bf31c357ab39c3e432c1990e43c16370a73d0bcc))

## [1.0.1](https://github.com/eyobassey/RapidCapsuleMobile-/compare/v1.0.0...v1.0.1) (2026-03-13)

### Bug Fixes

- **ci:** update Gemfile.lock with fastlane dependency ([1090c30](https://github.com/eyobassey/RapidCapsuleMobile-/commit/1090c30897e529c43e7914b79b35c05ee88c7bdf))

# 1.0.0 (2026-03-13)

### Bug Fixes

- align conflict files with dev (App, HomeScreen) ([d194d9b](https://github.com/eyobassey/RapidCapsuleMobile-/commit/d194d9b5e4808cea6f4727ee6d9804be78325912))
- **auth:** correct idToken key in Google Sign-In API request ([a021307](https://github.com/eyobassey/RapidCapsuleMobile-/commit/a0213076aff56e51f73782270907da06d5301829))
- **auth:** wrap E2E bypass in **DEV** guard for production tree-shaking ([af3f6aa](https://github.com/eyobassey/RapidCapsuleMobile-/commit/af3f6aa166ec34e3d036099b86397895fa38e185))
- **ci:** fix Fastlane resolution and semantic-release permissions ([079dd36](https://github.com/eyobassey/RapidCapsuleMobile-/commit/079dd3661eb61e7f38bcb30b2c465ad990b0a7fd))
- **config:** remove pnpm-specific options from .npmrc ([d757ce4](https://github.com/eyobassey/RapidCapsuleMobile-/commit/d757ce4cd0d2fdcdc78bc6bad326b05b404d6a5d))
- **navigation:** adjust BottomTabBar padding and update border radius for focused state ([d74cac1](https://github.com/eyobassey/RapidCapsuleMobile-/commit/d74cac18ade1e937640ace26df33382cafcc8011))
- resolve merge conflicts in auth flow and App ([888b720](https://github.com/eyobassey/RapidCapsuleMobile-/commit/888b720b5072eea209e211738e8fb8d64fba1b89))
- resolve package.json merge conflict and update husky pre-commit ([fbb21a2](https://github.com/eyobassey/RapidCapsuleMobile-/commit/fbb21a2936b56cb8cb38ce02c2fcf37afc2acf66))
- **ts:** separate detox types from main tsconfig and exclude e2e from app build ([4c58d6c](https://github.com/eyobassey/RapidCapsuleMobile-/commit/4c58d6c26fcb2e0015a752439c9dfa8b49410bb5))
- **ui:** fix TabBar label overlap and spacing ([d8062a6](https://github.com/eyobassey/RapidCapsuleMobile-/commit/d8062a6991287140719da2cd23e823f1c27230e9))
- **ui:** make Button children optional and tidy formatting ([30ab8de](https://github.com/eyobassey/RapidCapsuleMobile-/commit/30ab8deeebe662bbc0a323b88f4e8545f7d58143))
- **ui:** replace FlashList with FlatList in SelectPicker for modal rendering ([caea50d](https://github.com/eyobassey/RapidCapsuleMobile-/commit/caea50d468887df31d8e00a9d6a0990cf7f6db99))
- **ui:** resolve SafeAreaView deprecation in react-native-css-interop ([9ebaabf](https://github.com/eyobassey/RapidCapsuleMobile-/commit/9ebaabfc6f22a69d92925ec8cf66493e107a2c4f))

### Features

- **app:** add splash screen and app icon from assets ([fdedac0](https://github.com/eyobassey/RapidCapsuleMobile-/commit/fdedac0fd65eb867117b2d2d33f0d33cdb886341))
- **auth:** add Apple and Google logos to signup buttons ([decbb70](https://github.com/eyobassey/RapidCapsuleMobile-/commit/decbb70b888fee7d2185c52775c4cff3089bac02))
- **auth:** add Apple and Google sign-in ([34bc5f7](https://github.com/eyobassey/RapidCapsuleMobile-/commit/34bc5f7bb1186c532fd1b40ad5d347b342a87fbe))
- **auth:** add forgot password flow with sheet and store ([dbb9df9](https://github.com/eyobassey/RapidCapsuleMobile-/commit/dbb9df9a35ce814acd5229ab5d9a51c3f7f697fd))
- **auth:** add Google/Apple buttons to Login and cross-links between Login/Signup ([eb4ee67](https://github.com/eyobassey/RapidCapsuleMobile-/commit/eb4ee67589fe44c0584ec6eb630851b5d0df709c))
- **auth:** configure Google Sign-In with iOS client ID ([38224ef](https://github.com/eyobassey/RapidCapsuleMobile-/commit/38224ef6f53b836a47e71f3299201043faa3a02e))
- **auth:** remove Specialist/Patient tab from login screen ([fd73d5a](https://github.com/eyobassey/RapidCapsuleMobile-/commit/fd73d5a561d59b6bc95e06001dff29d81763a401))
- **auth:** unify Google payload to { token, user_type } and add signupWithGoogle ([ed5fefa](https://github.com/eyobassey/RapidCapsuleMobile-/commit/ed5fefaef177844d9050f86cf7952832c5b0e93d))
- **auth:** update Apple Sign-In payload for backend ([179b2dd](https://github.com/eyobassey/RapidCapsuleMobile-/commit/179b2ddbc08f6fc647c07ad4842a3d0190d8ba90))
- **navigation:** show profile avatar in tab bar ([d58665f](https://github.com/eyobassey/RapidCapsuleMobile-/commit/d58665f1abaf823040518a40aff7bd437ffb4718))
- **pharmacy:** migrate pharmacy screens to React Query ([1894c7b](https://github.com/eyobassey/RapidCapsuleMobile-/commit/1894c7bd1ce9da8fc29fb5df2ed156bf3e130540))
- **theme:** set dark mode as default ([dccbfe7](https://github.com/eyobassey/RapidCapsuleMobile-/commit/dccbfe7382000fac2e89737c9b13e92f2caae70c))
- **ui:** add DatePickerInput and use in DependantsScreen ([41fa0c9](https://github.com/eyobassey/RapidCapsuleMobile-/commit/41fa0c914603403347f4c286bc287f24835ea517))
- **ui:** add platform-specific font system ([119187e](https://github.com/eyobassey/RapidCapsuleMobile-/commit/119187e9ae022dec6b3034ed49efb990a1ef2c55))
- **validation:** add form validation to Dependants and Allergies ([02d92d4](https://github.com/eyobassey/RapidCapsuleMobile-/commit/02d92d4248ede97073c67e743e7a090ca83ceba9))
