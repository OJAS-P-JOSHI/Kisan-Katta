import { storageService } from '@/services/storage.service'

/**
 * JWT token persistence. Uses the same storage key (`jwtToken`) as the mobile
 * app so the strategy is identical wherever applicable. Only the token is
 * persisted — the user is always re-fetched from `/auth/me`, exactly like
 * mobile.
 */
const JWT_TOKEN_KEY = 'jwtToken'

export const tokenService = {
  getToken(): string | null {
    return storageService.get(JWT_TOKEN_KEY)
  },

  setToken(token: string): void {
    storageService.set(JWT_TOKEN_KEY, token)
  },

  clearToken(): void {
    storageService.remove(JWT_TOKEN_KEY)
  },
}
