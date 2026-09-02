# Kissan Agrisathi Marketplace — End-to-End Reference

Permanent technical and product reference for Marketplace. Describes the **current implementation** in this repository (Mobile App, Backend, Website Admin). Do not treat this as a roadmap.

- **Brand:** Kissan Agrisathi
- **Feature name (Marathi):** बाजारपेठ
- **Code namespace:** `marketplace`
- **API prefix:** `/api/v1/marketplace`
- **Admin API prefix:** `/api/v1/admin/marketplace`

This document is **not** split into implementation phases. Historical QA counts (54/54, 72/72, 76/76) are release-criteria snapshots of the same feature, not separate products.

---

## 1. Marketplace overview

Marketplace is a **farmer-to-farmer classifieds** system inside Kissan Agrisathi. Farmers in Maharashtra can:

- list शेतमाल (produce), शेती साहित्य (farm inputs/products), or मजूर कट्टा (farm labour)
- browse, search, filter, and sort public listings
- save listings
- manage their own listings (edit, mark sold/hired, archive, renew, duplicate-as-prefill)
- contact another farmer by **Call** or **WhatsApp** after a protected contact request
- report a listing for admin review

It is **not** e-commerce.

### NOT IMPLEMENTED (do not assume these exist)

| Capability | Status |
|---|---|
| Checkout / cart | NOT IMPLEMENTED |
| Payment between buyer and seller | NOT IMPLEMENTED |
| Escrow | NOT IMPLEMENTED |
| Delivery / logistics | NOT IMPLEMENTED |
| In-app chat | NOT IMPLEMENTED |
| Seller ratings / reviews | NOT IMPLEMENTED |
| Taluka labour filter UI | NOT IMPLEMENTED (taluka is stored on labour listings from profile and is text-searchable) |
| Jest / Vitest unit tests | NOT IMPLEMENTED (API QA script only) |
| Cloudinary orphan cleanup job | NOT IMPLEMENTED |
| Unique-visitor analytics | NOT IMPLEMENTED (`views` is an approximate GET-detail counter) |

### Intended user journey

Browse → Search / filter / sort → Open listing → See **public** seller name + district → Contact (authenticated) → Call (`tel:`) or WhatsApp (`wa.me`) → conversation happens **outside** the app.

### Authentication in the product vs the API

**Mobile app gate** (`Mobile App/src/app/_layout.tsx`): Marketplace screens sit behind JWT + completed profile + active mobile subscription. There is **no guest Marketplace UI** in the installed farmer app.

**Backend APIs** still distinguish:

- **Unauthenticated:** `GET /listings`, `GET /listings/:id` (public listings only).
- **Authenticated farmer:** create, edit, archive, save, contact, report, renew, images, my-listings, my-summary, saved.
- **Admin portal JWT + `marketplace` permission:** list/inspect/moderate listings and reports.

Owner capabilities are server-enforced (`sellerId === authenticated userId`). Admin capabilities use `requireAdminPermission("marketplace")` plus a writable-role check for status changes.

---

## 2. Marketplace structure (screens and routes)

Expo Router file routes live under `Mobile App/src/app/`. Stack titles are set in `Mobile App/src/app/_layout.tsx`. The hub is a tab: `(tabs)/marketplace`.

| Route | Screen | Purpose |
|---|---|---|
| `/marketplace` | `MarketplaceScreen` | Hub: search, three category cards, quick actions |
| `/marketplace-produce` | `ProduceListingsScreen` | Browse `listingType=produce` |
| `/marketplace-products` | `ProductListingsScreen` | Browse `listingType=product` |
| `/marketplace-labour` | `LabourListingsScreen` | Browse `listingType=labour` |
| `/marketplace-search` | `MarketplaceSearchScreen` | Cross-type browse (`listingType` omitted unless a type chip is selected). Optional `?search=` |
| `/marketplace-listing/[id]` | `ListingDetailScreen` | Detail, contact, share, report, owner actions. Optional `?published=1` after create |
| `/marketplace-create` | `CreateListingScreen` | New listing. Optional `?from=<id>` duplicate prefill |
| `/marketplace-edit/[id]` | `EditListingScreen` | Owner edit |
| `/marketplace-my-listings` | `MyListingsScreen` | Owner listings. Optional `?status=ACTIVE\|SOLD\|ARCHIVED` |
| `/marketplace-saved` | `SavedListingsScreen` | Saved public listings |

**Home (not a Marketplace stack screen):** `MyMarketplaceCard` on Home uses `GET /my-summary` and navigates to `/marketplace-my-listings?status=…`, `/marketplace-saved`, `/marketplace-create`.

### Hub behavior

- Search field + magnify submits to `/marketplace-search?search=…` (300 ms debounce before submit uses the debounced value).
- Tune icon opens the same search screen with empty query (filters live there).
- Category cards: शेतमाल / शेती साहित्य / मजूर कट्टा.
- Quick actions: जतन केलेले, माझ्या जाहिराती, नवीन जाहिरात.
- Info sheet explains classifieds (not checkout).

### Duplicate navigation

```
My Listings → ⋮ → हीच जाहिरात पुन्हा
→ /marketplace-create?from=<listingId>
```

There is **no clone API**. `?from=` is a navigation hint only.

---

## 3. Listing types

Shared listing document: one MongoDB model, discriminated by `listingType`: `produce` | `product` | `labour`.

Location is **never** accepted from the client on create/update. Server copies `district` (and for labour, `village` + `taluka`) from `FarmerProfile`. Sending `district` / `village` / `taluka` in the body returns **400**.

### 3A. शेतमाल / `produce`

| UI (Marathi) | Form state | API / DB field | Type | Required | Notes |
|---|---|---|---|---|---|
| Photos | `useListingImages` | `images[]` `{url, publicId}` | array | Optional on API; UI max 3 | Labour is the type that **requires** images |
| जाहिरात प्रकार | `listingType` | `listingType` | `"produce"` | Yes | Hidden on edit |
| पीक | `crop` | `crop`, also used as `title` | string | Yes | Display title uses crop when present |
| प्रमाण | `quantity` | `quantity` | number ≥ 0 | Yes | |
| एकक | `unit` | `unit` | enum | Yes | Kg, Quintal, Ton, Bag, Packet, Piece, Litre |
| किंमत | `expectedPrice` | `price` **and** `expectedPrice` | number ≥ 0 | Yes | Form sends the same number to both |
| कापणीची तारीख | `harvestDate` | `harvestDate` | ISO date | Yes | |
| वर्णन | `description` | `description` | string | Optional | |
| (auto) | — | `category` | `"Produce"` | Yes | Forced on create |
| (profile) | — | `district` | string | Yes | From profile |

`moisture` exists on the model and create/update validators. **Mobile create/edit UI does not expose it.**

### 3B. शेती साहित्य / `product`

| UI | Form state | API / DB | Type | Required | Notes |
|---|---|---|---|---|---|
| Photos | images | `images[]` | array | Optional; max 3 | |
| Item name | `productName` | `title` | string | Yes | |
| प्रकार | `category` | `category` | enum | Yes | Seeds, Fertilizers, Pesticides, Farm Machinery, Tools, Irrigation, Crop Protection |
| ब्रँड | `brand` | `brand` | string | Optional | |
| साठा | `stock` | `stock` | number ≥ 0 | Optional | |
| किंमत | `price` | `price` | number ≥ 0 | Yes | |
| वर्णन | `description` | `description` | string | Optional | |

### 3C. मजूर कट्टा / `labour`

| UI | Form state | API / DB | Type | Required | Notes |
|---|---|---|---|---|---|
| Photos | images | `images[]` | array | **Min 1, max 2** | Enforced API + UI |
| काम / category | `category` | `category` + auto `title` | labour enum | Yes | Title generated server-side |
| मजूर संख्या | `availableWorkers` | `availableWorkers` | integer ≥ 1 | Yes | |
| लिंग | `gender` | `gender` | enum | Yes | **UI: Male / Female only** |
| दर | `price` | `price` | number ≥ 0 | Yes | |
| दर प्रकार | `rateType` | `rateType` | enum | Yes | **UI always `per_day` for new/prefill** |
| पासून उपलब्ध | `availableFrom` | `availableFrom` | ISO date | Yes | |
| वर्णन | `description` | `description` | string | **Yes** | |
| (profile) | — | `district`, `village`, `taluka` | string | Yes | Village+taluka required on profile to create labour |

**Labour title generation** (`buildLabourTitle`): 1 worker → category name; Tractor Driver / Farm Supervisor + N>1 → `{category} Team`; categories ending Labour/Helper → `{category} Group`; else `{category} Workers`. Regenerated on labour update.

**Legacy compatibility (API + DB still accept; UI does not offer for new selection):**

- `gender`: `"Mixed Group"` (Marathi label मिश्र गट — display only)
- `rateType`: `"per_hour"` (Marathi प्रति तास — WhatsApp/share/detail still format it)

Duplicate prefill maps Mixed Group → empty gender (user must pick पुरुष/महिला) and forces `per_day`.

**Active labour cap:** at most **3** listings with `listingType=labour` and `status=ACTIVE` per seller (includes expired-but-still-ACTIVE rows). Marking hired (`SOLD`) or archiving frees a slot.

---

## 4. Data model / database

Mounted at `Backend/backend/src/modules/marketplace/marketplace.model.ts`.

### 4.1 Collection `marketplace` — model `MarketplaceListing`

Purpose: one document per classified listing.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | yes | auto | Exposed as `id` in DTOs |
| `sellerId` | ObjectId → AuthUser | yes | — | Indexed |
| `listingType` | enum | yes | — | `product` \| `produce` \| `labour` |
| `title` | string | yes | — | Labour: generated |
| `description` | string | no | — | Required for labour on create |
| `category` | enum `MARKETPLACE_CATEGORIES` | yes | — | Indexed |
| `subcategory` | string | no | — | **Not used by mobile UI** |
| `price` | number ≥ 0 | yes | — | Produce expected price, product price, labour daily (or legacy hourly) rate |
| `quantity` | number ≥ 0 | no | — | Required for produce |
| `unit` | enum | no | — | Required for produce |
| `images` | Mixed[] | no | `[]` | Schema max `MAX_LISTING_IMAGES` (3). Labour also capped at 2 in validation |
| `district` | string | yes | from profile | Indexed |
| `village` | string | no | labour: profile | Indexed |
| `taluka` | string | no | labour: profile | Indexed |
| `status` | enum | yes | `ACTIVE` | `ACTIVE` \| `SOLD` \| `ARCHIVED` |
| `views` | number ≥ 0 | yes | 0 | Incremented on GET detail |
| `contactClicks` | number ≥ 0 | yes | 0 | Incremented on successful contact |
| `expiresAt` | Date | yes | create: now+30d | Indexed |
| `crop` | string | no | — | Produce |
| `harvestDate` | Date | no | — | Produce |
| `moisture` | number ≥ 0 | no | — | **API-capable; no mobile field** |
| `expectedPrice` | number ≥ 0 | no | — | Produce stores a copy of price |
| `brand` | string | no | — | Product |
| `stock` | number ≥ 0 | no | — | Product |
| `availableWorkers` | number ≥ 1 | no | — | Labour |
| `gender` | enum | no | — | Male \| Female \| Mixed Group |
| `rateType` | enum | no | — | per_day \| per_hour |
| `availableFrom` | Date | no | — | Labour |
| `createdAt` / `updatedAt` | Date | yes | timestamps | |

**Indexes:**

- Text: `title`, `description`, `crop`, `category`, `village`, `taluka`, `district` — name `marketplace_text_search`, `default_language: "none"`
- `{ status: 1, expiresAt: 1, createdAt: -1 }`
- `{ status: 1, expiresAt: 1, price: 1 }`
- `{ sellerId: 1, createdAt: -1 }`
- `{ sellerId: 1, listingType: 1, status: 1 }`
- Single-field indexes as marked on schema paths (`sellerId`, `listingType`, `category`, `district`, `village`, `taluka`, `status`, `expiresAt`)

**Public list/detail DTO does not include seller phone.** Detail adds `seller: { name, district }` from FarmerProfile (name, district) + existence check on AuthUser. List endpoints return `toListingDTO` only (includes `sellerId`, not phone).

### 4.2 Collection `marketplace_saved` — model `MarketplaceSaved`

Purpose: per-user saved listings.

| Field | Type | Required | Default |
|---|---|---|---|
| `_id` | ObjectId | yes | auto |
| `userId` | ObjectId → AuthUser | yes | — |
| `listingId` | ObjectId → MarketplaceListing | yes | — |
| `savedAt` | Date | yes | `Date.now` |

No Mongoose `timestamps`. Indexes: unique `{ userId: 1, listingId: 1 }`; `{ userId: 1, savedAt: -1 }`.

### 4.3 Collection `marketplace_listing_reports` — model `MarketplaceListingReport`

Purpose: one report per (listing, user).

| Field | Type | Required | Default |
|---|---|---|---|
| `_id` | ObjectId | yes | auto |
| `listingId` | ObjectId → MarketplaceListing | yes | — |
| `userId` | ObjectId → AuthUser | yes | reporter |
| `reason` | enum | yes | — |
| `details` | string \| null | no | `null` |
| `createdAt` | Date | yes | `Date.now` |

No Mongoose `timestamps` option (only `createdAt`).

**Indexes (exactly as in code):**

- unique `{ listingId: 1, userId: 1 }`
- `{ listingId: 1, createdAt: -1 }`

**Report reasons:** `FALSE_INFORMATION`, `FAKE_LISTING`, `FRAUD`, `WRONG_PRODUCE`, `INAPPROPRIATE`, `OTHER`. `OTHER` requires non-empty `details`. Max details length: **300**.

### Related collections (not Marketplace-owned)

| Collection | Use |
|---|---|
| AuthUser | `sellerId`, contact `mobile`, reporter mobile for admin |
| FarmerProfile | listing location on create; public seller name/district |
| admin audit (`writeAdminAudit`) | marketplace moderation actions, `entity: "marketplace"` |

---

## 5. Listing status + lifecycle

| Status | Farmer meaning (produce/product) | Farmer meaning (labour) | Public browse/detail/contact |
|---|---|---|---|
| `ACTIVE` | Listed | उपलब्ध | Only if `expiresAt > now` |
| `SOLD` | विकले | काम मिळाले | Hidden (404 for non-owner) |
| `ARCHIVED` | संग्रहित | संग्रहित | Hidden (404 for non-owner) |

**Expiry does not automatically change `status`.** An expired listing can remain `status: "ACTIVE"` with `expiresAt` in the past. Public match is:

```
status: "ACTIVE" AND expiresAt > now
```

### Lifecycle

```
POST /listings  → status ACTIVE, expiresAt = now+30d, views=0, contactClicks=0
       ↓
Public while ACTIVE + unexpired
       ↓
Owner PUT status=SOLD          → hired/sold; not public
Owner DELETE /listings/:id     → ARCHIVED (soft); not public
Owner POST /renew              → expiresAt = now+30d (rules in §6)
Natural expiry                 → still ACTIVE internally; not public
Admin archive/hide/delete      → ARCHIVED
Admin restore                  → ACTIVE only if not expired
```

**Hard delete of listing documents is not implemented.** Farmer “delete” and admin “delete” both archive.

Owner can still `GET /listings/:id` for SOLD / ARCHIVED / expired (increments `views`). Edit of ARCHIVED is rejected (400).

---

## 6. Renewal system

`POST /api/v1/marketplace/listings/:id/renew`

Auth: farmer JWT. Rate limit: 10 / minute / user (in-memory).

Server rules (`renewListing`):

1. Valid ObjectId or 400.
2. Listing exists or 404.
3. `sellerId` must match caller or **403** `"You can only renew your own listing."`
4. `SOLD` → 400 `"Sold listings cannot be renewed."`
5. `ARCHIVED` → 400 `"Archived listings cannot be renewed."`
6. Any other non-ACTIVE → 400 `"This listing cannot be renewed."`
7. Remaining days `> 7` (`LISTING_RENEW_MAX_REMAINING_DAYS`) → 400 `"This listing is not eligible for renewal yet."`  
   Remaining can be **negative** (already expired ACTIVE) → eligible.
8. Sets `expiresAt = now + 30 days` (`LISTING_EXPIRY_DAYS`). Does **not** change status.
9. Immediate second renew: remaining ≈ 30 days → step 7 rejects.

Mobile: renew button on My Listings when `isListingRenewable` (ACTIVE and remaining ≤ 7 days). Success snackbar: `जाहिरात पुन्हा सक्रिय झाली.`

---

## 7. Complete API reference (farmer Marketplace)

Base: `/api/v1/marketplace` (`Backend/backend/src/routes/index.ts`).

Standard success envelope: `{ success: true, data }`. Errors: `AppError` message + HTTP status (not raw DB/Axios text on mobile).

### 7.1 Listings browse

**`GET /listings`** — optional JWT.

Query: `search`, `category`, `listingType`, `district`, `page` (default 1), `limit` (default 20, max 100), `sort` (`newest` default | `price_low_to_high` | `price_high_to_low`).

Match: `ACTIVE` + `expiresAt > now`. District is canonicalized via `resolveDistrict`. Search uses Mongo `$text` with quoted tokens.

If JWT is valid, results from the caller’s profile district are sorted first (`districtPriority`), then the requested sort.

**Cross-type search:** omit `listingType`. Hub search screen does this until a type chip is selected.

Response: `{ listings: ListingDTO[], pagination: { page, limit, total, totalPages } }`.

**`GET /listings/:id`** — optional JWT.

- Missing/invalid id: 400.
- Missing listing: 404 `"Listing not found."`
- Non-owner + not publicly visible: 404 `"Listing not found."`
- Always increments `views` then returns listing DTO + `seller: { name, district }` (no phone).

### 7.2 Create / update / archive

**`POST /listings`** — JWT. **201.** Body: `validateCreateListing`. Location fields forbidden. Server sets seller, location, status, expiry, counters.

**`PUT /listings/:id`** — JWT. Owner only (403 otherwise). Archived cannot update (400). Cannot set `status: ARCHIVED` here (400: use DELETE). `status: SOLD` marks sold/hired. Labour title regenerated. Labour ACTIVE cap applies if reactivating.

**`DELETE /listings/:id`** — JWT. Owner archive. Already archived → 400 `"Listing is already archived."`

### 7.3 My listings / summary

**`GET /my-listings`** — JWT. Query `page`, `limit`, optional `status`. Sorted `createdAt` desc. Includes expired ACTIVE rows. No public-visibility filter.

**`GET /my-summary`** — JWT. Counts: owned ACTIVE / SOLD / ARCHIVED; saved count only where joined listing is ACTIVE + unexpired.

### 7.4 Save

**`POST /listings/:id/save`** — JWT. **201** `{ listingId, savedAt }`. Own listing → 400 `"You cannot save your own listing."` Duplicate → **409** `"Listing is already saved."` Listing missing → 404. Does **not** require the listing to be publicly visible at save time.

**`DELETE /listings/:id/save`** — JWT. Not saved → 404 `"Saved listing not found."`

**`GET /saved`** — JWT. Paginated. Only saved rows whose listing is still ACTIVE + unexpired. Sort `savedAt` desc.

### 7.5 Contact

**`POST /listings/:id/contact`** — JWT. Rate limit **20 / min / user**.

- Own listing → 400 `"You cannot contact your own listing."`
- Not publicly visible → 404
- Seller AuthUser missing mobile → 404 `"Seller account not found."`
- Success **200** `{ phone }` from `AuthUser.mobile`; `$inc contactClicks`

Phone is **not** stored on the listing.

### 7.6 Report

**`POST /listings/:id/report`** — JWT. Rate limit **10 / min / user**. **201** `{ listingId, reported: true }`.

- Own listing → 400 `"You cannot report your own listing."`
- Duplicate unique index → **409** `"You have already reported this listing."`
- Does **not** require ACTIVE/unexpired (only that the listing exists)

### 7.7 Renew

See §6. Rate limit **10 / min / user**.

### 7.8 Images

**`POST /images/upload`** — JWT, multipart field `images`. Max **3** files/request, **5 MB** each, JPEG/PNG/WebP. Stored in Cloudinary folder `kisan-katta/marketplace`. **201** `{ images: [{ url, publicId }] }`. Failed batch rolls back uploaded Cloudinary assets.

**`DELETE /images`** — JWT. Body `{ publicId }`. `publicId` must start with `kisan-katta/marketplace/`. If attached to a listing, only that listing’s `sellerId` may delete (**403** `"You are not authorized to delete this image."`). Unattached (draft) publicIds can be deleted by any authenticated farmer who knows the id.

### 7.9 Duplicate / prefill

**No endpoint.** Client: `GET /listings/:id` (owner can load sold/archived/expired) → owner check on `sellerId` → `ListingForm` `prefillFrom` → user publishes via `POST /listings`. Images not copied. Server ignores client status/expiry/views/sellerId.

---

## 8. Data flows

### Browse

```
Mobile ListingsBrowse
  → GET /api/v1/marketplace/listings?listingType&search&category&district&sort&page&limit
  → MongoDB marketplace (ACTIVE + unexpired)
  → listing cards (no seller phone)
```

### Open listing

```
Mobile ListingDetail
  → GET /listings/:id
  → views += 1
  → public DTO + seller { name, district }
```

### Contact

```
Call / WhatsApp tap (in-flight lock)
  → POST /listings/:id/contact
  → auth, not owner, ACTIVE+unexpired, rate limit
  → AuthUser.mobile
  → { phone }
  → tel:   OR   https://wa.me/<digits>?text=<encoded Marathi>
```

### Report

```
Report dialog → POST /listings/:id/report
  → marketplace_listing_reports
  → admin GET /admin/marketplace/:id includes reports[]
```

### Renew

```
My Listings → POST /listings/:id/renew → expiresAt = now+30d → replace card
```

### Duplicate

```
My Listings ⋮ → /marketplace-create?from=id
  → GET original (owner)
  → prefill text fields, empty image picker
  → POST /listings → new ACTIVE listing, new id, new expiry
```

---

## 9. Privacy + phone number security

**Public listing GET / list / share text never include seller phone.**

Public seller object on detail:

```ts
{ name: string; district: string }
```

Phone appears only as `{ phone }` from authenticated contact, sourced from **AuthUser.mobile**, not copied onto `MarketplaceListing`.

Why: classifieds still need conversion (Call/WhatsApp) without turning every browse into a phone scrape. Contact is authenticated, owner-blocked, visibility-gated, and rate-limited (20/min).

**Admin exception:** `GET /api/v1/admin/marketplace` and `/:id` return `sellerMobile` / seller `mobile` and reporter mobiles for moderation. Farmer tokens cannot call these (403).

Share message builder uses title, type, price, village, district, and `Linking.createURL('/marketplace-listing/${id}')` only.

---

## 10. Authorization matrix

Mobile UI requires login + profile + subscription. The table is **API enforcement**.

| Action | Unauthenticated API | Authenticated farmer | Listing owner | Admin (`marketplace` perm.) |
|---|---|---|---|---|
| Browse public listings | Yes | Yes | Yes | Yes (admin list is separate, all statuses) |
| Search / district / sort | Yes | Yes (+ district priority) | Yes | Admin search is admin API |
| View public detail | Yes | Yes | Yes | Admin detail |
| View sold/archived/expired detail | No (404) | No (404) | Yes | Yes |
| Create listing | 401 | Yes (profile location rules) | — | No farmer-create via admin |
| Edit listing | 401 | 403 if not owner | Yes unless ARCHIVED | Status via moderate APIs |
| Archive (farmer DELETE) | 401 | 403 if not owner | Yes | archive/hide/delete → ARCHIVED |
| Mark SOLD | 401 | 403 if not owner | PUT status SOLD | Not in website UI (archive/restore/delete only) |
| Save / unsave / list saved | 401 | Yes (cannot save own) | Cannot save own | N/A |
| My listings / summary | 401 | Own rows only | — | Admin list |
| Contact seller | 401 | Yes if not owner + public | 400 own listing | N/A |
| Report | 401 | Yes if not owner | 400 own listing | See reports on detail |
| Duplicate prefill | 401 on GET if needed | GET public or 404 | GET any own + client guard | N/A |
| Renew | 401 | 403 if not owner | ACTIVE + remaining ≤ 7d | N/A |
| Upload images | 401 | Yes | — | N/A |
| Delete attached image | 401 | 403 if not listing owner | Yes | N/A |
| Moderate (archive/restore/delete) | 403 | 403 | — | Writable roles; READ_ONLY 403 on write |
| View seller/reporter phones | No | No | No | Yes on admin APIs |

---

## 11. Search / filter / sort / pagination

### Search

MongoDB text search on title, description, crop, category, village, taluka, district. Query tokens are quoted. Hub search omits `listingType` until chips: सर्व / शेतमाल / शेती साहित्य / मजूर कट्टा. Category chips apply only when a listing type is selected.

**NOT IMPLEMENTED:** dedicated taluka filter control.

### District (browse UI)

`ListingsBrowse` default: **माझा जिल्हा** from `useMyProfile().district` (no GPS). Sheet options: माझा जिल्हा, सर्व जिल्हे, or a named district from Location Master. Query param `district` omitted for “all”.

### Sort (server-side)

`newest` → `createdAt: -1`. Price sorts use `price`. Labour UI labels: कमी/जास्त दैनंदिन दर. Authenticated browse also prepends own-district priority.

### Pagination

Public + saved + my-listings: default page 1, limit 20, max 100. Mobile infinite scroll (`onEndReached`) + pull-to-refresh. My Listings tabs map to `?status=`.

---

## 12. Save / favourites

Collection `marketplace_saved`. Unique `(userId, listingId)`.

- Heart on cards (hidden for owner).
- Optimistic toggle; error reverts + snackbar. Success: `जाहिरात जतन केली` / `जतनातून काढले`.
- Saved screen lists ACTIVE + unexpired only; expired/sold/archived saves disappear from this list even if the save row remains until unsave (lookup `$match` filters them out). Unsave of a missing save → 404.

---

## 13. Image system

1. Device picker (camera/gallery) → local URI slots (`useListingImages`).
2. On publish/update: upload each new file `POST /images/upload` → `{ url, publicId }`.
3. Create/update listing body includes image objects. `publicId` must be under `kisan-katta/marketplace/`.
4. Remove from form: `DELETE /images` with `publicId` when the slot was already uploaded.

| Type | Max on listing | Required |
|---|---|---|
| produce | 3 | No (API) |
| product | 3 | No (API) |
| labour | 2 | Yes (≥1) |
| upload request | 3 files, 5 MB, jpeg/png/webp | ≥1 file |

**Ownership:** attached `images.publicId` may only be deleted by listing `sellerId`.

**Duplicate:** does not copy Cloudinary references; user selects photos again. Labour cannot publish without new photos.

**KNOWN LIMITATION:** unattached draft uploads (user uploaded then abandoned create) are not reaped by a cleanup job. Owner-or-anyone-with-publicId can still delete unattached assets via `DELETE /images`.

---

## 14. WhatsApp + Call

Both use the **same** contact endpoint and **same** in-flight lock (`contactInFlightRef` + `contactLoading`). Rapid taps execute one request. No long cooldown (429 still possible).

**Call:** `tel:${formatPhoneForDial(phone)}` — no prefilled text.

**WhatsApp:** `buildWhatsAppUrl(phone, buildWhatsAppContactMessage(listing))` → `https://wa.me/<91…>?text=<encodeURIComponent>`. Message is Marathi, type-specific, omits missing fields (no `undefined`/`null`). Phone is **only** the contact response. `Linking.canOpenURL` is not used (unreliable on Android). Open failure → `या उपकरणावर व्हॉट्सअॅप उपलब्ध नाही.` Contact API failure → `संपर्क करताना समस्या आली…` except 429 / network / timeout mapped strings.

---

## 15. Share listing

`Share.share` + `Linking.createURL('/marketplace-listing/${id}')` (same pattern as Assistance). App scheme in `Mobile App/app.json`: **`kisankatta`**. Route `marketplace-listing/[id]` exists.

Share body: brand line, title, प्रकार, किंमत, स्थान (village, district if present), deep link, closing line. **No phone.**

Universal links / HTTPS app links: **not implemented** beyond Expo `createURL` (dev/exp URL or `kisankatta://` depending on runtime). Do not document a production `https://…` listing URL unless it is added later.

Share is secondary (hero icon). Contact buttons stay primary.

---

## 16. Admin Marketplace

**Website:** `/admin/marketplace`, `/admin/marketplace/:id` (`Website Frontend/src/pages/admin/AdminMarketplacePage.tsx`). Sidebar item “Marketplace”. Client: `Website Frontend/src/api/admin-ops.api.ts`.

**Backend** (`/api/v1/admin`, `requireAdminPermission("marketplace")`):

| Method | Path | Write? | Behavior |
|---|---|---|---|
| GET | `/marketplace` | no | Paginated list; query `search`, `status`, `listingType`, `district`, `hasReports`, `page`, `limit`. Includes `sellerMobile`, `sellerName`, `sellerDistrict`, `reportCount` |
| GET | `/marketplace/:id` | no | Listing DTO, seller (id, mobile, name, district, village), reports (reason, details, reporterMobile), last 20 seller listings |
| POST | `/marketplace/:id/archive` | yes | `status=ARCHIVED`, audit `MARKETPLACE_FORCE_ARCHIVE` |
| POST | `/marketplace/:id/hide` | yes | `status=ARCHIVED`, audit `MARKETPLACE_HIDE` — **website UI does not call this**; same DB effect as archive |
| POST | `/marketplace/:id/restore` | yes | `ACTIVE` only if `expiresAt` still in the future; else 400. Audit `MARKETPLACE_RESTORE` |
| POST | `/marketplace/:id/delete` | yes | `status=ARCHIVED`, audit `MARKETPLACE_DELETE` (soft) |

Writable roles cannot be `READ_ONLY` (`Read-only admins cannot moderate marketplace.`). Roles with `marketplace` permission include SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, MODERATOR, READ_ONLY (read). FINANCE and GRAM_SAHAKARI_TEAM do **not** include `marketplace` in default `ROLE_PERMISSIONS`.

Dashboard/export: `admin.ops.service` counts active listings and can export `marketplace-export.csv`. Farmer admin detail “Marketplace Listings” currently shows **—** (not wired to counts).

---

## 17. Reporting + moderation

```
Authenticated user → POST /listings/:id/report { reason, details? }
  → not owner
  → unique (listingId, userId) or 409
  → marketplace_listing_reports
Admin → GET /admin/marketplace?hasReports=true and listing detail reports[]
Admin → archive / restore / delete (archive)
```

Rate limit 10/min. Reasons and Marathi labels: see `marketplace.strings.ts` `reportReasons`. Success snackbar only after 201.

---

## 18. Rate limiting + abuse protection

In-memory (`marketplace.rate-limit.ts`), window **60 seconds**, keyed `user:{userId}` (or IP if unauthenticated — these routes require auth). Message: `"Too many marketplace requests. Please try again shortly."` **429**.

| Scope | Max / minute |
|---|---|
| `marketplace-contact` | 20 |
| `marketplace-report` | 10 |
| `marketplace-renew` | 10 |

Not a distributed limiter (multi-instance counts are independent). No listing-create rate limiter in this module.

---

## 19. Request locks / duplicate action protection

| Action | Mechanism | Success copy (after API success only) |
|---|---|---|
| Contact Call/WhatsApp | `contactInFlightRef` + button loading/disabled | Opens tel/WA |
| Report | `reportInFlightRef` + `reportSubmitting` | तुमची तक्रार नोंदवली आहे |
| Publish create | `submittingRef` + form `submitLockRef` | जाहिरात प्रकाशित झाली (`?published=1`) |
| Update | `submittingRef` + form lock | Navigates back |
| Renew | `renewInFlightRef` | जाहिरात पुन्हा सक्रिय झाली |
| Save/unsave | per-id in-flight set | जतन / जतनातून काढले |
| Archive / sold | lifecycle `loading` | जाहिरात संग्रहित केली / विकली / काम मिळाले |

No long-term cooldown on contact besides 429.

---

## 20. Create / edit / duplicate architecture

- **`ListingForm`:** `initialListing` ⇒ edit (`isEdit`, no type chips, omit `listingType` on submit). `prefillFrom` ⇒ create with initial values, type still editable.
- **Create:** profile location label; `createListing`; images uploaded first.
- **Edit:** `GET` listing (owner); `updateListing`; can reuse existing image objects.
- **Duplicate:** `?from=` is **not** authorization. Server create always uses JWT user + profile + server lifecycle. Client owner check is UX. Mixed Group / per_hour normalized in `valuesFromPrefill`.

---

## 21. Views + contact clicks

| Counter | When | What it is |
|---|---|---|
| `views` | Every successful `GET /listings/:id`, including owner detail, edit load, and duplicate prefill | Approximate endpoint-hit count, **not** unique humans |
| `contactClicks` | Successful contact only | Approximate contact conversions |

Shown in **admin** listing UI as “Views / Contacts”. **Not shown** on farmer listing cards.

Current product decision: leave owner GET increments as-is.

---

## 22. Expiration vs public visibility

| Check | Uses expiry? |
|---|---|
| `GET /listings` browse | Yes (`expiresAt > now` + ACTIVE) |
| `GET /listings/:id` non-owner | Yes (`assertPublicListingAccess`) |
| `POST .../contact` | Yes |
| `GET /saved` and saved count in summary | Yes |
| `GET /my-listings` | **No** (owner sees expired ACTIVE) |
| `POST .../report` | **No** (listing exists) |
| `POST .../save` | **No** (listing exists, not own) |
| Renew eligibility | Uses remaining time vs 7 days |

---

## 23. Error handling (selected actual messages)

| Status | Typical cause | Example server message |
|---|---|---|
| 400 | Validation / business rule | `crop is required for produce listings.`; `You cannot contact your own listing.`; `This listing is not eligible for renewal yet.`; `district cannot be supplied by the client…` |
| 401 | Missing/invalid farmer JWT | Auth middleware |
| 403 | Not owner; admin missing perm; attached image; renew not owner; farmer hitting admin | `You are not authorized to modify this listing.`; `You can only renew your own listing.`; `You are not authorized to delete this image.` |
| 404 | Missing or not public | `Listing not found.`; `Saved listing not found.`; `Seller account not found.` |
| 409 | Duplicate save or report | `Listing is already saved.`; `You have already reported this listing.` |
| 429 | Contact/report/renew limiter | `Too many marketplace requests. Please try again shortly.` |
| 502 | Cloudinary | `Cloudinary upload failed after …ms.` |

Mobile maps these to Marathi via `getMarketplaceErrorMessage` / contact helper; it does **not** show raw English backend text for unknown 4xx.

---

## 24. Frontend / backend file map

### Mobile App (`Mobile App/src/`)

| Path | Responsibility | Do not |
|---|---|---|
| `app/(tabs)/marketplace.tsx` | Tab entry | Don’t add checkout |
| `app/marketplace-*.tsx` | Route re-exports | Keep thin |
| `features/marketplace/MarketplaceScreen.tsx` | Hub | Don’t put listing fetch here |
| `features/marketplace/marketplace.service.ts` | HTTP client | Don’t put phone on GET |
| `features/marketplace/marketplace.types.ts` | DTOs | Seller has no phone |
| `features/marketplace/marketplace.constants.ts` | Enums, limits | Keep labour UI options vs API enums distinct |
| `features/marketplace/marketplace.strings.ts` | Marathi copy | |
| `features/marketplace/marketplace.utils.ts` | Price, WhatsApp, share, expiry, owner check | Don’t add a second WhatsApp helper |
| `features/marketplace/marketplace.errors.ts` | User-facing errors | Don’t leak Axios/DB |
| `features/marketplace/marketplace.ui.ts` | Cream/green/gold/blue tokens | |
| `screens/ListingDetailScreen.tsx` | Detail, contact, share, report | Phone only from contact |
| `screens/CreateListingScreen.tsx` | Create + duplicate prefill | Don’t POST on duplicate tap |
| `screens/EditListingScreen.tsx` | Edit | Don’t use prefillFrom |
| `screens/MyListingsScreen.tsx` | Owner list, renew, ⋮ menu | |
| `screens/SavedListingsScreen.tsx` | Saved | |
| `screens/*ListingsScreen.tsx` | Type browse wrappers | |
| `screens/MarketplaceSearchScreen.tsx` | Cross-type browse | |
| `components/ListingsBrowse.tsx` | Shared browse + filters + save | |
| `components/ListingForm.tsx` | Create/edit/prefill fields | Don’t treat prefill as edit |
| `components/ListingCard.tsx` | Card | |
| `hooks/usePaginatedListings.ts` | Public pages | |
| `hooks/usePaginatedMyListings.ts` | Owner pages | |
| `hooks/useListingImages.ts` | Upload pipeline | Don’t attach source listing publicIds on duplicate |
| `hooks/useSavedListingIds.ts` | Heart state | |
| `home/components/MyMarketplaceCard.tsx` | Home counts | |

### Backend (`Backend/backend/src/`)

| Path | Responsibility | Do not |
|---|---|---|
| `routes/index.ts` | Mount `/api/v1/marketplace` | |
| `modules/marketplace/marketplace.routes.ts` | Auth + rate limits | Don’t make contact public |
| `marketplace.controller.ts` | HTTP parse | |
| `marketplace.service.ts` | Business rules, DTOs | Don’t put phone on GET DTO |
| `marketplace.validation.ts` | Create/update/report | Keep location server-owned |
| `marketplace.model.ts` | Three collections | |
| `marketplace.constants.ts` | Enums, 30 days, 7-day renew, image limits | |
| `marketplace.rate-limit.ts` | 20/10/10 | |
| `marketplace.image.*` | Cloudinary + ownership | |
| `modules/admin/admin.marketplace.service.ts` | Admin list/detail/moderate | Phone OK here only |
| `modules/admin/admin.routes.ts` | Admin HTTP | |
| `scripts/marketplace-pre-release.qa.ts` | E2E API QA | No Jest |

### Website (`Website Frontend/src/`)

| Path | Responsibility |
|---|---|
| `pages/admin/AdminMarketplacePage.tsx` | List + detail + archive/restore/delete |
| `api/admin-ops.api.ts` | Admin HTTP |
| `components/admin/AdminSidebar.tsx` | Nav |

---

## 25. Mobile UI / UX

- Marathi-first labels; English stored in API enums (category, gender, reasons).
- Cream `#FDF9F3`, Agrisathi green, product gold, labour blue (`marketplace.ui.ts`).
- Compact headers, cards with type accent strip, 44px+ controls, `minWidth: 0` / wrap to reduce overflow.
- Hub layout scales below 360px width and short screens (`layoutFor`).
- Empty / error / loading via `ListingStateViews`; pull-to-refresh; Snackbar for mutations.
- Detail: primary Call + WhatsApp; secondary Share + Report (⋮).
- My Listings: overflow menu (edit, duplicate, sold/hired, archive); renew as contained button when eligible.
- **Device QA across 320–430px and physical Call/WhatsApp/Share for the latest conversion work was not fully signed off in-repo.** Treat overflow/touch as design intent, not a certified device matrix.

---

## 26. Localization

Strings: `Mobile App/src/features/marketplace/marketplace.strings.ts`.

| Term | Usage |
|---|---|
| बाजारपेठ | Hub title |
| शेतमाल / शेती साहित्य / मजूर कट्टा | Types |
| जतन केलेले | Saved |
| माझ्या जाहिराती | My listings |
| नवीन जाहिरात | Create |
| हीच जाहिरात पुन्हा | Duplicate |
| माझा जिल्हा / सर्व जिल्हे | District filter |
| पुरुष / महिला | Gender UI |
| संपर्क करा / व्हॉट्सअॅप | Contact |
| शेअर / तक्रार | Secondary |

Admin UI is English.

---

## 27. Testing / QA

**Script:** `Backend/backend/scripts/marketplace-pre-release.qa.ts`  
**Command:** from `Backend/backend`: `npm run qa:marketplace`  
(`ts-node --transpile-only`)

Not Jest/Vitest. Hits a running API (`QA_BASE_URL` default `http://127.0.0.1:4000/api/v1/marketplace`) and Mongo via `MONGODB_URI`.

Coverage (current suite, last known **76/76 PASS**): public list by type; unauthenticated create 401; image upload; create produce/product/labour; labour active cap; location spoof 400; text search; **no seller.phone** on detail; contact auth/own/phone/clicks; phone still absent after contact; report auth/self/duplicate 409; attached image delete 403; save/unsave/own-save; labour update title; sold/expired hidden from public GET and contact; admin farmer 403 vs admin reports; my-listings/summary; district query; server sort; cross-type search; my-listings pagination and status; renew auth/owner/eligibility/SOLD/ARCHIVED/repeat; archive vs public; contact 429; create ignores client status/expiry/metrics; labour slot after archive.

Also used in development: `npx tsc --noEmit` (backend + mobile), ESLint on touched files.

Manual/device: earlier farmer-app USB/tunnel debugging existed; **do not claim a full conversion device pass** (Call, WhatsApp prefill, share sheet, duplicate → publish) unless re-run.

---

## 28. Consolidated API table

Farmer APIs are under `/api/v1/marketplace`. Admin under `/api/v1/admin`.

| Method | Endpoint | Auth | Owner/admin | Purpose | Main in | Main out | Rate limit | Validation highlights |
|---|---|---|---|---|---|---|---|---|
| GET | `/listings` | optional | — | Browse public | query filters | listings + pagination | — | ACTIVE+unexpired |
| GET | `/listings/:id` | optional | owner bypasses public rule | Detail | id | listing + seller name/district | — | 404 if hidden; **views++** |
| POST | `/listings` | farmer | — | Create | listing body | listing | — | type fields; no client location/status |
| PUT | `/listings/:id` | farmer | owner | Update / mark SOLD | patch | listing | — | not ARCHIVED |
| DELETE | `/listings/:id` | farmer | owner | Archive | — | listing | — | not already archived |
| POST | `/listings/:id/contact` | farmer | not owner | Phone for Call/WA | — | `{ phone }` | 20/min | public listing |
| POST | `/listings/:id/report` | farmer | not owner | Report | reason, details | `{ reported: true }` | 10/min | unique pair; OTHER needs details |
| POST | `/listings/:id/renew` | farmer | owner | New expiry | — | listing | 10/min | ACTIVE; remaining ≤ 7d |
| POST | `/listings/:id/save` | farmer | not owner | Save | — | listingId, savedAt | — | 409 duplicate |
| DELETE | `/listings/:id/save` | farmer | — | Unsave | — | listingId | — | 404 if none |
| GET | `/my-listings` | farmer | own | Owner list | page, limit, status | listings + pagination | — | |
| GET | `/my-summary` | farmer | own | Counts | — | active, sold, archived, saved | — | |
| GET | `/saved` | farmer | own | Saved public | page, limit | listings + pagination | — | ACTIVE+unexpired join |
| POST | `/images/upload` | farmer | — | Cloudinary | multipart | images[] | — | 3 files, 5MB, mime |
| DELETE | `/images` | farmer | attached: owner | Destroy Cloudinary | publicId | `{ success: true }` | — | folder prefix |
| GET | `/admin/marketplace` | admin | permission | Moderate list | filters | items incl. phones, reportCount | — | |
| GET | `/admin/marketplace/:id` | admin | permission | Moderate detail | id | listing, seller, reports | — | |
| POST | `/admin/marketplace/:id/archive` | admin | writable | Force ARCHIVED | optional reason | listing | — | audit |
| POST | `/admin/marketplace/:id/hide` | admin | writable | ARCHIVED | optional reason | listing | — | unused by website |
| POST | `/admin/marketplace/:id/restore` | admin | writable | ACTIVE if not expired | optional reason | listing | — | |
| POST | `/admin/marketplace/:id/delete` | admin | writable | ARCHIVED | optional reason | listing | — | not hard delete |

---

## 29. Consolidated database table

| Collection | Model | Purpose | Important fields | Indexes | Relationships | Security |
|---|---|---|---|---|---|---|
| `marketplace` | MarketplaceListing | Listings | sellerId, listingType, status, expiresAt, images, location, type fields, views, contactClicks | text; status+expiresAt+sort; seller | AuthUser seller | No phone on doc |
| `marketplace_saved` | MarketplaceSaved | Saves | userId, listingId, savedAt | unique user+listing | AuthUser, Listing | Authenticated writes |
| `marketplace_listing_reports` | MarketplaceListingReport | Reports | listingId, userId, reason, details, createdAt | unique listing+user; listing+createdAt | AuthUser reporter | One report per user |

---

## 30. Feature matrix

| Feature | Mobile UI | Backend API | Database | Auth | Admin | Notes |
|---|---|---|---|---|---|---|
| Browse | Yes | GET listings | marketplace | Optional API; app gated | List all statuses | Public = ACTIVE+unexpired |
| Search | Hub + search screen | `search` + $text | text index | Optional | Admin regex search | Cross-type when type omitted |
| District filter | माझा जिल्हा / all / named | `district` | district field | Profile default | `district` query | No GPS |
| Sort | Sheet | `sort` | price/createdAt | District boost if JWT | createdAt | Server-side |
| Produce / products / labour | Yes | listingType | enum | — | Filter by type | Labour cap 3 ACTIVE |
| Create | Yes | POST listings | insert | Farmer | No | Server location + expiry |
| Edit | Yes | PUT | update | Owner | Status via moderate | No type change |
| Save / unsave / saved | Yes | POST/DELETE/GET | marketplace_saved | Farmer | — | Saved list public-only |
| My listings | Yes | GET my-listings | — | Owner | — | Pagination + status tabs |
| Contact / Call / WhatsApp | Yes | POST contact | contactClicks; AuthUser.mobile | Farmer, not owner | — | Phone not on GET |
| Report | Yes | POST report | marketplace_listing_reports | Farmer, not owner | Detail reports | 409 duplicate |
| Admin moderation | No | admin routes | status + audit | Admin | Yes | Soft archive |
| Renewal | Yes | POST renew | expiresAt | Owner | — | 30 days; ≤7 remaining |
| Expiry | Badge | browse/detail/contact | expiresAt | — | Restore blocked if expired | Status may stay ACTIVE |
| Duplicate | Yes | none (GET+POST) | new row | Owner UX | — | No image clone |
| Share | Yes | none | — | — | — | createURL + Share.share |
| Images | Picker | upload/delete | images[] + Cloudinary | Farmer; attached owner | View URLs | Draft orphans possible |
| Pagination | Infinite scroll | page/limit | skip/limit | — | page/limit | Default 20 |

---

## 31. When modifying Marketplace

| If you want to… | Look at |
|---|---|
| Change listing fields | model + `marketplace.validation.ts` + `ListingForm` + types + QA |
| Change public privacy / phone | `toListingDTO`, `fetchSellerInfo`, GET handler, contact service, QA “no seller.phone”, share utils |
| Change contact | `recordContactClick`, rate-limit 20, `ListingDetailScreen` |
| Change WhatsApp copy | `buildWhatsAppContactMessage` in `marketplace.utils.ts` only |
| Change expiry length | `LISTING_EXPIRY_DAYS`, `buildExpiryDate`, renew QA |
| Change renew window | `LISTING_RENEW_MAX_REMAINING_DAYS`, `isListingRenewable`, QA |
| Change district filtering | `buildBrowseMatchFilter` + `BrowseFilterSheet` + `ListingsBrowse` |
| Change admin moderation | `admin.marketplace.service.ts` + website page + audit actions |
| Change image limits | constants (backend **and** mobile) + multer + form validate |
| Add a listing type | enums, validation, create UI, browse chips, detail rows, admin filters, QA |
| Change report reasons | constants both sides + strings + unique index still `(listingId,userId)` |

**Shared — do not duplicate:** `toListingDTO`, Cloudinary folder prefix, location-from-profile rule, labour title builder (backend is source of truth; mobile mirrors for preview).

---

## 32. Do not break these

1. Public listing responses must **not** expose seller phone.
2. Phone for Call/WhatsApp comes from **AuthUser.mobile** via **POST /contact** only.
3. `?from=<id>` is **not** a security boundary.
4. Duplicate creates a **new** listing through normal **POST /listings**.
5. Never trust the client for `sellerId`, `status`, `expiresAt`, `views`, `contactClicks`, or location fields.
6. Owner-only mutations must stay **server-enforced**.
7. Contact must require **ACTIVE + unexpired** (same helper as public detail).
8. Reports: unique `(listingId, userId)`; no self-report.
9. Attached image delete must enforce listing ownership.
10. Legacy labour `Mixed Group` and `per_hour` must remain **readable**; new UI must not reintroduce them as selectable options.
11. Public browse must not show expired listings (`expiresAt > now`).
12. Do not add checkout, in-app payment between farmers, escrow, delivery, chat, or ratings unless Marketplace is intentionally redesigned.
13. Labour: max **3 ACTIVE** listings; max **2** images; images required.
14. Create/update must reject client `district` / `village` / `taluka`.

---

## 33. Known limitations / deferred

**IMPLEMENTED:** classifieds browse/search/filter/sort, three listing types, save, my listings, contact+WhatsApp prefill, share, report, admin inspect/archive, renew, expiry visibility, duplicate-as-prefill, image upload with attached-id protection, in-memory rate limits, Marathi UI.

**KNOWN LIMITATION**

- `views` counts GET detail (including owner/edit/duplicate prefill), not unique visitors.
- Unattached Cloudinary drafts may linger without a janitor job.
- Rate limits are in-process memory (not Redis).
- Admin `hide` equals archive; website never calls `/hide`.
- `moisture` / `subcategory` are in the schema but unused in mobile forms.
- Report/save do not require the listing to be currently public.
- Saved rows for now-hidden listings are omitted from GET /saved (not necessarily deleted).
- No taluka filter UI.
- No hard listing delete.
- Farmer admin detail marketplace counts not wired (`—`).
- Latest conversion UX not fully device-certified in-repo.

**FUTURE (not in product):** chat, ratings, payments, delivery, taluka labour filter, recommendation ranking, image GC, unique analytics, Jest/Vitest.

---

## 34. Future extension guidance

If those features are added later, they are **new architecture**, not switches on this classifieds core. Contact should stay a privileged phone reveal unless a real messaging system replaces it. Payments must not be bolted onto `POST /listings` without an explicit product change. Labour taluka filter can use stored `taluka` but must not break Location Master / profile copy rules.

---

## 35. Marketplace at a glance

| | |
|---|---|
| **Purpose** | Farmer-to-farmer classifieds (not checkout) |
| **Types** | produce, product, labour |
| **Main screens** | Hub, three browse lists, search, detail, create/edit, my listings, saved |
| **Main APIs** | `/api/v1/marketplace/*` + `/api/v1/admin/marketplace*` |
| **Collections** | `marketplace`, `marketplace_saved`, `marketplace_listing_reports` |
| **Auth model** | App: JWT+profile+subscription. API: public GET list/detail; writes authenticated |
| **Contact model** | POST contact → AuthUser.mobile → tel / wa.me |
| **Expiry model** | 30 days; public needs ACTIVE **and** future `expiresAt`; status may stay ACTIVE |
| **Renewal model** | Owner, ACTIVE, remaining ≤ 7 days, `expiresAt = now+30` |
| **Report model** | One per user per listing; admin sees reporters |
| **Image limits** | 3 produce/product; 2 labour (required); Cloudinary folder `kisan-katta/marketplace` |
| **Admin model** | Permission `marketplace`; archive/restore/delete (soft); phones allowed |
| **Search/sort** | $text; district; newest / price; optional district boost |
| **Security** | No public phone; location and lifecycle server-owned; contact/report/renew rate-limited |
| **Known limits** | Approximate views; draft image orphans; no chat/pay/ratings; no taluka filter |

---

*Generated from repository inspection of Mobile App, Backend marketplace + admin modules, Website admin Marketplace pages, and `marketplace-pre-release.qa.ts`. Update this file when Marketplace behavior changes.*
