# Hey Aarav - Welcome to RapidCapsule Mobile

Thanks for coming on board. Here's everything you need to get up to speed.

---

## What you're picking up

RapidCapsule is a **telemedicine app** — patients use it to do AI-powered health checkups, book appointments with specialists, manage prescriptions, order drugs, track vitals, and chat with doctors in real time. The mobile app is **feature-complete** with 80+ screens across 18 features, all connected to a live NestJS backend.

The app was built rapidly to validate the product. Before handing it off, we went through a full architecture cleanup to make sure you're inheriting a solid, maintainable codebase — not a pile of tech debt.

---

## What was done to prepare for you

We addressed every item from your architecture review. Here's what changed:

### From your review (all resolved)

| Your concern | What we did |
|-------------|------------|
| Token storage in MMKV (security risk) | Migrated to `react-native-keychain` — iOS Keychain / Android Keystore. MMKV kept for non-sensitive data only. |
| Hardcoded API URLs and keys | Created `src/config/env.ts` — all config centralized in one file |
| TypeScript strict mode off | Enabled `"strict": true` in tsconfig |
| No form validation | Added `react-hook-form` + `zod` — 7 screens refactored with typed schemas |
| No error boundaries | Added `ErrorBoundary` component wrapping the root app |
| No pre-commit hooks | Configured Husky + lint-staged (ESLint + Prettier on commit) |
| No React Query (manual server state) | Added 30+ query/mutation hooks, 10 key screens migrated |
| FlatList performance | Replaced with `@shopify/flash-list` in all 20 list screens |
| No accessibility | Added a11y props to all ~80 screens — roles, labels, states on every interactive element |
| No offline support | Added NetInfo + offline request queue with auto-sync + OfflineBanner |
| No deep linking | Configured `rapidcapsule://` and `https://rapidcapsule.com` URL schemes |
| No tests | 159 tests across 13 suites — stores, services, validation, API client |
| Inconsistent error handling | Created typed `ApiError` / `NetworkError` classes with `parseApiError()` |

### What's still on you

These are minor items we left for you to own going forward:

- **Push notifications** — Firebase Cloud Messaging / APNs setup
- **Remaining React Query migration** — Pharmacy, messaging, and health checkup screens still use Zustand for data fetching. Query hooks exist, screens just need to adopt them.
- **More form validation** — MedicalHistory, Allergies, Dependants, Checkout screens
- **E2E tests** — Detox or Maestro for end-to-end flows

### On Expo migration

Your review recommended migrating to Expo. Our take: **not urgent**. The app runs on bare React Native 0.84 with New Architecture enabled. Native modules (HealthKit, Keychain) work. The build pipeline works. If you want to evaluate `expo prebuild` later, the codebase won't fight you — but a full migration now would be rewrite-level effort with limited upside given the current state.

---

## Getting started

```bash
git clone https://github.com/eyobassey/RapidCapsuleMobile-.git
cd RapidCapsuleMobile-
npm install                    # Installs deps + applies patches + sets up husky
cd ios && pod install && cd ..
npx react-native run-ios       # or run-android
```

### Key commands
```bash
npm run type-check    # TypeScript checking
npm run lint:fix      # Auto-fix lint issues
npm test              # Run 159 tests
```

---

## Key files to read first

| File | Why |
|------|-----|
| `HANDOFF.md` | Full technical reference — architecture, all endpoints, design system, every feature |
| `src/config/env.ts` | All environment config in one place |
| `src/services/api.ts` | How every API call works (auth, errors, interceptors) |
| `src/store/auth.ts` | Auth flow — login, logout, hydration, onboarding detection |
| `src/navigation/RootNavigator.tsx` | App routing logic (auth vs onboarding vs main) |
| `src/screens/main/HomeScreen.tsx` | Good example of React Query + Zustand together |
| `src/hooks/queries/index.ts` | All available React Query hooks |
| `src/utils/validation.ts` | All Zod validation schemas |

---

## Backend access

- **API base:** `https://api.rapidcapsule.com/api`
- **Swagger docs:** `https://api.rapidcapsule.com/api/docs`
- **Response format:** `{ statusCode, message, data }`
- **Auth:** Bearer JWT in Authorization header
- Backend repo access — I'll send separately

---

## How the app is structured (quick version)

```
Screen → React Query hook (server data) + Zustand store (client state)
           ↓
       Service layer (src/services/*.service.ts)
           ↓
       Axios client (src/services/api.ts) → env config → API
```

- **React Query** handles fetching, caching, background refresh for server data
- **Zustand** handles UI state, form state, selected items, auth
- **Services** are thin wrappers around API endpoints — one per feature
- **Screens** compose hooks and render UI with NativeWind (Tailwind)

---

## Design system

Dark theme, Inter font family, Tailwind-based:

| Token | Hex | Usage |
|-------|-----|-------|
| primary | `#0ea5e9` | CTAs, links |
| secondary | `#f97316` | Accents, badges |
| background | `#151c2c` | Screen backgrounds |
| card | `#1a2236` | Card surfaces |
| success | `#10b981` | Positive states |
| destructive | `#f43f5e` | Errors |

Full design tokens are in `tailwind.config.js` and `src/theme/colors.ts`.

---

## Questions?

Reach me at bassey@rom-flex.com. Happy to walk through any part of the codebase on a call.

Welcome aboard.

— Bassey
