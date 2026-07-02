import * as SecureStore from 'expo-secure-store';

/**
 * The ONLY module in the app allowed to touch Expo SecureStore. Everything
 * else (including the rest of the auth feature) must go through
 * `AuthContext`, which is the sole consumer of this module.
 *
 * Stores exactly one value: the JWT token. Nothing else belongs here.
 */
const JWT_TOKEN_KEY = 'jwtToken';

/**
 * SecureStore is not fully implemented on every platform (e.g. web). Every
 * function here fails safe — a storage error is treated as "no token"
 * rather than crashing the app or hanging the auth bootstrap.
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(JWT_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(JWT_TOKEN_KEY, token);
  } catch {
    // Non-fatal: the session still works in-memory for the current app run.
  }
};

export const deleteToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(JWT_TOKEN_KEY);
  } catch {
    // Non-fatal — see `setToken`.
  }
};
