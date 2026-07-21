/**
 * Thin wrapper around Web Storage. On mobile the app uses expo-secure-store;
 * the browser equivalent is `localStorage` (persists across refreshes and tabs)
 * with an in-memory fallback for private-mode / SSR safety. Everything auth
 * goes through this single interface, matching the mobile `authStorage` shape.
 */

const memoryStore = new Map<string, string>()

const getBackend = (): Storage | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // Access to localStorage can throw (private mode, blocked cookies).
  }
  return null
}

export const storageService = {
  get(key: string): string | null {
    const backend = getBackend()
    if (!backend) return memoryStore.get(key) ?? null
    try {
      return backend.getItem(key)
    } catch {
      return memoryStore.get(key) ?? null
    }
  },

  set(key: string, value: string): void {
    const backend = getBackend()
    if (!backend) {
      memoryStore.set(key, value)
      return
    }
    try {
      backend.setItem(key, value)
    } catch {
      memoryStore.set(key, value)
    }
  },

  remove(key: string): void {
    memoryStore.delete(key)
    const backend = getBackend()
    if (!backend) return
    try {
      backend.removeItem(key)
    } catch {
      // Ignore — memory copy already cleared.
    }
  },
}
