/** Platform-wide user roles stored on auth_users. */
export const USER_ROLES = [
  "FARMER",
  "GRAM_SAHAKARI",
  "TEAM",
  "ADMIN",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_USER_ROLE: UserRole = "FARMER";
