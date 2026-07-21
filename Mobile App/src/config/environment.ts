/**
 * Centralized environment configuration. Single source of truth for backend
 * connectivity — every service must read `API_BASE_URL` / `REQUEST_TIMEOUT`
 * from here instead of hardcoding a URL.
 *
 * Values come only from Expo public environment variables (`EXPO_PUBLIC_*`),
 * which Metro inlines at build time from `.env.development` / `.env.production`
 * (see `.env.example` for the template). To point at a different backend,
 * change `EXPO_PUBLIC_API_BASE_URL` in the relevant `.env` file — never edit
 * application code. For example, on an Android Emulator the dev backend is
 * reachable at `10.0.2.2` (the emulator's alias for the host machine) rather
 * than `localhost`; see `.env.development` for the exact value to use.
 */

export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export const REQUEST_TIMEOUT: number = Number(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT) || 10000;

export const APP_ENV: string = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
