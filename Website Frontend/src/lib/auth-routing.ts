/**
 * Role-first post-login / applicant-entry routing.
 *
 * Product roles for this surface: ADMIN vs FARMER (GS applicant).
 *
 * Priority (always):
 *   ADMIN / portal admin → /admin/dashboard
 *   otherwise            → farmer / Gram Sahakari routes
 *
 * An existing Gram Sahakari application must never override ADMIN.
 */

import {
  ADMIN_DASHBOARD_PATH,
  APPLICATION_ENTRY_PATH,
  resolveAuthRedirect,
} from '@/lib/application-entry'
import type { UserRole } from '@/types/auth.types'

/** Minimal identity shape from verify-otp, /auth/me, or AuthContext. */
export type AuthIdentity = {
  role?: UserRole | string | null
  isAdmin?: boolean | null
}

/** Portal admin or platform ADMIN — never a GS applicant on this site. */
export function isAdminIdentity(
  user: AuthIdentity | null | undefined,
): boolean {
  if (!user) return false
  return Boolean(user.isAdmin) || user.role === 'ADMIN'
}

export function getAdminPortalDestination(): string {
  return ADMIN_DASHBOARD_PATH
}

/**
 * Single source of truth for where an authenticated user should land.
 * `requestedFrom` is only honored for non-admin users (open-redirect safe).
 */
export function getPostLoginDestination(
  user: AuthIdentity | null | undefined,
  requestedFrom?: unknown,
): string {
  if (isAdminIdentity(user)) {
    return getAdminPortalDestination()
  }
  return resolveAuthRedirect(requestedFrom)
}

/**
 * Href for Apply / Portal / Become CTA targets.
 * ADMIN → admin dashboard; farmers / anonymous → `/application`.
 */
export function getApplicantEntryPath(
  user: AuthIdentity | null | undefined,
): string {
  if (isAdminIdentity(user)) {
    return getAdminPortalDestination()
  }
  return APPLICATION_ENTRY_PATH
}
