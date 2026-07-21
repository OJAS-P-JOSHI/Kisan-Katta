import { requireOptionalNativeModule } from 'expo-modules-core';

import { APP_ENV } from '@/config/environment';

/**
 * The ONLY module in the app allowed to persist the JWT. Everything else must
 * go through `AuthContext`.
 *
 * Never import `expo-secure-store` here — that package calls
 * `requireNativeModule('ExpoSecureStore')` at load time and throws before any
 * try/catch can run. Instead, probe the native module with
 * `requireOptionalNativeModule`, which returns null when unavailable (e.g.
 * outdated Expo Go). Production/dev-client builds with the module linked are
 * unaffected.
 */
const JWT_TOKEN_KEY = 'jwtToken';

type SecureStoreNative = {
  getValueWithKeyAsync: (key: string, options?: Record<string, unknown>) => Promise<string | null>;
  setValueWithKeyAsync: (value: string, key: string, options?: Record<string, unknown>) => Promise<void>;
  deleteValueWithKeyAsync: (key: string, options?: Record<string, unknown>) => Promise<void>;
};

let nativeStore: SecureStoreNative | null | undefined;
/** Dev-only in-memory token when the native module is unavailable in Expo Go. */
let devMemoryToken: string | null = null;

function getNativeSecureStore(): SecureStoreNative | null {
  if (nativeStore !== undefined) return nativeStore;
  nativeStore = requireOptionalNativeModule<SecureStoreNative>('ExpoSecureStore');
  return nativeStore;
}

function canUseDevFallback(): boolean {
  return APP_ENV === 'development' && getNativeSecureStore() === null;
}

export const getToken = async (): Promise<string | null> => {
  const store = getNativeSecureStore();
  if (!store) {
    return canUseDevFallback() ? devMemoryToken : null;
  }
  try {
    return await store.getValueWithKeyAsync(JWT_TOKEN_KEY);
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
    await store.setValueWithKeyAsync(token, JWT_TOKEN_KEY);
  } catch {
    if (canUseDevFallback()) devMemoryToken = token;
  }
};

export const deleteToken = async (): Promise<void> => {
  const store = getNativeSecureStore();
  if (!store) {
    if (canUseDevFallback()) devMemoryToken = null;
    return;
  }
  try {
    await store.deleteValueWithKeyAsync(JWT_TOKEN_KEY);
  } catch {
    if (canUseDevFallback()) devMemoryToken = null;
  }
};
