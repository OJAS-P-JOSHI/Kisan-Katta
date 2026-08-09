/** Canonical entry path for the Gram Sahakari application flow. */
export const APPLICATION_ENTRY_PATH = '/application' as const

/** Status page once the draft is no longer editable. */
export const APPLICATION_STATUS_PATH = '/application/status' as const

/** Success confirmation after payment verification. */
export const APPLICATION_SUCCESS_PATH = '/application/success' as const

/** Admin portal entry after OTP when the user is a portal admin. */
export const ADMIN_DASHBOARD_PATH = '/admin/dashboard' as const

/**
 * Sanitizes a farmer/applicant `from` target after login.
 * Open-redirect safe. Does **not** apply role rules — use
 * `getPostLoginDestination` from `@/lib/auth-routing` for that.
 */
export function resolveAuthRedirect(from: unknown): string {
  if (typeof from !== 'string' || !from.startsWith('/')) {
    return APPLICATION_ENTRY_PATH
  }
  if (from.startsWith('//') || from.includes('://')) {
    return APPLICATION_ENTRY_PATH
  }
  if (
    from === APPLICATION_ENTRY_PATH ||
    from.startsWith(`${APPLICATION_ENTRY_PATH}/`) ||
    from === '/profile' ||
    from === '/admin' ||
    from.startsWith('/admin/')
  ) {
    return from
  }
  return APPLICATION_ENTRY_PATH
}

