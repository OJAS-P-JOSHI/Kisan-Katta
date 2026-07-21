# Kisan Katta

A production React Native application built with Expo.

## Tech Stack

- React Native + Expo (SDK 56)
- TypeScript (strict)
- Expo Router (file-based navigation)
- Zustand (state management)
- React Native Paper (UI / Material Design 3)
- Axios (networking)

## Getting Started

```bash
npm install
npm run start      # start the Expo dev server
npm run android    # run on Android
npm run ios        # run on iOS (macOS only)
npm run web        # run in the browser
```

Useful checks:

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
```

## Architecture

Feature-first. Each feature owns its screen, service, types, and mock data. The
`src/app` directory contains thin Expo Router route files that map tabs to feature
screens.

```
src/
  app/                 # Expo Router routes (Bottom Tabs)
    _layout.tsx        # Providers (Paper + navigation theme)
    (tabs)/            # Home, Market, Community, Marketplace, Profile
  features/            # One folder per feature (screen + service + types + mock)
  components/          # Shared, reusable components (added only when needed)
  services/            # Shared API client (Axios)
  store/               # Global Zustand stores
  theme/               # Colors, spacing, radius, Paper + navigation themes
  types/               # Cross-feature domain primitives
  constants/           # Strings and runtime config
  utils/               # Small shared helpers
```

## Conventions

- No hardcoded colors — use `src/theme`.
- No hardcoded user-facing strings — use `src/constants/strings.ts`.
- No `any` — everything is typed.
- Keep screens small and feature-scoped.
