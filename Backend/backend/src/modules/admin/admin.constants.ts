/**
 * Admin portal RBAC — scalable for multiple admins.
 * Today only SUPER_ADMIN is seeded; other roles are ready for assignment.
 */

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "SUPPORT",
  "READ_ONLY",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "dashboard",
  "applications",
  "payments",
  "volunteers",
  "analytics",
  "settings",
  "reports",
  "admins",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/** Default permission sets per role — source of truth for future grants. */
export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  SUPER_ADMIN: ADMIN_PERMISSIONS,
  ADMIN: [
    "dashboard",
    "applications",
    "payments",
    "volunteers",
    "analytics",
    "settings",
    "reports",
  ],
  MANAGER: [
    "dashboard",
    "applications",
    "payments",
    "volunteers",
    "analytics",
    "reports",
  ],
  SUPPORT: ["dashboard", "applications", "volunteers"],
  READ_ONLY: ["dashboard", "applications", "volunteers", "analytics", "reports"],
};

/** First SUPER_ADMIN — seeded idempotently on boot. */
export const SUPER_ADMIN_SEED = {
  name: "Mahesh Shridhar Chautmal",
  phoneNumber: "+917741075483",
  email: "m.chautmal2020@gmail.com",
  role: "SUPER_ADMIN" as const,
  address: {
    line1: "Solanapur",
    taluka: "Rahatgaon",
    district: "Paithan",
    city: "Chhatrapati Sambhajinagar",
    state: "Maharashtra",
    pincode: "431107",
  },
} as const;
