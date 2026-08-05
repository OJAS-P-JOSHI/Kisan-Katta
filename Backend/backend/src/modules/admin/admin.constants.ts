/**
 * Admin portal RBAC — scalable for multiple admins.
 * Today only SUPER_ADMIN is seeded; other roles are ready for assignment.
 */

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "SUPPORT",
  "FINANCE",
  "MODERATOR",
  "GRAM_SAHAKARI_TEAM",
  "READ_ONLY",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "dashboard",
  "applications",
  "payments",
  "volunteers",
  "farmers",
  "assistance",
  "subscriptions",
  "marketplace",
  "audit",
  "analytics",
  "settings",
  "reports",
  "admins",
  "notifications",
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
    "farmers",
    "assistance",
    "subscriptions",
    "marketplace",
    "audit",
    "analytics",
    "settings",
    "reports",
    "notifications",
  ],
  MANAGER: [
    "dashboard",
    "applications",
    "payments",
    "volunteers",
    "farmers",
    "assistance",
    "subscriptions",
    "marketplace",
    "audit",
    "analytics",
    "reports",
    "notifications",
  ],
  SUPPORT: [
    "dashboard",
    "applications",
    "payments",
    "volunteers",
    "farmers",
    "assistance",
    "subscriptions",
    "marketplace",
    "notifications",
  ],
  FINANCE: [
    "dashboard",
    "payments",
    "subscriptions",
    "farmers",
    "applications",
    "reports",
    "audit",
    "notifications",
  ],
  MODERATOR: [
    "dashboard",
    "assistance",
    "marketplace",
    "farmers",
    "notifications",
  ],
  GRAM_SAHAKARI_TEAM: [
    "dashboard",
    "applications",
    "volunteers",
    "farmers",
    "payments",
    "reports",
  ],
  READ_ONLY: [
    "dashboard",
    "applications",
    "volunteers",
    "farmers",
    "assistance",
    "subscriptions",
    "marketplace",
    "payments",
    "analytics",
    "reports",
    "audit",
  ],
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
