/** Mirrors backend `admin.constants.ts` for client-side guards. */
export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'SUPPORT',
  'FINANCE',
  'MODERATOR',
  'GRAM_SAHAKARI_TEAM',
  'READ_ONLY',
] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

export const ADMIN_PERMISSIONS = [
  'dashboard',
  'applications',
  'payments',
  'volunteers',
  'farmers',
  'subscriptions',
  'analytics',
  'settings',
  'reports',
  'admins',
  'notifications',
] as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]

export const hasAdminPermission = (
  permissions: readonly string[] | undefined,
  permission: AdminPermission,
): boolean => Boolean(permissions?.includes(permission))
