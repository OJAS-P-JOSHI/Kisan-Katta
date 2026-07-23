/** Mirrors backend `admin.constants.ts` for client-side guards. */
export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'SUPPORT',
  'READ_ONLY',
] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

export const ADMIN_PERMISSIONS = [
  'dashboard',
  'applications',
  'payments',
  'volunteers',
  'farmers',
  'analytics',
  'settings',
  'reports',
  'admins',
] as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]
