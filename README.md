# RapidCapsules Mobile

A telemedicine and healthcare platform built with React Native 0.83 + Expo SDK 55 (bare workflow). Connects patients with doctors via real-time consultations, AI health companion (Dr. Eka), medication tracking, pharmacy ordering, and health vitals sync — with iOS 26 Liquid Glass UI support.

---

## Features

- **Doctor consultations** — Browse, book, and join live video appointments (Zoom SDK)
- **Dr. Eka AI** — Conversational AI health companion with chat and voice
- **Pharmacy** — Browse, order, and track medication deliveries
- **Health vitals** — HealthKit (iOS) / Health Connect (Android) sync with dashboard gauges
- **Payments** — Paystack integration with wallet and transaction history
- **Push notifications** — OneSignal for appointment reminders and alerts
- **Passkeys & social auth** — Apple Sign-In, Google Sign-In, biometric passkey support
- **Liquid Glass UI** — Native `UIVisualEffectView` glass cards on iOS 26+, dark card fallback everywhere else

---

## Tech Stack

| Layer           | Library / Tool                                                                   |
| --------------- | -------------------------------------------------------------------------------- |
| Framework       | React Native 0.83.9 + Expo SDK 55 (bare)                                         |
| Language        | TypeScript 5.8                                                                   |
| Navigation      | React Navigation 7 (native-stack, bottom-tabs)                                   |
| Styling         | NativeWind 4 + Tailwind CSS 3                                                    |
| Icons           | Lucide React Native                                                              |
| State           | Zustand 5 (client) + TanStack Query 5 (server)                                   |
| HTTP            | Axios                                                                            |
| Forms           | react-hook-form + Zod                                                            |
| Real-time       | Socket.IO client 4                                                               |
| Animations      | react-native-reanimated 4                                                        |
| Lists           | @shopify/flash-list                                                              |
| Storage         | react-native-mmkv (non-sensitive) + react-native-keychain (tokens)               |
| Keyboard        | react-native-keyboard-controller                                                 |
| Video calls     | @zoom/meetingsdk-react-native                                                    |
| Health          | @kingstinct/react-native-healthkit (iOS) + react-native-health-connect (Android) |
| Push            | react-native-onesignal                                                           |
| Payments        | react-native-paystack-webview                                                    |
| Auth            | Apple Auth + Google Sign-In + react-native-passkey                               |
| Glass UI        | expo-glass-effect (iOS 26+)                                                      |
| Package manager | pnpm 10                                                                          |

---

## Prerequisites

| Tool           | Version                                 |
| -------------- | --------------------------------------- |
| Node.js        | >= 22.11.0                              |
| pnpm           | >= 10.0.0                               |
| Ruby           | 3.3 (for CocoaPods / Fastlane)          |
| Xcode          | 16+                                     |
| Android Studio | Ladybug+                                |
| CocoaPods      | via Bundler (`bundle exec pod install`) |

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/eyobassey/RapidCapsuleMobile.git
cd RapidCapsuleMobile

# 2. Install JS dependencies
pnpm install

# 3. iOS — install Ruby gems then CocoaPods
bundle install
bundle exec pod install

# 4. Set up environment variables
cp .env.example .env
# Fill in API_URL, Zoom credentials, OneSignal app ID, etc.
```

---

## Running the App

```bash
# Start Metro bundler
pnpm start

# iOS simulator
pnpm ios

# Android emulator
pnpm android
```

---

## Available Scripts

| Script                    | Description                                   |
| ------------------------- | --------------------------------------------- |
| `pnpm start`              | Start Metro bundler                           |
| `pnpm ios`                | Run on iOS simulator                          |
| `pnpm android`            | Run on Android emulator                       |
| `pnpm lint`               | ESLint check                                  |
| `pnpm lint:fix`           | ESLint with auto-fix                          |
| `pnpm type-check`         | TypeScript type check (`tsc --noEmit`)        |
| `pnpm test`               | Jest unit tests                               |
| `pnpm test:e2e:ios:build` | Build Detox E2E suite (iOS)                   |
| `pnpm test:e2e:ios`       | Run Detox E2E tests (iPhone 17 Pro simulator) |
| `pnpm release`            | Semantic Release (run on CI only)             |

---

## Project Structure

```
src/
├── components/
│   └── ui/              # Shared primitives (Button, Card, GlassCard, Input, …)
├── config/              # Env vars, React Query client
├── hooks/
│   └── queries/         # TanStack Query hooks (one file per domain)
├── navigation/          # RootNavigator, AuthStack, OnboardingStack, MainTabs
├── screens/             # ~98 screens organised by feature domain
├── services/            # Axios service files + api.ts + api-error.ts
├── store/               # Zustand stores (one file per domain)
├── types/               # Shared TypeScript interfaces
├── utils/               # storage.ts, formatters, PDF, validation
└── theme/               # Design tokens
```

---

## Navigation

The root navigator renders one of three stacks based on auth state:

- **AuthStack** — unauthenticated (login, signup, OTP, passkeys, social auth)
- **OnboardingStack** — authenticated but profile incomplete
- **MainTabs** — fully authenticated; 5-tab bottom navigator (Home, Bookings, Eka, Pharmacy, Profile)

The custom `BottomTabBar` hides itself for screens listed in `HIDE_TAB_SCREENS` (`src/navigation/MainTabs.tsx`).

---

## State Management

Two complementary layers:

1. **Zustand** (`src/store/`) — 16 stores for client/session state. `auth.ts` hydrates tokens from secure storage on startup.
2. **TanStack Query** (`src/hooks/queries/`) — 12 hooks for server state with caching and background refetch.

---

## API Integration

`src/services/api.ts` — Centralized Axios instance:

- Base URL: `https://api.rapidcapsule.com/api`
- JWT attached via request interceptor
- Token refresh queue: on 401, queues concurrent requests, runs a single refresh, then replays the queue
- All errors wrapped into typed classes via `parseApiError()` (`src/services/api-error.ts`)

Backend response envelope: `{ statusCode, message, data }` — services unwrap `.data`.

---

## Liquid Glass UI (iOS 26+)

`GlassCard` (`src/components/ui/GlassCard.tsx`) renders a native `UIVisualEffectView`-backed glass container on iOS 26+ via `expo-glass-effect`. On older iOS and all Android it falls back to the standard dark card (`bg-card border border-border rounded-3xl`).

```tsx
import { GlassCard } from '@/components/ui';

<GlassCard padding="p-6">
  <Text>Content here</Text>
</GlassCard>;
```

The `glassAvailable` check (`Platform.OS === 'ios' && isGlassEffectAPIAvailable()`) is evaluated once at module load — no runtime overhead per render.

---

## Security

- Auth tokens stored in Keychain (iOS) / Keystore (Android) — never MMKV or AsyncStorage
- Token service IDs: `com.rapidcapsule.auth` (access) / `com.rapidcapsule.refresh` (refresh)
- No raw API errors or stack traces surfaced to users — all errors go through `parseApiError()`
- `noUncheckedIndexedAccess` enabled in `tsconfig.json` — all array/record accesses must be null-checked

---

## Health Data

- **iOS**: HealthKit via `@kingstinct/react-native-healthkit` — requires `NSHealthShareUsageDescription` + `NSHealthUpdateUsageDescription` in `Info.plist`
- **Android**: Health Connect via `react-native-health-connect` — requires `android.permission.health.*` permissions

Both are optional features — the app degrades gracefully if permissions are denied.

---

## Testing

```bash
# Unit tests
pnpm test

# Single file
pnpm test -- src/path/to/file.test.ts

# E2E (requires iOS simulator "iPhone 17 Pro")
pnpm test:e2e:ios:build
pnpm test:e2e:ios
```

Jest mocks for native modules live in `src/testing/`. Detox targets iPhone 17 Pro (`.detoxrc.json`).

---

## Platform Support

| Feature         | iOS      | Android                |
| --------------- | -------- | ---------------------- |
| Minimum OS      | iOS 15.1 | Android 8.0 (API 26)   |
| Liquid Glass UI | iOS 26+  | — (dark card fallback) |
| HealthKit       | Yes      | —                      |
| Health Connect  | —        | Yes                    |
| Passkeys        | iOS 16+  | Android 9+             |
| Apple Sign-In   | Yes      | —                      |

---

## CI / CD

| Workflow      | Trigger                      | Runner         |
| ------------- | ---------------------------- | -------------- |
| `ci.yml`      | Push / PR to `main`          | `ubuntu-24.04` |
| `build.yml`   | Manual (`workflow_dispatch`) | `macos-15`     |
| `release.yml` | Push to `main`               | `ubuntu-24.04` |

Semantic Release runs on `main` — Conventional Commits (`feat:`, `fix:`, `chore:`) auto-bump the version and update `CHANGELOG.md`.

---

## Related

- [RapidCapsules API](https://github.com/eyobassey/rapidcapsule) — backend service
- [Expo SDK 55 release notes](https://expo.dev/changelog/2025/sdk-55)
- [expo-glass-effect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)

---

## Author

Built by the RapidCapsules engineering team.
