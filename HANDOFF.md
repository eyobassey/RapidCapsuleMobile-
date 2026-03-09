# RapidCapsule Mobile App - Developer Handoff Guide

**Date:** March 9, 2026
**Repo:** [RapidCapsuleMobile-](https://github.com/eyobassey/RapidCapsuleMobile-)
**Backend API:** https://api.rapidcapsule.com/api
**Backend Repo:** Private (NestJS, MongoDB) - access will be provided separately

---

## 1. What This App Does

RapidCapsule is a telemedicine platform. The mobile app is the **patient-facing client** with:

- **Authentication** — Email/password, OTP, passkey, Google/Apple OAuth
- **AI Health Checkup** — Infermedica-powered symptom assessment with Claude AI summaries
- **Eka AI Assistant** — Conversational health assistant (chat + voice)
- **Appointments** — Book specialists, video consultations (Zoom), in-person visits
- **Prescriptions** — View, manage, upload prescriptions; PDF generation
- **Pharmacy** — Browse drugs, cart, order with Paystack payments
- **Vitals Monitoring** — Log blood pressure, glucose, weight, temperature, etc.
- **Apple HealthKit** — Native iOS health data sync
- **Recovery Tracking** — Mental health check-ins, milestones, screenings
- **Wallet & Credits** — Fund wallet, AI credit system
- **Real-time Messaging** — Socket.IO chat with specialists
- **Notifications** — Push notification preferences and history

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.84.1 (bare CLI, New Architecture enabled) |
| Language | TypeScript 5.8.3 |
| State Management | Zustand 5.x |
| HTTP Client | Axios 1.13.x |
| Navigation | React Navigation 7.x (native-stack, bottom-tabs) |
| Styling | NativeWind 4.2.2 (Tailwind CSS for RN) |
| Icons | Lucide React Native |
| Secure Storage | react-native-keychain (tokens), MMKV (non-sensitive data) |
| Payments | react-native-paystack-webview |
| Health Data | react-native-health (Apple HealthKit) |
| Animations | react-native-reanimated 4.x |
| WebSocket | socket.io-client 4.x |
| PDF Generation | react-native-html-to-pdf |

---

## 3. Project Structure

```
src/
├── config/
│   └── env.ts                 # Centralized environment configuration
├── components/
│   ├── ui/                    # Base UI components (Button, Input, Avatar, ErrorBoundary)
│   ├── appointments/          # Booking flow components
│   ├── charts/                # Data visualization
│   ├── health-checkup/        # Health checkup flow UI
│   ├── messages/              # Chat UI components
│   ├── navigation/            # Custom BottomTabBar
│   ├── onboarding/            # Profile completion steps
│   ├── pharmacy/              # Drug listing, cart components
│   ├── prescriptions/         # Prescription cards, timeline
│   └── recovery/              # Recovery tracking UI
├── hooks/
│   ├── useCurrency.ts         # Currency formatting hook
│   └── useSocket.ts           # Socket.IO connection hook
├── navigation/
│   ├── RootNavigator.tsx      # Auth → Onboarding → Main routing
│   ├── AuthStack.tsx          # Login, Signup, OTP screens
│   ├── OnboardingStack.tsx    # Profile completion flow
│   ├── MainTabs.tsx           # Bottom tab navigator (5 tabs)
│   └── stacks/                # Feature-specific stack navigators
├── screens/                   # ~50+ screen components
│   ├── auth/                  # Login, Signup, OTP, Email verification
│   ├── bookings/              # Appointment booking & management
│   ├── health-checkup/        # AI symptom assessment flow
│   ├── main/                  # HomeScreen, EkaChatScreen
│   ├── messages/              # Messaging screens
│   ├── notifications/         # Notification center
│   ├── onboarding/            # Profile setup steps
│   ├── pharmacy/              # Drug store, cart, orders
│   ├── prescriptions/         # Prescription management
│   ├── profile/               # Settings, edit profile, devices
│   ├── recovery/              # Mental health tracking
│   └── vitals/                # Health vitals logging
├── services/                  # API service layer (18 service files)
│   ├── api.ts                 # Axios instance with auth interceptors
│   ├── api-error.ts           # Typed error classes (ApiError, NetworkError)
│   ├── appointments.service.ts
│   ├── eka.service.ts
│   ├── healthCheckup.service.ts
│   ├── pharmacy.service.ts
│   ├── socket.service.ts      # Socket.IO real-time client
│   └── ...                    # (14 more service files)
├── store/                     # Zustand stores (16 stores)
│   ├── auth.ts                # Auth state, login/logout, hydration
│   ├── appointments.ts
│   ├── healthCheckup.ts
│   ├── pharmacy.ts
│   └── ...                    # (12 more stores)
├── theme/
│   └── colors.ts              # Design tokens (matches tailwind.config.js)
├── types/                     # TypeScript interfaces per feature
│   ├── api.types.ts           # ApiResponse<T>, PaginatedResponse<T>
│   ├── appointment.types.ts
│   └── ...
└── utils/
    ├── constants.ts           # Enums, mappings, defaults
    ├── currency.ts            # Currency conversion utilities
    ├── formatters.ts          # Date/number formatting
    ├── storage.ts             # Keychain + MMKV storage abstraction
    ├── artifactPdf.ts         # PDF generation for artifacts
    └── healthCheckupPdf.ts    # PDF generation for health reports
```

---

## 4. Architecture Patterns

### State Management
- **Zustand** for all state (client + server)
- Each feature has its own store file
- Stores call services directly for API requests
- Auth store hydrates on app startup from secure storage

### Networking
- Centralized Axios instance (`src/services/api.ts`)
- JWT auto-attached via request interceptor
- 401 responses trigger full logout
- Typed error handling via `ApiError` / `NetworkError` classes
- Environment config in `src/config/env.ts`

### Storage
- **react-native-keychain** for JWT tokens (iOS Keychain / Android Keystore)
- **MMKV** for non-sensitive data (user cache, preferences)
- Same async interface — consumers don't know which backend is used

### Navigation Flow
```
RootNavigator
├── AuthStack (not authenticated)
│   ├── LoginScreen
│   ├── SignupScreen
│   ├── OTPScreen
│   └── EmailVerificationScreen
├── OnboardingStack (authenticated, incomplete profile)
│   ├── PersonalDetailsScreen
│   ├── AddressEmergencyScreen
│   └── DependantsScreen
└── MainTabs (authenticated, complete profile)
    ├── Home → HomeStack
    ├── Bookings → BookingsStack
    ├── Eka → EkaStack
    ├── Pharmacy → PharmacyStack
    └── Profile → ProfileStack
```

### Styling
- NativeWind (Tailwind CSS) via `className` prop
- Design tokens in `tailwind.config.js` and `src/theme/colors.ts`
- Inter font family (Regular, Medium, SemiBold, Bold)
- Dark theme by default (navy background, sky blue primary)

---

## 5. Backend API Reference

**Base URL:** `https://api.rapidcapsule.com/api`
**Auth:** Bearer JWT token in `Authorization` header
**Response format:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

### Key Endpoints

| Feature | Method | Endpoint |
|---------|--------|----------|
| Login | POST | `/auth/login` |
| OTP Verify | POST | `/auth/otp/verify` |
| Google Auth | POST | `/auth/google` |
| Get Profile | GET | `/users/me` |
| Update Profile | PATCH | `/users/:id` |
| Health Checkup | POST | `/health-checkup` |
| Diagnosis | POST | `/health-checkup/diagnosis` |
| Appointments | GET/POST | `/appointments` |
| Available Specialists | GET | `/appointments/available-specialists` |
| Prescriptions | GET | `/prescriptions` |
| Vitals | GET/POST | `/vitals` |
| Drugs | GET | `/pharmacy/drugs` |
| Cart | POST | `/pharmacy/cart` |
| Orders | POST | `/pharmacy/orders` |
| Wallet Balance | GET | `/wallets/balance` |
| Initialize Payment | POST | `/payments/initialize` |
| Notifications | GET | `/notifications` |
| Eka Chat | POST | `/eka/message` |
| Recovery | GET | `/recovery/enrollments` |

Full Swagger docs: `https://api.rapidcapsule.com/api/docs`

---

## 6. Getting Started

### Prerequisites
- Node.js >= 22.11.0
- Xcode 26+ (iOS)
- Android Studio (Android)
- CocoaPods

### Setup
```bash
git clone https://github.com/eyobassey/RapidCapsuleMobile-.git
cd RapidCapsuleMobile-
npm install                    # Also runs patch-package via postinstall
cd ios && pod install && cd ..

# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Metro bundler
npx react-native start
```

### Scripts
```bash
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
npm run start        # Start Metro bundler
npm run type-check   # TypeScript type checking
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm test             # Jest tests
```

### Patches
The project uses `patch-package` to fix native module compatibility:
- `react-native-health` — Fixed `setBridge:` removal in RN 0.84 New Architecture + deprecated `unarchiveObjectWithData:` for iOS 26 SDK

---

## 7. Known Issues & Technical Debt

### What's been addressed in this handoff:
- [x] Environment configuration centralized (`src/config/env.ts`)
- [x] Secure token storage via react-native-keychain
- [x] TypeScript strict mode enabled
- [x] Typed API error handling (`ApiError`, `NetworkError`)
- [x] ErrorBoundary component added
- [x] Pre-commit hooks (Husky + lint-staged) configured
- [x] iOS build fix for Xcode 26 / RN 0.84 compatibility

### Remaining items to address:
- [ ] **React Query migration** — Server state in Zustand stores should migrate to React Query for caching, deduplication, and background refresh. Start with high-traffic queries (appointments, vitals, wallet balance)
- [ ] **Form validation** — Add `react-hook-form` + `zod` for structured validation (login, signup, onboarding, booking forms)
- [ ] **Accessibility** — Add `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` to interactive components
- [ ] **FlashList** — Replace `FlatList` with `@shopify/flash-list` in high-volume lists (prescriptions, drugs, notifications)
- [ ] **Test coverage** — Currently minimal. Priority: auth flows, health checkup, payment flows
- [ ] **Offline support** — Consider NetInfo + queue for vitals logging when offline
- [ ] **Deep linking** — Configure for appointment links, notification taps

### Architecture decisions to discuss:
- **Expo migration** — Evaluate if the native module requirements (HealthKit, Keychain) justify staying on bare RN or if Expo's `prebuild` workflow would help. Not urgent.
- **Repository pattern** — Services already provide a clean abstraction. A formal repository layer adds indirection without clear benefit at current scale.
- **i18n** — Only needed if multi-language support is planned. Not a priority for MVP.

---

## 8. Design System

### Colors (Dark Theme)
| Token | Value | Usage |
|-------|-------|-------|
| background | `#151c2c` | Screen backgrounds |
| card | `#1a2236` | Card surfaces |
| foreground | `#f8fafc` | Primary text |
| muted | `#222d44` | Subtle backgrounds |
| mutedForeground | `#7c8ba3` | Secondary text |
| primary | `#0ea5e9` | CTA buttons, links |
| secondary | `#f97316` | Accents, badges |
| accent | `#6366f1` | Highlights |
| destructive | `#f43f5e` | Errors, warnings |
| success | `#10b981` | Positive states |

### Typography
- `font-display` — Inter-Bold (headings)
- `font-sans` — Inter-Regular (body)
- `font-sans-medium` — Inter-Medium
- `font-sans-semibold` — Inter-SemiBold

### Component Library (`src/components/ui/`)
- `Button` — Primary/secondary/outline variants
- `Input` — Text input with label, error state
- `Avatar` — User avatar with fallback
- `ErrorBoundary` — Crash recovery wrapper

---

## 9. Feature Implementation Status

| Feature | Status | Key Files |
|---------|--------|-----------|
| Auth (email/password) | Complete | `screens/auth/`, `store/auth.ts` |
| Auth (Google/Apple) | Complete | `store/auth.ts` |
| 2FA / OTP | Complete | `screens/auth/OTPScreen.tsx` |
| Onboarding | Complete | `screens/onboarding/`, `store/onboarding.ts` |
| Home Dashboard | Complete | `screens/main/HomeScreen.tsx` |
| Health Checkup (AI) | Complete | `screens/health-checkup/`, `store/healthCheckup.ts` |
| Eka AI Chat | Complete | `screens/main/EkaChatScreen.tsx`, `store/eka.ts` |
| Appointments | Complete | `screens/bookings/`, `store/appointments.ts` |
| Prescriptions | Complete | `screens/prescriptions/`, `store/prescriptions.ts` |
| Pharmacy | Complete | `screens/pharmacy/`, `store/pharmacy.ts` |
| Vitals | Complete | `screens/vitals/`, `store/vitals.ts` |
| Wallet & Payments | Complete | `store/wallet.ts`, Paystack WebView |
| Messaging | Complete | `screens/messages/`, `store/messaging.ts` |
| Notifications | Complete | `screens/notifications/`, `store/notifications.ts` |
| Recovery Tracking | Complete | `screens/recovery/`, `store/recovery.ts` |
| Apple HealthKit | Complete | `services/appleHealth.service.ts` |
| Profile & Settings | Complete | `screens/profile/` |
| PDF Reports | Complete | `utils/healthCheckupPdf.ts`, `utils/artifactPdf.ts` |

---

## 10. Contacts

- **Project Owner:** Bassey Eyo (bassey@rom-flex.com)
- **Backend API:** NestJS on api.rapidcapsule.com (port 5020)
- **Admin Panel:** admin.rapidcapsule.com (separate Vue.js app)
- **Swagger Docs:** https://api.rapidcapsule.com/api/docs
