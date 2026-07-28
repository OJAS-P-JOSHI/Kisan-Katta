# Kisan Katta — Mobile App Documentation

> **Scope:** Expo React Native farmer application at `Mobile App/`  
> **Audit date:** 27 July 2026  
> **Status legend:** ✅ Completed · 🚧 In Progress · ⏳ Pending  
> **Source of truth:** repository code only. No invented features.

---

# Project Overview

Kisan Katta is a production-oriented farmer mobile application for Maharashtra. It authenticates farmers via mobile OTP, completes a profile (district, taluka, village, favourite crops), then provides weather, government mandi prices, community expected-price polls, a peer marketplace, and profile management.

| Field | Value |
|---|---|
| Package name | `kisan-katta` |
| Version | `1.0.0` |
| Entry | `expo-router/entry` |
| Deep-link scheme | `kisankatta` |
| Android package | `com.ojas123464364ffjhd.kisankatta` |
| Orientation | Portrait |
| Primary language in UI | Marathi (marketplace, profile, farmer-price); mixed English elsewhere |

The app talks exclusively to the Kisan Katta backend under `/api/v1/*`. Government mandi and WeatherAPI calls are never made directly from the client.

---

# Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Expo | ~56.0.14 |
| Framework | React Native | 0.85.3 |
| UI library | React | 19.2.3 |
| Routing | expo-router | ~56.2.13 |
| Language | TypeScript | ~6.0.3 (strict) |
| HTTP | axios | ^1.18.1 |
| UI components | react-native-paper | ^5.15.3 |
| Icons | @expo/vector-icons | ^15.0.2 |
| Auth storage | expo-secure-store (via optional native probe) | ~56.0.4 |
| Images | expo-image-picker | ~56.0.20 |
| Dates | @react-native-community/datetimepicker | 9.1.0 |
| Global store (declared, unused) | zustand | ^5.0.14 |
| Animation (declared) | react-native-reanimated / worklets / gesture-handler | present in package.json |

Path aliases (`tsconfig.json`): `@/*` → `./src/*`, `@/assets/*` → `./assets/*`.

---

# Folder Structure

```
Mobile App/
├── app.json                          # Expo config
├── package.json
├── tsconfig.json
├── .env.example / .env.development / .env.production
├── android/                          # Prebuilt native Android project
├── assets/
│   ├── branding/                     # login-hero.png, logo-circle.png
│   ├── expo.icon/                    # iOS icon set
│   └── images/                       # App icons, splash, leftover Expo template PNGs
├── scripts/
│   └── reset-project.js              # Unused Expo template script
└── src/
    ├── app/                          # expo-router route files (thin re-exports)
    │   ├── _layout.tsx               # Root stack + auth guards + providers
    │   ├── (auth)/                   # Splash → mobile → OTP → complete-profile
    │   ├── (tabs)/                   # Home, Market, Farmer Price, Marketplace, Profile
    │   ├── edit-profile.tsx
    │   └── marketplace-*.tsx         # Create, edit, detail, browse, saved, my listings
    ├── components/                   # Shared UI (BrandLeaves, Dropdown, EmptyState, …)
    ├── config/environment.ts         # Sole env consumer
    ├── constants/                    # strings, language.ts (profile language + crop limit)
    ├── features/
    │   ├── auth/
    │   ├── community/                # Empty directory (legacy residue)
    │   ├── farmer-price/
    │   ├── home/
    │   ├── market/
    │   ├── marketplace/
    │   └── profile/
    ├── services/api.ts               # Shared Axios instance
    ├── store/app.store.ts            # Zustand store (unused)
    ├── theme/                        # Design tokens
    ├── types/index.ts                # API envelope types
    └── utils/index.ts
```

---

# Architecture

Feature-first modular architecture:

1. **Thin routes** — Every file under `src/app/` (except layouts) is a one-line re-export of a feature screen.
2. **Feature slices** — Each feature owns screens, hooks, services, types, strings, constants, and components.
3. **Shared Axios client** — `src/services/api.ts`; JWT attached by `AuthContext`.
4. **Centralized env** — `src/config/environment.ts` is the only place that reads `EXPO_PUBLIC_*`.
5. **DTO mirroring** — Auth and profile types explicitly mirror backend DTOs; comments forbid inventing fields.
6. **Hooks as view-models** — Async work returns `{ data, loading, error, refresh|action }`. No React Query / SWR.
7. **Design tokens** — Hex colors live only in `src/theme/colors.ts` (auth screens currently violate this).
8. **Declarative auth gating** — `Stack.Protected` in root layout, keyed on `isAuthenticated && user.isProfileCompleted`.

```
User action
  → Screen
  → Feature hook
  → Feature service
  → shared axios (api.ts)
  → Backend /api/v1/*
  → ApiSuccessResponse<T> / ApiErrorResponse
  → getErrorMessage / feature error mapper
  → Screen UI (skeleton / spinner / empty / snackbar)
```

---

# Navigation

## Root stack (`src/app/_layout.tsx`)

Providers (outer → inner): `SafeAreaProvider` → `PaperProvider` → expo-router `ThemeProvider` → `StatusBar` → `AuthProvider` → `RootNavigator`.

| Guard | Routes |
|---|---|
| `canEnterApp` (JWT + profile complete) | `(tabs)`, `edit-profile`, all `marketplace-*` screens |
| `!canEnterApp` | `(auth)` only |

## Auth stack (`src/app/(auth)/`)

| Route | Screen | Purpose |
|---|---|---|
| `index` | SplashScreen | Session restore gate |
| `mobile` | MobileNumberScreen | 10-digit mobile entry |
| `otp` | OtpScreen | 6-digit OTP verify / resend |
| `complete-profile` | CompleteProfileScreen | First-time profile create |

## Bottom tabs (`src/app/(tabs)/_layout.tsx`)

Uses `expo-router/js-tabs`. Bar height 64; MaterialCommunityIcons; active tint = theme primary.

| Tab | Route | Label | Icon |
|---|---|---|---|
| 1 | `index` | Home | `home-variant` |
| 2 | `market` | Market | `chart-line` |
| 3 | `farmer-price` | अपेक्षित भाव | `currency-inr` |
| 4 | `marketplace` | Marketplace | `storefront` |
| 5 | `profile` | Profile | `account-circle` |

Typed routes are enabled (`experiments.typedRoutes: true`).

---

# State Management

| Mechanism | Location | Status |
|---|---|---|
| Auth Context | `features/auth/context/AuthContext.tsx` | ✅ Primary global state (`token`, `user`, `login`, `logout`, `refreshUser`) |
| Zustand `useAppStore` | `store/app.store.ts` | ⏳ Declared (`isReady` / `setReady`) but **never consumed** |
| Local hooks + `useState` | Per feature | ✅ All feature data fetching |
| JWT SecureStore | `features/auth/storage/authStorage.ts` | ✅ Key `jwtToken` |
| Vote cache SecureStore | `farmer-price.vote-storage.ts` | ✅ UI-only; not cleared on logout |

No Redux, MobX, or React Query. Profile is not cached globally — `useMyProfile` is called independently by Home, Profile, Edit Profile, and listing form (parallel `/profile/me` requests).

---

# API Layer

**Client:** `src/services/api.ts`  
**Base URL:** `EXPO_PUBLIC_API_BASE_URL`  
**Timeout:** `EXPO_PUBLIC_REQUEST_TIMEOUT` (default 10000 ms)  
**Envelope:** `{ success: true, data: T }` / `{ success: false, message: string }`

### Endpoints called by the app

| Feature | Method | Path |
|---|---|---|
| Auth | POST | `/api/v1/auth/send-otp` |
| Auth | POST | `/api/v1/auth/verify-otp` |
| Auth | GET | `/api/v1/auth/me` |
| Profile | POST | `/api/v1/profile` |
| Profile | GET | `/api/v1/profile/me` |
| Profile | PUT | `/api/v1/profile/me` |
| Profile | POST | `/api/v1/profile/image` |
| Profile | DELETE | `/api/v1/profile/image` |
| Weather | GET | `/api/v1/weather/current` |
| Weather | GET | `/api/v1/weather/forecast` |
| Weather | GET | `/api/v1/weather/alerts` |
| Market | GET | `/api/v1/market/favourites` |
| Market | GET | `/api/v1/market/prices` | *(defined in service, never called by any screen)* |
| Marketplace | CRUD + save + contact + images | `/api/v1/marketplace/*` |
| Farmer Price | GET/POST | `/api/v1/farmer-price/polls/*` |

Images upload through the backend to Cloudinary — the app never talks to Cloudinary directly.

There is **no global 401 interceptor**. Only `AuthContext.refreshUser` auto-logs out on 401.

---

# Authentication

✅ **Completed** OTP phone login with JWT session restore.

### Flow

1. **Cold start** — `AuthProvider` reads JWT from SecureStore; if present, calls `GET /auth/me`.
2. **Splash** — While loading, show branded spinner; then route to `/mobile`, `/complete-profile`, or let the root guard admit `(tabs)`.
3. **Mobile** — Digits only, max 10, regex `/^\d{10}$/` → `POST /auth/send-otp`.
4. **OTP** — Six-box input, 30 s resend cooldown via `useCountdown`. In `APP_ENV=development`, backend OTP is shown in a “डेव्हलपर OTP” pill.
5. **Verify** — `POST /auth/verify-otp` → `login(token)` → persist + attach `Authorization: Bearer` → refetch `/me`.
6. **Complete profile** — If `isProfileCompleted === false`, stay on Complete Profile until `POST /profile` succeeds and `refreshUser()` flips the guard.
7. **Logout** — Confirmed via Paper Dialog; deletes token and clears header.

### Token storage notes

`authStorage.ts` deliberately avoids a top-level `expo-secure-store` import (documented: `requireNativeModule` throws before try/catch). It probes `requireOptionalNativeModule('ExpoSecureStore')`. In development without the native module, it falls back to an in-memory `devMemoryToken`. In production without the native module, get/set silently no-op.

No refresh-token mechanism. No server-side logout (backend logout is a no-op acknowledgement).

---

# Current Screens

| Screen | Path | Status | Notes |
|---|---|---|---|
| Splash | `features/auth/screens/SplashScreen.tsx` | ✅ | Session restore + branding |
| Mobile Number | `features/auth/screens/MobileNumberScreen.tsx` | ✅ | Functional; duplicates theme/strings locally |
| OTP | `features/auth/screens/OtpScreen.tsx` | ✅ | Same theme/string duplication |
| Complete Profile | `features/profile/screens/CompleteProfileScreen.tsx` | ✅ | Wraps `ProfileForm` + `useSaveProfile` |
| Home | `features/home/HomeScreen.tsx` | 🚧 | Live weather; four “coming soon” placeholder cards |
| Market | `features/market/MarketScreen.tsx` | 🚧 | Favourites prices only; no search/filter/trends |
| Farmer Price | `features/farmer-price/FarmerPriceScreen.tsx` | ✅ | Polls, vote, comments sheet |
| Marketplace hub | `features/marketplace/MarketplaceScreen.tsx` | ✅ | Search, hero cards, quick actions |
| Produce listings | `…/ProduceListingsScreen.tsx` | ✅ | `ListingsBrowse listingType="produce"` |
| Product listings | `…/ProductListingsScreen.tsx` | ✅ | `ListingsBrowse listingType="product"` |
| Listing detail | `…/ListingDetailScreen.tsx` | ✅ | Carousel, owner actions, dial/WhatsApp |
| Create listing | `…/CreateListingScreen.tsx` | ✅ | Images then POST |
| Edit listing | `…/EditListingScreen.tsx` | ✅ | Load + `ListingForm` |
| My listings | `…/MyListingsScreen.tsx` | ✅ | ACTIVE/SOLD/ARCHIVED client filter (single page) |
| Saved listings | `…/SavedListingsScreen.tsx` | ✅ | Paginated + optimistic unsave |
| Profile | `features/profile/ProfileScreen.tsx` | ✅ | Avatar, crops, logout |
| Edit Profile | `features/profile/screens/EditProfileScreen.tsx` | ✅ | Update + photo |

No bare stub screens exist. Stub-like UI is limited to `PlaceholderCard` on Home.

---

# Components

### Shared (`src/components/`)

| Component | Purpose | Status |
|---|---|---|
| `BrandLeaves` | Decorative leaf watermarks (6 variants) | ✅ |
| `Dropdown` | Single-select Paper modal list | ✅ |
| `EmptyState` | Branded empty/error with optional action | ✅ |
| `OrganicBackground` | Soft hill/orb wash (`subtle` \| `soft`) | ✅ |
| `MultiSelectChips` | Cap + freeform chip multi-select | ⏳ **Never imported** (superseded by `CropMultiSelect`) |

### Auth

- `OtpInput` — six-box OTP with paste distribution and auto-advance ✅

### Home

- `DashboardHeader`, `WeatherCard`, `WeatherAlertCard`, `ForecastList`, `ForecastCard`, `WeatherSkeleton`, `PlaceholderCard` ✅

### Farmer Price

- `PollCard`, `PollBlock`, `VoteCard`, `ThankYouCard`, `CommentsBottomSheet`, `FarmerPriceSkeleton` ✅

### Marketplace

- `ListingsBrowse`, `ListingCard`, `CategoryChips`, `CropSelector`, `HarvestDateField`, `ListingForm`, `ListingImagePicker`, `ListingImageCarousel`, `ListingLifecycleDialogs`, `ListingStateViews`, `ListingStatusBadge` ✅

### Profile

- `ProfileForm`, `ProfileAvatar`, `CropMultiSelect` ✅

---

# Hooks

| Hook | Feature | Role |
|---|---|---|
| `useSendOtp` / `useVerifyOtp` / `useCountdown` | Auth | OTP send/verify + resend timer |
| `useCurrentWeather` / `useForecast` / `useWeatherAlerts` | Home | District-scoped weather |
| `useMyProfile` / `useSaveProfile` / `useUpdateProfile` / `useProfilePhoto` | Profile | CRUD + camera/gallery photo |
| `useDebouncedValue` | Profile & Marketplace | **Duplicated** in both features |
| `usePaginatedListings` | Marketplace | Infinite scroll + stale-request guard |
| `useSavedListingIds` | Marketplace | Bootstrap saved ids + optimistic toggle |
| `useListingImages` | Marketplace | Max 3 images, sequential upload, progress |
| `useListingLifecycleActions` | Marketplace | Mark sold / archive dialogs |
| `useMyFarmerPricePoll` / `useSubmitFarmerVote` | Farmer Price | Polls + local vote cache |

---

# Services

| File | Role |
|---|---|
| `services/api.ts` | Shared Axios instance |
| `features/auth/services/auth.service.ts` | send OTP, verify OTP, get me |
| `features/profile/profile.service.ts` | Profile CRUD + image |
| `features/home/weather.service.ts` | Current / forecast / alerts |
| `features/home/home.service.ts` | **Mock** home summary (300 ms sleep); never called by screens |
| `features/market/market.service.ts` | Mandi favourites (+ unused state-wide prices) |
| `features/marketplace/marketplace.service.ts` | Full listing lifecycle + images |
| `features/farmer-price/farmer-price.service.ts` | My polls, detail (N+1 fan-out), vote |
| `features/auth/storage/authStorage.ts` | JWT persistence |
| `features/farmer-price/farmer-price.vote-storage.ts` | Local submitted-vote cache |

---

# Utilities

| Location | Exports |
|---|---|
| `utils/index.ts` | `sleep`, `getErrorMessage`, `isUnauthorizedError` |
| `marketplace.utils.ts` | Price/date formatting, image normalize, dial/WhatsApp phone helpers, status colors |
| `marketplace.errors.ts` | Marathi timeout / network / 5xx / 400 mapping |
| `market.errors.ts` | English market error mapping |
| `weather.utils.ts` | Icon mapping, rain/humidity/UV labels, greeting, day format |
| `farmer-price.utils.ts` | Rupee format, diff chip, remaining progress, price sanitize |
| `features/crop/` | Crop Master API — list, search, labels (`getCropLabel`) |
| `features/location/` | Location Master API — districts, talukas, villages |
| `constants/language.ts` | `SUPPORTED_LANGUAGES`, `DEFAULT_LANGUAGE`, `MAX_FAVOURITE_CROPS` |

---

# Assets

### Used in code

| Asset | Usage |
|---|---|
| `assets/images/icon.png` | SplashScreen |
| `assets/branding/login-hero.png` | Auth hero |
| `assets/branding/logo-circle.png` / `logo-glow.png` | Home `DashboardHeader` |

### Present but unused (Expo template leftovers)

`react-logo*.png`, `expo-badge*.png`, `expo-logo.png`, `tutorial-web.png`, entire `images/tabIcons/` (tabs use vector icons).

### Fonts

**None.** `expo-font` is a dependency but never imported. No font files under `assets/`. Typography uses platform defaults + weight tokens.

### Icons

Exclusively `@expo/vector-icons` MaterialCommunityIcons.

---

# Localization

❌ No i18n library and no runtime language switching.

| Source | Language |
|---|---|
| `constants/strings.ts` | Mostly English; Marathi for farmer-price tab |
| `marketplace.strings.ts` | Fully Marathi |
| `profile.strings.ts` | Fully Marathi |
| `farmer-price.strings.ts` | Mixed English labels + Marathi validation/empty states |
| Auth screens | Marathi hardcoded inline (bypasses `strings.auth.*`) |

Model constants: `SUPPORTED_LANGUAGES = ['mr','en','hi']`, `DEFAULT_LANGUAGE = 'mr'`. `ProfileForm` always sends `DEFAULT_LANGUAGE` to satisfy the API contract. `LANGUAGE_LABELS` is exported but never used. No language picker UI.

---

# Design System

Defined under `src/theme/`.

### Colors (`colors.ts`)

Palette: green scale (`#1B5E20`…`#EEF5EB`), amber, sand `#F8F7F2`, mist, ink, slate, steel, red, blue, orange. Mapped to MD3 roles via `lightColors` (primary = green700).

### Spacing / radius / elevation (`theme.ts`)

| Token | Values |
|---|---|
| spacing | xs 4 · sm 8 · md 16 · lg 24 · xl 32 · xxl 48 |
| radius | sm 8 · md 12 · lg 16 · xl 20 · pill 999 |
| elevation | `soft`, `card` |
| surfaces | `cardSurface`, `buttonSurface` (minHeight 48) |

### Typography (`typography.ts`)

`largeHeading` 26/700 · `mediumHeading` 22/600 · `sectionTitle` 17/600 · `body` 15/400 · `caption` 13/400  
`iconSize`: xs 14 → hero 48

### Paper / Navigation themes

`paperTheme` = MD3LightTheme + `lightColors`. `navigationTheme` kept in sync. Hook: `useAppTheme()`.

**Known violation:** `MobileNumberScreen` and `OtpScreen` declare private local color/spacing maps (~20 hardcoded hex values each).

---

# Environment Variables

Names only (from `.env.example`, `.env.development`, `.env.production`):

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Backend base URL |
| `EXPO_PUBLIC_REQUEST_TIMEOUT` | Axios timeout (ms) |
| `EXPO_PUBLIC_APP_ENV` | `development` \| `production` (gates dev OTP UI + memory token fallback) |

Consumed only in `src/config/environment.ts`. Defaults: base URL `''`, timeout `10000`, env `'development'`.

> Note: `.gitignore` ignores `.env*.local` only — the three env files above are tracked in git. They contain no secrets (public API URL only).

---

# Dependencies

See [Tech Stack](#tech-stack) for the full declared set.

**Declared but not imported in `src/`:** `expo-constants`, `expo-font`, `expo-linking`, `expo-splash-screen` (plugin only), `expo-system-ui`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`, `react-dom`, `react-native-web`.

**Imported but not declared:** `expo-modules-core` (transitive via `expo`; used by `authStorage` and vote storage).

---

# Build & Run

```bash
cd "Mobile App"
npm install
npm start          # expo start
npm run android    # expo run:android
npm run ios        # expo run:ios (no ios/ directory present — requires prebuild)
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
```

### Expo configuration highlights (`app.json`)

- Plugins: `expo-router`, `expo-splash-screen`, `expo-secure-store`, datetimepicker, image-picker (Marathi permission strings)
- Experiments: `typedRoutes`, `reactCompiler`
- Splash background `#208AEF` (blue — does not match green brand palette)
- No `eas.json`, no `extra.eas.projectId`, no OTA updates config
- No iOS `bundleIdentifier`; no Android `versionCode`
- Committed `android/` native project exists; `ios/` does not

### Permissions

| Permission | Source |
|---|---|
| Camera / Photos | `expo-image-picker` plugin + runtime requests in profile & marketplace hooks |
| INTERNET, storage, VIBRATE, SYSTEM_ALERT_WINDOW | AndroidManifest (prebuild) |
| Deep link `kisankatta://` | Android intent filter |
| Location | **Not requested** — weather uses profile district |

### Push notifications

❌ **None.** No `expo-notifications`, no FCM/APNs config, no notification plugin.

### Offline handling

❌ **No offline mode.** Network failures surface localized “check your connection” messages with retry. No NetInfo, no request queue, no response cache.

---

# Current Features

| Feature | Status |
|---|---|
| OTP authentication + JWT session restore | ✅ |
| Profile create / view / edit | ✅ |
| Profile photo (camera/gallery → Cloudinary via backend) | ✅ |
| Favourite crops (Maharashtra curated + Agmarknet search) | ✅ |
| District-scoped weather (current, alerts, 7-day forecast) | ✅ |
| Mandi prices for favourite crops | ✅ |
| Farmer expected-price polls (vote, comments, confidence) | ✅ |
| Marketplace browse / create / edit / save / contact | ✅ |
| Mark listing sold / archive | ✅ |
| Bottom-tab navigation + auth guards | ✅ |
| Marathi-first marketplace & profile copy | ✅ |

---

# In Progress Features

| Feature | Evidence | Status |
|---|---|---|
| Home dashboard beyond weather | Four `PlaceholderCard`s: Favourite Crops, Today’s Market Prices, Government Schemes, Agriculture News | 🚧 |
| Market search / filter / trends | Strings exist; UI and `getMarketPrices` unused | 🚧 |
| Multi-language UI | `SUPPORTED_LANGUAGES` modeled; hardcoded to `mr` | 🚧 |
| Auth screen theming cleanup | Local color maps bypass `src/theme` and `strings.ts` | 🚧 |
| My Listings status tabs at scale | Client filter over one unpaginated page | 🚧 |
| Farmer-price “my vote” | Local SecureStore cache because backend has no my-vote endpoint | 🚧 |

---

# Pending Features

| Item | Evidence | Status |
|---|---|---|
| Community feature | Empty `src/features/community/`; deprecated `tabs.community` string | ⏳ |
| Home summary API | `home.service.ts` returns mock (`unreadMessages` implies messaging that does not exist) | ⏳ |
| Custom fonts / splash bootstrap | `useAppStore.isReady` comment; `expo-font` unused | ⏳ |
| Push notifications | No dependency or config | ⏳ |
| Offline / cache layer | Not present | ⏳ |
| EAS Build / iOS release config | No `eas.json`, no `ios/`, no bundle id | ⏳ |
| Gram Sahakari / payments / rewards / verification | Backend modules exist; **zero mobile references** | ⏳ |

---

# Future Roadmap

Derived **only** from code comments and placeholders (no invented items):

1. Wire Home summary to a real API when the endpoint exists (`home.service.ts`).
2. Fill Home placeholder sections: Favourite Crops, Market Prices, Government Schemes, Agriculture News (`strings.ts` / `HomeScreen`).
3. Market browse with search and trends (`strings.market.*`, unused `getMarketPrices`).
4. Persistent “my vote” once a backend endpoint exists (`farmer-price.vote-storage.ts`).
5. Font loading / splash gating via `useAppStore` (`app.store.ts` comment).
6. Remove stale Community residue (`features/community/`, deprecated tab string).
7. Swap in a dedicated leaf asset on auth screens (`MobileNumberScreen` comment).

There are **zero** `TODO` / `FIXME` / `HACK` / `WIP` markers in `src/`.

---

# Production Readiness

### Strengths

- TypeScript strict; DTOs pinned to backend shapes
- Single env-driven Axios client; no hardcoded URLs in app code
- Consistent per-feature error normalization (timeout / network / 5xx / 400)
- Careful SecureStore optional-native handling
- Accessibility labels and 48 px touch targets on key controls
- Stale-request and double-submit guards in listing and auth flows

### Gaps (visible in code)

| Gap | Impact |
|---|---|
| No `eas.json` / iOS bundle id / Android versionCode | Not releasable via EAS as-is |
| No crash reporting, analytics, or React error boundary | Silent white-screen on render failures |
| No tests | Zero test files / runners |
| No refresh token / global 401 interceptor | Expired JWT mid-session surfaces generic errors |
| Production SecureStore missing → silent logout | Tokens vanish with no diagnostic |
| Redundant `/profile/me` fetches | Extra load on every screen mount |
| `getMyPollDetails` N+1 fan-out | Scales with favourite crop count |
| Splash blue vs brand green | Visual inconsistency |
| Dead code / unused deps / template assets | Maintenance noise |

**Verdict:** Feature-complete for the farmer MVP surfaces that exist (auth, weather, market favourites, farmer price, marketplace, profile), but **not production-releasable** without EAS/iOS config, crash reporting, SMS-backed OTP on the backend, and cleanup of known session/error gaps.
