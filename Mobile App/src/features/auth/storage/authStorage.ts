import { requireOptionalNativeModule } from 'expo-modules-core';

import { APP_ENV } from '@/config/environment';

import type { AuthUser } from '../types/auth.types';

/**
 * The ONLY module in the app allowed to persist the JWT and a small user
 * snapshot. Everything else must go through `AuthContext`.
 *
 * Never import `expo-secure-store` here — that package calls
 * `requireNativeModule('ExpoSecureStore')` at load time and throws before any
 * try/catch can run. Instead, probe the native module with
 * `requireOptionalNativeModule`, which returns null when unavailable (e.g.
 * outdated Expo Go). Production/dev-client builds with the module linked are
 * unaffected.
 *
 * Native `ExpoSecureStore` methods require a SecureStoreOptions record
 * (the JS SDK always passes `{}`). Omitting it rejects the native call.
 */
const JWT_TOKEN_KEY = 'jwtToken';
const AUTH_USER_KEY = 'authUser';
const STORE_OPTIONS: Record<string, unknown> = {};

type SecureStoreNative = {
  getValueWithKeyAsync: (key: string, options: Record<string, unknown>) => Promise<string | null>;
  setValueWithKeyAsync: (
    value: string,
    key: string,
    options: Record<string, unknown>,
  ) => Promise<void>;
  deleteValueWithKeyAsync: (key: string, options: Record<string, unknown>) => Promise<void>;
};

let nativeStore: SecureStoreNative | null | undefined;
/** Dev-only in-memory session when the native module is unavailable in Expo Go. */
let devMemoryToken: string | null = null;
let devMemoryUser: AuthUser | null = null;

function getNativeSecureStore(): SecureStoreNative | null {
  if (nativeStore !== undefined) return nativeStore;
  nativeStore = requireOptionalNativeModule<SecureStoreNative>('ExpoSecureStore');
  return nativeStore;
}

function canUseDevFallback(): boolean {
  return APP_ENV === 'development' && getNativeSecureStore() === null;
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AuthUser>;
  return typeof candidate.userId === 'string' && typeof candidate.mobile === 'string';
}

async function readItem(key: string): Promise<string | null> {
  const store = getNativeSecureStore();
  if (!store) return null;
  return store.getValueWithKeyAsync(key, STORE_OPTIONS);
}

async function writeItem(key: string, value: string): Promise<void> {
  const store = getNativeSecureStore();
  if (!store) return;
  await store.setValueWithKeyAsync(value, key, STORE_OPTIONS);
}

async function removeItem(key: string): Promise<void> {
  const store = getNativeSecureStore();
  if (!store) return;
  await store.deleteValueWithKeyAsync(key, STORE_OPTIONS);
}

export const getToken = async (): Promise<string | null> => {
  const store = getNativeSecureStore();
  if (!store) {
    return canUseDevFallback() ? devMemoryToken : null;
  }
  try {
    return await readItem(JWT_TOKEN_KEY);
  } catch {
    return canUseDevFallback() ? devMemoryToken : null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  const store = getNativeSecureStore();
  if (!store) {
    if (canUseDevFallback()) devMemoryToken = token;
    return;
  }
  try {
    await writeItem(JWT_TOKEN_KEY, token);
  } catch {
    if (canUseDevFallback()) devMemoryToken = token;
  }
};

export const getCachedUser = async (): Promise<AuthUser | null> => {
  const store = getNativeSecureStore();
  if (!store) {
    return canUseDevFallback() ? devMemoryUser : null;
  }
  try {
    const raw = await readItem(AUTH_USER_KEY);
    if (!raw) return canUseDevFallback() ? devMemoryUser : null;
    const parsed: unknown = JSON.parse(raw);
    return isAuthUser(parsed) ? parsed : null;
  } catch {
    return canUseDevFallback() ? devMemoryUser : null;
  }
};

export const setCachedUser = async (user: AuthUser): Promise<void> => {
  const store = getNativeSecureStore();
  if (!store) {
    if (canUseDevFallback()) devMemoryUser = user;
    return;
  }
  try {
    await writeItem(AUTH_USER_KEY, JSON.stringify(user));
    if (canUseDevFallback()) devMemoryUser = user;
  } catch {
    if (canUseDevFallback()) devMemoryUser = user;
  }
};

/** Clears JWT and cached profile. Used by logout and invalid-session handling. */
export const clearSession = async (): Promise<void> => {
  const store = getNativeSecureStore();
  if (!store) {
    if (canUseDevFallback()) {
      devMemoryToken = null;
      devMemoryUser = null;
    }
    return;
  }
  try {
    await removeItem(JWT_TOKEN_KEY);
  } catch {
    /* still clear the rest */
  }
  try {
    await removeItem(AUTH_USER_KEY);
  } catch {
    /* ignore */
  }
  if (canUseDevFallback()) {
    devMemoryToken = null;
    devMemoryUser = null;
  }
};
