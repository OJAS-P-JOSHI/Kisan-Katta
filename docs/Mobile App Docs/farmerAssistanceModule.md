# Farmer Assistance Module

> **Scope:** Complete Farmer Assistance feature — mobile (`Mobile App/src/features/assistance/`) + backend (`Backend/backend/src/modules/assistance/`) + admin moderation routes
> **Audience:** Engineers joining or maintaining this production module
> **Source of truth:** Current repository implementation (August 2026)
> **Related docs:** [`marketModule.md`](./marketModule.md), [`farmerPriceModule.md`](./farmerPriceModule.md), [`profileScreen.md`](./profileScreen.md)

---

## Purpose

Farmer Assistance lets **verified farmers publish a genuine help request** so the community can respond with guidance, awareness, and moral support.

**Version 1 is publishing + community support only.** There is no money movement anywhere in this module: no UPI, QR codes, Razorpay, wallets, donations, or fundraising goals. "Support" records a stance (*I stand with this farmer*), never a payment.

| Responsibility | Description |
|---|---|
| **Assistance tab** | Public feed of open / resolved help requests |
| **Create flow** | Farmer types only title, description, and 1–3 proof photos |
| **Author snapshot** | Name, photo, village, taluka, district, state, verified frozen at publish time |
| **Publish** | Create publishes as `OPEN` immediately so other farmers can see it; admins can still reject / archive |
| **Active limit** | At most 2 active (`PENDING_REVIEW` + `OPEN`) requests per farmer |
| **Support / Report / Share** | One support and one report per user per request; native share sheet |
| **Owner lifecycle** | Edit while pending/open, mark resolved, soft delete |

---

## User Experience

The farmer fills in three fields. Everything else is read from their profile by the server:

| Field | Rule |
|---|---|
| Title | Required, max 80 characters |
| Description | Required, 100–3000 characters (what happened, current situation, help expected) |
| Proof photos | Required, 1–3 images, JPEG / PNG / WEBP, ≤ 5 MB each after compression |

The app **never** asks for name, profile photo, phone, village, taluka, district, state, date, or time. `AuthorAutoFillCard` previews the profile values that will be attached so the farmer can see what is published.

---

## Status Flow

```
OPEN ──resolve (author)──▶ RESOLVED
 │                            │
 └──reject (admin)──▶ REJECTED │
 │                             │
 └──────── archive (admin) ──▶ ARCHIVED ◀─────────┘

Legacy / admin-held PENDING_REVIEW ──approve──▶ OPEN
```

- New requests publish as **`OPEN` immediately** and appear in the public feed.
- Public feed shows `OPEN` and `RESOLVED` only.
- `PENDING_REVIEW` (legacy / admin-held), `REJECTED`, and `ARCHIVED` are visible to the author alone (a non-owner request for them returns 404).
- Active quota counts `PENDING_REVIEW` + `OPEN`. Resolving, rejecting, or archiving frees a slot.
- Deletes are **soft** (`isDeleted: true`, `deletedAt`), never hard.

---

## Backend

`Backend/backend/src/modules/assistance/` follows the module pattern used elsewhere in the API: **controller → service → repository → MongoDB**. Controllers only parse and respond; all rules live in the service.

| File | Role |
|---|---|
| `assistance.constants.ts` | Statuses, limits, image rules, Cloudinary folder, pagination defaults |
| `assistance.types.ts` | Documents, request bodies, query objects, DTOs |
| `assistance.model.ts` | `help_requests`, `help_request_supports`, `help_request_reports` + indexes |
| `assistance.validation.ts` | Text sanitizing, length rules, rejects client-supplied author fields |
| `assistance.query.ts` | Shared query parsing for farmer and admin controllers |
| `assistance.repository.ts` | All Mongoose access (pagination, atomic counters, status transitions) |
| `assistance.service.ts` | Author snapshot, active limit, visibility, moderation, DTO mapping |
| `assistance.controller.ts` | Farmer-facing handlers |
| `assistance.admin.controller.ts` | Moderation handlers |
| `assistance.routes.ts` | `/api/v1/assistance` (optional auth on public reads) |
| `assistance.admin.routes.ts` | `/api/v1/admin/assistance` (JWT + portal admin + `assistance` permission) |
| `assistance.upload.middleware.ts` | Multer memory storage, MIME + size + count limits |
| `assistance.image.service.ts` | Cloudinary `upload_stream`, delete, rollback on partial failure |
| `assistance.image.controller.ts` | Upload / delete handlers |
| `assistance.image.utils.ts`, `assistance.image.validation.ts` | Folder-scoped `publicId` checks and image normalization |

### API

All responses use the standard envelope: `{ success: true, data }` or `{ success: false, message }`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/assistance` | Optional | Feed; `page`, `limit`, `sort` (`newest` \| `most_supported`), `search`, `district`, `status` (`OPEN` \| `RESOLVED`) |
| `POST` | `/api/v1/assistance` | Required | Verified users only; creates `OPEN`; 409 when the active limit is reached |
| `GET` | `/api/v1/assistance/:id` | Optional | Owners also see non-public statuses |
| `PATCH` | `/api/v1/assistance/:id` | Required | Owner, only while `PENDING_REVIEW` or `OPEN` |
| `PATCH` | `/api/v1/assistance/:id/resolve` | Required | Owner |
| `DELETE` | `/api/v1/assistance/:id` | Required | Owner, soft delete |
| `POST` | `/api/v1/assistance/:id/support` | Required | One per user (unique index); 409 on duplicate |
| `POST` | `/api/v1/assistance/:id/report` | Required | Reasons `SPAM`, `FAKE_INFORMATION`, `INAPPROPRIATE_IMAGES`, `OTHER`; one per user |
| `GET` | `/api/v1/assistance/my-assistance` | Required | Author's requests, any status |
| `GET` | `/api/v1/assistance/my-summary` | Required | Status counts + `activeCount`, `maxActive`, `canCreate` |
| `POST` | `/api/v1/assistance/images/upload` | Required | `multipart/form-data`, field `images`, ≤ 3 files, ≤ 5 MB each |
| `DELETE` | `/api/v1/assistance/images` | Required | Body `{ publicId }`, scoped to the assistance folder |
| `GET` | `/api/v1/admin/assistance` | Admin | Moderation queue; `status`, `district`, `search`, pagination |
| `PATCH` | `/api/v1/admin/assistance/:id/approve` | Admin | `PENDING_REVIEW` → `OPEN` |
| `PATCH` | `/api/v1/admin/assistance/:id/reject` | Admin | `PENDING_REVIEW` \| `OPEN` → `REJECTED` |
| `PATCH` | `/api/v1/admin/assistance/:id/archive` | Admin | Any non-archived → `ARCHIVED` |

Admin routes require the `assistance` permission, which is part of `ADMIN_PERMISSIONS` and granted to `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SUPPORT`, and `READ_ONLY` role sets.

### Data model

```ts
HelpRequest {
  _id
  author: { userId, name, profilePhoto, village, taluka, district, state, verified }  // immutable snapshot
  title, description
  images: [{ url, publicId }]        // Cloudinary metadata only — never binary
  status: PENDING_REVIEW | OPEN | RESOLVED | REJECTED | ARCHIVED
  supportCount, reportCount
  isDeleted, deletedAt
  reviewedAt, reviewedBy, moderationNote
  resolvedAt
  createdAt, updatedAt
}
```

Supports and reports live in their own collections with a `{ requestId, userId }` **unique index**, so duplicates are impossible even under concurrent requests. Counters on `HelpRequest` are incremented atomically after the insert succeeds.

Indexes: `status`, `author.userId`, `author.district`, `createdAt`, plus compound indexes for the feed (`isDeleted + status + createdAt`, `isDeleted + status + supportCount + createdAt`), district and author listings, and a `title`/`description` text index for search.

### Validation

- JWT required for every write; only `isVerified` accounts may create.
- Title ≤ 80 chars; description 100–3000 chars; text sanitized before storage.
- Images 1–3, image MIME types only (`image/jpeg`, `image/png`, `image/webp`), ≤ 5 MB each; oversized or unsupported files are rejected by Multer before Cloudinary.
- Author fields in a request body are rejected — the snapshot always comes from the profile.
- ObjectIds validated before every lookup.

---

## Mobile

`Mobile App/src/features/assistance/` is self-contained and feature-first, matching the marketplace layout.

| File | Role |
|---|---|
| `assistance.constants.ts` | Mirrors server limits, compression quality, pagination, filter tokens |
| `assistance.types.ts` | DTO types with ISO date strings |
| `assistance.strings.ts` | All Marathi copy + status / reason label helpers |
| `assistance.errors.ts` | Axios error → Marathi message, 409 conflict detection |
| `assistance.utils.ts` | Time-ago, place formatting, status chip colors, deep link, share text |
| `assistance.service.ts` | Axios calls against `/api/v1/assistance` |
| `AssistanceScreen.tsx` | Tab root: feed, search, sort, note card, CTAs |
| `hooks/usePaginatedHelpRequests.ts` | Feed and "my requests" pagination, refresh, in-place updates |
| `hooks/useProofPhotos.ts` | Camera / gallery picking, client-side checks, Cloudinary upload |
| `hooks/useHelpRequestActions.ts` | Support, share, report |
| `hooks/useHelpRequestLifecycle.ts` | Resolve and delete confirmations |
| `hooks/useMyAssistanceSummary.ts` | Status counts and the server-owned `canCreate` gate |
| `hooks/useDebouncedValue.ts` | Search debounce |
| `components/HelpRequestCard.tsx` | Feed card: author, status chip, title, preview, first photo, actions |
| `components/AuthorIdentity.tsx` | Photo, name, verified badge, village · district, time posted |
| `components/HelpRequestStatusChip.tsx` | Semantic status chip |
| `components/HelpRequestActionsBar.tsx` | Support / Share / Report row (compact and full variants) |
| `components/ProofPhotoCarousel.tsx` | Paged photos with fullscreen viewer |
| `components/ProofPhotoPicker.tsx` | Photo tiles, upload progress, retry |
| `components/HelpRequestForm.tsx` | Title, description, photos + client validation |
| `components/AuthorAutoFillCard.tsx` | Read-only preview of the profile fields that get snapshotted |
| `components/ReportRequestDialog.tsx` | Reason picker + optional details |
| `components/HelpRequestConfirmDialog.tsx` | Resolve / delete confirmation |
| `components/MyAssistanceSummaryCard.tsx` | Status counts + active quota pill |
| `components/AssistanceStateViews.tsx` | Loading / error / empty states (wraps shared `EmptyState`) |
| `components/HelpRequestSkeleton.tsx` | Feed placeholder cards |
| `screens/CreateHelpRequestScreen.tsx` | Publish flow, gated by `canCreate` |
| `screens/EditHelpRequestScreen.tsx` | Author edit while pending/open |
| `screens/HelpRequestDetailScreen.tsx` | Carousel, farmer info, full description, actions, owner lifecycle |
| `screens/MyHelpRequestsScreen.tsx` | Summary, status filter chips, per-request owner actions |

Design comes entirely from the existing system: `cardSurface`, `buttonSurface`, `spacing`, `radius`, `typography`, `iconSize`, `useAppTheme`, React Native Paper components, `EmptyState`, and `OrganicBackground`. No new visual language was introduced.

### Navigation

The Assistance tab is inserted **immediately before Profile**, so the bar reads: Home → Market → अपेक्षित भाव → Marketplace → सहाय्य → Profile. The existing tab bar styling, animations, and active indicator are untouched; only one `Tabs.Screen` (icon `hand-heart`) was added.

| Route | File |
|---|---|
| `/(tabs)/assistance` | `src/app/(tabs)/assistance.tsx` |
| `/assistance-create` | `src/app/assistance-create.tsx` |
| `/assistance-my-requests` | `src/app/assistance-my-requests.tsx` |
| `/assistance-request/[id]` | `src/app/assistance-request/[id].tsx` |
| `/assistance-edit/[id]` | `src/app/assistance-edit/[id].tsx` |

Stack screens are registered inside the protected stack in `src/app/_layout.tsx` with Marathi headers.

### Sharing and deep links

`buildHelpRequestLink` uses `expo-linking`'s `createURL`, producing `kisankatta:///assistance-request/<id>` on device (the app scheme in `app.json`) and an origin-relative URL on web. Because the share text already carries a route-shaped link, enabling universal / app links later needs no code change here.

### Performance

- Feed and "my requests" are paginated (10 per page) with infinite scroll and pull-to-refresh.
- Cards render one image; the carousel loads the rest only on the detail screen.
- Photos are compressed by the picker (quality `0.6`) before upload, and only Cloudinary URLs are stored.
- Support and report update the card in place instead of refetching the page.

---

## Future Ready (intentionally not implemented)

The module is structured so these can be added without reshaping it — do **not** treat any as existing behaviour:

QR donations · UPI payments · Razorpay · NGO accounts · Government accounts · comments · AI moderation · government scheme suggestions · volunteer matching · fundraising goals.

Extension points: new statuses in `HELP_REQUEST_STATUSES`, new sub-documents on `HelpRequest`, new service functions behind the existing controller/route split, and new admin permissions on the already-registered `assistance` permission.
