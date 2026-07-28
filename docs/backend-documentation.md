# Kisan Katta — Backend Documentation

> **Scope:** Express/TypeScript API at `Backend/backend/`  
> **Audit date:** 27 July 2026  
> **Status legend:** ✅ Completed · 🚧 In Progress · ⏳ Pending  
> **Source of truth:** repository code only. No invented features.

---

# Overview

Kisan Katta backend is a modular Express + MongoDB API that powers the farmer mobile app, the Gram Sahakari (Village Representative) registration + payment flow, public volunteer verification, and an admin portal (including manual reward ledger).

| Field | Value |
|---|---|
| Package | `kisan-katta-backend` |
| Version | `1.0.0` |
| Entry (dev) | `src/server.ts` via `ts-node` / nodemon |
| Entry (prod) | `dist/server.js` |
| Node | `>= 18.0.0` |
| API prefix | `/api/v1` (health is unversioned `/health`) |
| Default bind | `HOST=0.0.0.0`, `PORT=4000` |

There is **no README**, **no `.env.example`**, **no Dockerfile**, and **no CI config** under `Backend/`. The only prose note is `Lastworkdone.md` (market favourites work log).

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Nodemon + ts-node |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | `node dist/server.js` |
| `npm run lint` / `typecheck` | `tsc --noEmit` (no ESLint package) |
| `npm test` | Vitest |
| `backfill:application-numbers` | Backfill `applicationNumber` |
| `migrate:phase-5a3` | Legacy status → three-state model |
| `payment:reset` | Local-only payment state reset (refuses production) |
| `generate:location-master` | Rebuild `src/data/location-master.json` from the LGD Excel |
| `generate:crop-master` | Rebuild `src/data/crop-master.json` from Agmarknet commodity list |

---

# Tech Stack

| Layer | Package | Version |
|---|---|---|
| HTTP | express | ^4.21.2 |
| ODM | mongoose | ^9.7.3 |
| Validation | zod | ^4.4.3 (partial adoption) |
| Auth | jsonwebtoken | ^9.0.3 |
| Payments | razorpay | ^2.9.8 |
| Media | cloudinary + multer | ^2.10.0 / ^2.2.0 |
| Security headers | helmet | ^8.0.0 |
| CORS | cors | ^2.8.5 |
| Logging | morgan | ^1.10.0 |
| Config | dotenv | ^16.4.7 |
| Weather HTTP | axios | ^1.7.9 |
| Tests | vitest + supertest + mongodb-memory-server | present |

TypeScript is strict (`strict`, `noUnusedLocals`, `noUncheckedIndexedAccess`, etc.). Target ES2022, CommonJS, `outDir: dist`.

**Absent:** SMS/OTP provider SDK, `express-rate-limit`, Winston/Pino, Redis, Docker, CI.

---

# Folder Structure

```
Backend/
└── backend/
    ├── package.json, tsconfig.json, vitest.config.ts
    ├── .env                          # gitignored; no .env.example
    ├── data/                         # Source LGD Excel + Agmarknet crop list
    ├── scripts/                      # migrations, seeds, QA, master generators
    ├── tests/                        # payment, business-flow, application-number
    └── src/
        ├── server.ts                 # Boot: DB → seed admin → schedulers → listen
        ├── app.ts                    # Express factory + middleware chain
        ├── data/
        │   ├── location-master.json  # Generated LGD hierarchy (District→Taluka→Village)
        │   └── crop-master.json      # Generated Agmarknet Crop Master (393 crops)
        ├── config/
        │   ├── env.ts
        │   ├── database.ts
        │   ├── cloudinary.ts
        │   ├── razorpay.ts
        │   └── maharashtraDistrictCoordinates.ts
        ├── controllers/health.controller.ts
        ├── middleware/               # errorHandler, notFound
        ├── routes/                   # aggregator + health
        ├── types/                    # api-response, express.d.ts (rawBody)
        ├── utils/                    # AppError, asyncHandler
        ├── services/.gitkeep         # empty scaffold leftover
        └── modules/
            ├── auth/
            ├── profile/
            ├── admin/
            ├── rewards/
            ├── verification/
            ├── counter/
            ├── marketplace/
            ├── market/
            ├── weather/
            ├── farmer-price/
            ├── gram-sahakari/        # sub-foldered (Village Representative)
            ├── payment/              # sub-foldered (Razorpay engine)
            ├── location/             # read-only LGD Location Master (no DB)
            └── crop/                 # read-only Agmarknet Crop Master (no DB)
```

---

# Architecture

**Modular monolith.** Each feature lives under `src/modules/<name>/`.

Two internal styles:

1. **Flat-file modules** — `auth.service.ts`, `auth.controller.ts`, … (most modules).
2. **Sub-foldered modules** — `service/`, `controller/`, `repository/`, `dto/`, `validation/` (`gram-sahakari`, `payment`).

Conventions:

- Controllers are thin (extract auth user → validate → call service → respond).
- Services own business rules and return DTOs, never Mongoose documents.
- Explicit `toXxxDTO` mappers quarantine persistence from the wire.
- Repositories are optional (used by gram-sahakari, payment, admin, rewards, counter).
- Failures throw `AppError(message, statusCode)`; never return error tuples.
- Constants use `as const` tuples; TypeScript unions are derived from them.

The **payment module** is the architectural high point: a single writer (`completePayment`), a persisted event ledger for exactly-once processing, and a derived state machine.

---

# Request Lifecycle

```
server.ts
  createApp()
  await connectDatabase()          # refuse to listen if Mongo fails
  await seedSuperAdmin()           # non-fatal
  startFarmerPriceScheduler()      # non-fatal
  startPaymentReconciliationScheduler()
  app.listen(port, host)
  unhandledRejection / uncaughtException → server.close → process.exit(1)
```

Middleware order (`app.ts`):

```
helmet
→ cors({ origin: env.corsOrigin })
→ morgan (combined in production; skipped in test)
→ express.json({ verify: stash req.rawBody })   # required for Razorpay HMAC
→ express.urlencoded
→ routes (src/routes/index.ts)
→ notFoundHandler
→ errorHandler
```

Authenticated path example (`POST …/payment/verify`):

```
authenticate → requirePaymentActor → controller (Zod)
→ payment.service.verifyPayment
→ claimEvent (ledger) → completePayment (atomic transition)
→ { success: true, data }
```

`asyncHandler` wraps every async route so rejections reach `errorHandler`.

---

# Authentication

✅ OTP + JWT. **🚧 SMS delivery not implemented.**

| File | Role |
|---|---|
| `auth.model.ts` | `AuthUser` → `auth_users` |
| `otp.service.ts` | In-memory `Map` OTP store |
| `jwt.service.ts` | sign / verify |
| `auth.service.ts` | send / verify / getMe |
| `auth.middleware.ts` | `authenticate`, `getAuthUser` |
| `auth.validator.ts` | Mobile normalize + OTP shape |

### Send OTP

- Accepts `9876543210`, `+919876543210`, `09876543210` → normalize to `+91…`
- 6-digit OTP via `Math.random`, TTL from `OTP_EXPIRY_MINUTES` (default 5)
- Stored in **process-local `Map`** (lost on restart; broken under multi-instance)
- In `NODE_ENV=development`, OTP is returned in the response body
- **No SMS provider call exists** — in non-development environments the OTP is generated and never delivered

### Verify OTP

1. `consumeOtp` (one-time; deletes on success)
2. Find or create `AuthUser` (`isVerified: true`, default role `FARMER`)
3. `resolveAdminAfterAuth` — admin phone match runs **only after** OTP success
4. Sign JWT `{ userId, mobile }` with `JWT_SECRET`, expiry `JWT_EXPIRES_IN` (default `30d`)
5. Return `{ token, isNewUser, isProfileCompleted, role, isAdmin, admin }`

### Middleware

`authenticate` requires `Bearer ` prefix, verifies JWT, then **re-reads** `AuthUser` from Mongo on every request (role changes apply without re-login). Sets `req.user = { userId, mobile, role }`.

`logout` is a no-op acknowledgement — JWT is stateless; no blacklist.

Marketplace browse uses a local `optionalAuthenticate` so listings stay public while enabling district-priority sorting for logged-in users.

---

# Authorization (RBAC)

Two parallel systems:

### A — Platform roles (`auth_users.role`)

`FARMER` (default) · `GRAM_SAHAKARI` · `TEAM` · `ADMIN`

Enforced by `gram-sahakari/middlewares/role.middleware.ts` (`requireRoles`, `requireAdmin`, `requireAdminOrTeam`).

`FARMER → GRAM_SAHAKARI` promotion happens **only** inside `completePayment` when status becomes `SUBMITTED`.

Ownership helpers: `requireFarmerApplicant`, `requirePaymentActor` (allows verify after race promotion), `requireApplicationOwnership` (**defined but unused**).

### B — Admin portal (`admins` collection)

| Admin role | Default permissions |
|---|---|
| `SUPER_ADMIN` | all 10 |
| `ADMIN` | all except `admins` |
| `MANAGER` | eight (no `settings`, no `admins`) |
| `SUPPORT` | five |
| `READ_ONLY` | seven |

Permissions: `dashboard`, `applications`, `payments`, `volunteers`, `farmers`, `rewards`, `analytics`, `settings`, `reports`, `admins`.

Only `SUPER_ADMIN` is seeded today; other roles are “ready for assignment” but there is **no admin CRUD API**.

Rewards writes additionally require `req.admin.role === "SUPER_ADMIN"`.

---

# Modules

## auth ✅

OTP login, JWT, identity middleware. See [Authentication](#authentication).

**Limitation:** in-memory OTP; no SMS.

---

## profile ✅

Farmer profile CRUD + Cloudinary photo. Location is validated against the **Location Master** (LGD). `favoriteCrops` is validated against the **Crop Master** (Agmarknet).

| Field | Notes |
|---|---|
| Collection | `farmer_profiles` |
| Key fields | `userId` (unique), name, `district`/`taluka`/`village` (strings), optional `districtCode`/`talukaCode`/`villageCode`/`villageNameMr`, `favoriteCrops` (1–10 canonical Agmarknet names), `language` (`mr`/`en`/`hi`), `profileImage` |
| Create | 409 if exists; LGD hierarchy required; sets `AuthUser.isProfileCompleted = true` |
| Update | Re-validates full hierarchy whenever any location field is sent |
| Images | Folder `kisan-katta/profile`, `c_limit` 800 px; upload-then-DB with Cloudinary rollback |

### Location integration

Validation order (via `resolveLocationHierarchy` in the Location module):

```
District (code or name)
  → Taluka belongs to district (code or name)
    → Village belongs to taluka (code or name)
```

- New clients may send `districtCode` / `talukaCode` / `villageCode`.
- Legacy clients (mobile) may still send only name strings.
- Codes win when both code and name are provided for the same level.
- District name aliases map historical names (e.g. `Ahmednagar` → LGD `Ahilyanagar`).
- Stored string fields remain **LGD English names** so marketplace / market / farmer-price keep reading `profile.district` as a string (no migration of those modules).
- Optional code fields are null on legacy documents until the farmer updates location.

### Response shape

`GET /api/v1/profile/me` returns flat name strings (mobile-compatible) **and** a structured `location` object:

```json
{
  "district": "Ahilyanagar",
  "taluka": "Akole",
  "village": "Aabitkhind",
  "location": {
    "district": { "code": 466, "name": "Ahilyanagar" },
    "taluka": { "code": 4201, "name": "Akole" },
    "village": { "code": 557293, "name": "Aabitkhind", "nameMr": "आबीतखिंड" }
  }
}
```

Invalid hierarchy → **400** with a precise message (`Invalid district`, `Taluka does not belong to district`, etc.). Never 500 for bad location input.

### Crop integration

`favoriteCrops` is validated via `assertKnownCrops` in the Crop module:

- Each entry must resolve to a known Agmarknet commodity name in `crop-master.json`.
- Legacy profile labels (e.g. `Kanda (Onion)`, `Kapus (Cotton)`) are accepted and normalized to canonical names on write.
- Unknown crops → **400** (`Unknown crop(s) in favoriteCrops: "..."`).
- Stored values remain **exact Agmarknet English strings** (market APIs depend on them).

---

## gram-sahakari (Village Representative Registration) ✅

Multi-step application → document upload → ₹500 payment → official registration.

| Item | Detail |
|---|---|
| Collection | `gram_sahakari_applications` |
| Statuses | `DRAFT` → `PAYMENT_PENDING` → `SUBMITTED` (review workflow removed) |
| Application number | `GS-<YEAR>-<6-digit>` via atomic `counters` |
| Documents | photo, aadhaarFront, aadhaarBack, cancelledCheque (jpeg/png/webp, 5 MB) |
| Submit | Moves to `PAYMENT_PENDING` only — official `SUBMITTED` happens in `completePayment` |
| Progress | Single indicator list drives both in-memory and Mongo filters |
| Audit | Structured stdout JSON (`module: gram-sahakari`); not persisted |

Validation: Zod `.strict()`. Phone is never accepted from the client — always verified `AuthUser.mobile`.

`ApplicationDTO.reviewRemarks` is hardcoded `null` — kept for Website response shape.

---

## payment (Payment Engine) ✅

Razorpay registration fee. Most mature module (~100 tests). See [Payment Engine](#payment-engine).

---

## admin ✅ (read-only portal APIs)

Dashboard, analytics, applications, volunteers, farmers, payments, system info.

Writes (except via rewards sub-router) **do not exist** — no approval, no farmer suspension, no admin user management.

---

## rewards ✅

Manual Village Representative reward **ledger**. Does **not** move money. See [Reward Management](#reward-management).

---

## verification ✅

Public volunteer ID check. See [Verification](#verification).

---

## counter ✅

Atomic named sequences (`findByIdAndUpdate` + `$inc` + upsert). Used by application numbers and reward IDs. Deliberately avoids racy `countDocuments() + 1`.

---

## marketplace ✅

Produce / product listings with saves, contact tracking, image upload.

| Item | Detail |
|---|---|
| Collections | `marketplace`, `marketplace_saved` |
| Statuses | `ACTIVE`, `SOLD`, `ARCHIVED` |
| Expiry | 30 days (`expiresAt`); enforced by query, no cleanup job |
| Images | Max 3; folder `kisan-katta/marketplace` |
| District | Rejected if client-supplied; copied from seller profile |
| Browse | Optional auth; same-district boost via aggregation |
| DELETE | Archives (does not hard-delete) |
| Mark sold | Via `PUT` with `status: "SOLD"` (ARCHIVED via PUT is rejected — use DELETE) |

---

## market ✅

Proxy for data.gov.in Agmarknet mandi prices. **No persistence.** 5-minute in-memory cache. Favourites endpoint fans out one upstream request per favourite crop. District alias map for renamed Maharashtra districts.

**Noise:** heavy `console.log` including farmer profile dump on favourites.

---

## weather ✅

WeatherAPI.com proxy. District → coordinates via `maharashtraDistrictCoordinates.ts`. Separate caches: current 5 min, forecast 30 min, alerts 10 min. Comment notes Redis swap path.

---

## farmer-price ✅

Anonymous community expected-price polls vs government snapshot.

| Rule | Value |
|---|---|
| Poll length | 72 hours |
| Min votes to expose community price | 10 |
| Aggregate | Median |
| Confidence | N/A / LOW / MEDIUM / HIGH |
| Vote range | ±40 % of gov price when available; else ₹1,000–₹100,000 |
| Eligibility | Same district + crop in favourites |
| One vote | Unique `{pollId, userId}` index |
| Insights author | Always `"Anonymous Farmer"` |
| Auto-create | Hourly sync; `MIN_FARMERS_PER_POLL = 1` |
| Slot lock | `farmer_price_open_slots` unique `{district, crop}` |

No “my vote” endpoint — mobile uses local SecureStore cache.

---

## location ✅ (Location Master)

Read-only Maharashtra **LGD (Local Government Directory)** hierarchy. No MongoDB — data is generated from the official Excel into `src/data/location-master.json` and loaded once into memory.

See dedicated section: [Location Module](#location-module).

---

## crop ✅ (Crop Master)

Read-only **Agmarknet commodity catalog**. No MongoDB — data is generated from `allCropNames.txt` into `src/data/crop-master.json` and loaded once into memory.

See dedicated section: [Crop Module](#crop-module).

---

## Modules that do not exist

Checked and absent as standalone modules: **digital ID issuance**, **notifications**, **community/posts**, **orders**, **crop advisory**, **schemes**, **chat/messaging**. Analytics lives inside `admin`. Digital ID is only a reserved metadata field — see [Digital ID](#digital-id).

> Note: Weather / marketplace district coordinates on the backend still use `maharashtraDistrictCoordinates.ts`. Mobile Profile location and crops already use Location Master and Crop Master APIs (`features/location`, `features/crop`).

---

# Location Module

Foundational **Location Master** for Maharashtra. Built so Profile, Registration, Village Representative, Weather, Marketplace, Community, Analytics, Notifications, and Search can later share one official geo source.

### Source data

| Item | Value |
|---|---|
| Excel | `Backend/backend/data/Villageof_Specific_State_2026-07-27_23-37-41.xlsx` |
| Generator | `Backend/backend/scripts/generate-location-master.ts` |
| Command | `npm run generate:location-master` |
| Output | `Backend/backend/src/data/location-master.json` |

Excel **Sub-District** columns are mapped to project **Taluka** everywhere (names, types, routes, JSON keys).

Relevant Excel columns consumed: District Code/Name, Sub-District Code/Name → Taluka, Village Code, Village Name (English + Local), Village Category, Village Status. Ignored: S.No., Village Version, Census codes, Remark.

### Generated JSON shape

Hierarchical (not flattened):

```json
[
  {
    "districtCode": 466,
    "districtName": "Ahilyanagar",
    "talukas": [
      {
        "talukaCode": 4201,
        "talukaName": "Akole",
        "villages": [
          {
            "villageCode": 557293,
            "name": "Aabitkhind",
            "nameMr": "आबीतखिंड",
            "category": "Rural",
            "status": "Inhabitant"
          }
        ]
      }
    ]
  }
]
```

Districts, talukas, and villages are sorted alphabetically. The generator validates district / taluka / village code uniqueness and prints warnings for anomalies (never silently drops code conflicts beyond duplicate village codes).

### Architecture

| File | Role |
|---|---|
| `modules/location/location.types.ts` | Master + DTO interfaces |
| `modules/location/location.service.ts` | Load JSON once; `districtByCode` / `talukaByCode` maps; list helpers |
| `modules/location/location.controller.ts` | Parse path codes; 404 on bad input |
| `modules/location/location.routes.ts` | Public GET routes |
| `modules/location/index.ts` | Public exports |

- **No database**, no writes, no auth required.
- JSON imported once at module load; request handlers never re-read the file.
- Lookups are O(1) via in-memory Maps.

### Endpoints — `/api/v1/location`

Envelope: `{ success: true, data: [...] }`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/districts` | All districts `{ code, name }` |
| GET | `/talukas/:districtCode` | Talukas for a district `{ code, name }` |
| GET | `/villages/:talukaCode` | Villages for a taluka `{ code, name, nameMr, category, status }` |

Invalid / unknown codes → **404** with message `Invalid district code` or `Invalid taluka code` (never 500 for bad input).

### Statistics (from last generation)

| Metric | Value |
|---|---|
| Districts | 35 |
| Talukas | 358 |
| Villages | 44,868 |
| JSON size | ~9.05 MB |

### Future use

Profile create/update already validates against this master via `resolveLocationHierarchy`. Gram Sahakari registration, marketplace district filters, weather district resolution, analytics breakdowns, and notifications should eventually consume these endpoints (or the in-process service helpers) instead of remaining hardcoded Maharashtra lists. **Mobile Profile already uses Location Master APIs** (`features/location`).

---

# Crop Module

Foundational **Crop Master** for Agmarknet commodities. Built so Favourite Crops, Market, Farmer Price, Marketplace, Crop Search, Recommendations, AI, and Analytics can share one canonical crop source.

### Source data

| Item | Value |
|---|---|
| Text file | `Backend/backend/data/allCropNames.txt` |
| Generator | `Backend/backend/scripts/generate-crop-master.ts` |
| Command | `npm run generate:crop-master` |
| Output | `Backend/backend/src/data/crop-master.json` |

Agmarknet commodity `name` values are **never renamed, translated, or replaced** — they must match market APIs exactly.

Marathi labels (`nameMr`) were seeded from the verified curated Maharashtra crop labels that previously lived in the mobile app (now removed). Crops without a verified translation keep `nameMr: ""`. Translations are embedded directly in `crop-master.json` (single source of truth — no separate translations file).

### Deduplication rules

The generator normalizes formatting duplicates only:

- **Case-insensitive** — e.g. `kutki` + `Kutki` → keep `Kutki`
- **Spacing before `(`** — e.g. `Groundnut(Split)` + `Groundnut (Split)` → keep `Groundnut (Split)`

Genuinely different commodities (different wording) are kept as separate entries.

### Generated JSON shape

Flat array, sorted alphabetically by `name`:

```json
[
  {
    "cropId": 259,
    "name": "Onion",
    "nameMr": "कांदा",
    "normalized": "onion",
    "search": ["Onion", "कांदा", "kanda", "Kanda (Onion)"]
  }
]
```

| Field | Purpose |
|---|---|
| `cropId` | Sequential integer ID (1-based); use `cropId` everywhere, never generic `id` |
| `name` | Canonical Agmarknet commodity string |
| `nameMr` | Verified Marathi label (empty when untranslated) |
| `normalized` | Lowercase key for O(1) lookup |
| `search` | English + Marathi + romanized aliases for ranked search and legacy resolution |

### Architecture

| File | Role |
|---|---|
| `modules/crop/crop.types.ts` | Master + DTO interfaces |
| `modules/crop/crop.service.ts` | Load JSON once; `cropById` / `cropByName` / `searchTermIndex` maps |
| `modules/crop/crop.controller.ts` | List + search handlers |
| `modules/crop/crop.routes.ts` | Public GET routes |
| `modules/crop/index.ts` | Public exports |

- **No database**, no writes, no auth required.
- JSON imported once at module load; request handlers never re-read the file.
- Lookups are O(1) via in-memory Maps; search uses an inverted index plus ranked substring matching.

### Endpoints — `/api/v1/crops`

Envelope: `{ success: true, data: [...] }`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | All crops `{ cropId, name, nameMr }` |
| GET | `/search?q=...` | Ranked search (English, Marathi, aliases). Optional `limit` (1–100, default 50) |

Missing or empty `q` → **400**. Unknown query with no matches → **200** with empty array.

### Statistics (from last generation)

| Metric | Value |
|---|---|
| Original entries (raw file) | 424 |
| Formatting duplicates removed | 31 |
| Final crop count | 393 |
| With Marathi (`nameMr`) | 64 |
| Untranslated | 329 |
| JSON size | ~59 KB |

### Validation integration

Profile create/update validates `favoriteCrops` via `assertKnownCrops()` — resolves legacy labels to canonical Agmarknet names and rejects unknown crops with **400**.

### Future use

Market, farmer-price, marketplace, and AI features should eventually consume these endpoints (or in-process helpers) instead of any remaining hardcoded lists. **Mobile Profile and marketplace crop pickers already use Crop Master APIs.**

---

# Database

MongoDB via Mongoose 9. Single `mongoose.connect(env.mongodbUri)` — no pool tuning, no `serverSelectionTimeoutMS`.

### Collections (12)

| Collection | Model |
|---|---|
| `auth_users` | AuthUser |
| `farmer_profiles` | FarmerProfile |
| `admins` | Admin |
| `gram_sahakari_applications` | GramSahakariApplication |
| `razorpay_events` | RazorpayEvent |
| `rewards` | Reward |
| `counters` | Counter |
| `marketplace` | MarketplaceListing |
| `marketplace_saved` | MarketplaceSaved |
| `farmer_price_polls` | FarmerPricePoll |
| `farmer_price_votes` | FarmerPriceVote |
| `farmer_price_open_slots` | FarmerPriceOpenSlot (defined in sync service) |

### Notable indexes

- `auth_users.mobile` unique; `farmer_profiles.userId` unique
- Application: partial unique on `applicationNumber`, `razorpayOrderId`, `razorpayPaymentId`; `{paymentStatus, updatedAt}` for reconciliation
- `razorpay_events.razorpayEventId` unique (exactly-once ledger)
- Marketplace text index on title/description/crop/category; compounds matched to sort options
- Votes: unique `{pollId, userId}`
- Rewards: text index present but search uses `$regex` / `$or`

No TTL indexes. Expired listings and closed polls accumulate indefinitely.

### Relationships

```
AuthUser
  ├─1:1→ FarmerProfile.userId
  ├─1:1→ Admin.userId (nullable; linked at first login)
  ├─1:N→ GramSahakariApplication.userId
  ├─1:N→ MarketplaceListing.sellerId
  ├─1:N→ MarketplaceSaved.userId
  └─1:N→ FarmerPriceVote.userId

GramSahakariApplication
  ├─1:N→ Reward (applicationId + villageRepresentativeId both set to app._id)
  └─1:N→ RazorpayEvent.applicationId

FarmerPricePoll ─1:N→ FarmerPriceVote
MarketplaceListing ─1:N→ MarketplaceSaved
```

No Mongoose `populate()` — joins use `$lookup` or batch queries. Reward denormalizes representative name/district/photo at creation time.

---

# APIs

All success responses use `{ success: true, data }` unless noted. Errors: `{ success: false, message }`.

### Health

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | none |

### Auth — `/api/v1/auth`

| Method | Path | Auth |
|---|---|---|
| POST | `/send-otp` | none |
| POST | `/verify-otp` | none |
| GET | `/me` | JWT |
| POST | `/logout` | JWT (no-op) |

### Profile — `/api/v1/profile`

| Method | Path | Auth |
|---|---|---|
| POST | `/` | JWT |
| GET | `/me` | JWT |
| PUT | `/me` | JWT |
| POST | `/image` | JWT + multer |
| DELETE | `/image` | JWT |

### Weather — `/api/v1/weather` (public)

| Method | Path | Query |
|---|---|---|
| GET | `/current` | `district` |
| GET | `/forecast` | `district`, `days` (1–14) |
| GET | `/alerts` | `district` |

### Market — `/api/v1/market`

| Method | Path | Auth |
|---|---|---|
| GET | `/prices` | none |
| GET | `/favourites` | JWT |

### Marketplace — `/api/v1/marketplace`

| Method | Path | Auth |
|---|---|---|
| GET | `/listings` | optional |
| POST | `/listings` | JWT |
| GET | `/listings/:id` | optional |
| PUT | `/listings/:id` | JWT + owner |
| DELETE | `/listings/:id` | JWT + owner (archive) |
| POST | `/listings/:id/contact` | **none** |
| POST | `/listings/:id/save` | JWT |
| DELETE | `/listings/:id/save` | JWT |
| GET | `/my-listings` | JWT |
| GET | `/saved` | JWT |
| POST | `/images/upload` | JWT |
| DELETE | `/images` | JWT |

### Farmer Price — `/api/v1/farmer-price` (all JWT)

| Method | Path |
|---|---|
| POST | `/polls` |
| GET | `/polls` |
| GET | `/polls/my` |
| GET | `/polls/:pollId` |
| POST | `/polls/:pollId/vote` |
| GET | `/history/:crop` |

### Location — `/api/v1/location` (public, read-only LGD)

| Method | Path | Auth |
|---|---|---|
| GET | `/districts` | none |
| GET | `/talukas/:districtCode` | none |
| GET | `/villages/:talukaCode` | none |

### Crops — `/api/v1/crops` (public, read-only Agmarknet)

| Method | Path | Auth |
|---|---|---|
| GET | `/` | none |
| GET | `/search?q=...` | none |

### Gram Sahakari — `/api/v1/gram-sahakari`

| Method | Path | Auth |
|---|---|---|
| POST | `/application/start` | JWT + farmer applicant |
| GET | `/application/me` | JWT |
| PUT | `/application` | JWT + farmer applicant |
| POST | `/application/upload` | JWT + farmer applicant + multer |
| POST | `/application/submit` | JWT + farmer applicant |
| GET | `/application/status` | JWT |
| GET | `/admin/applications` | JWT + ADMIN\|TEAM |
| GET | `/admin/application/:id` | JWT + ADMIN\|TEAM |

### Payment — also under `/api/v1/gram-sahakari`

| Method | Path | Auth |
|---|---|---|
| POST | `/application/payment/create-order` | JWT + farmer applicant |
| POST | `/application/payment/verify` | JWT + payment actor |
| POST | `/application/payment/failure` | JWT + farmer applicant |
| POST | `/application/payment/webhook` | HMAC only |
| GET | `/application/payment/details` | JWT |
| GET | `/application/payment/reconcile/:applicationId` | JWT + ADMIN |

### Admin Portal — `/api/v1/admin`

All JWT + `requirePortalAdmin` + permission as noted.

| Method | Path | Permission |
|---|---|---|
| GET | `/me` | — |
| GET | `/dashboard` | `dashboard` |
| GET | `/analytics` | `analytics` |
| GET | `/applications` | `applications` |
| GET | `/applications/:id` | `applications` |
| GET | `/volunteers` | `volunteers` |
| GET | `/farmers` | `farmers` |
| GET | `/farmers/:id` | `farmers` |
| GET | `/payments` | `payments` |
| GET | `/system` | `settings` |

### Rewards — `/api/v1/admin/rewards`

| Method | Path | Extra |
|---|---|---|
| GET | `/` | `rewards` |
| GET | `/summary` | `rewards` |
| GET | `/export` | `rewards` (CSV, max 5,000) |
| GET | `/by-representative/:applicationId` | `rewards` |
| GET | `/:id` | `rewards` |
| POST | `/` | SUPER_ADMIN |
| PATCH | `/:id` | SUPER_ADMIN |
| POST | `/:id/mark-paid` | SUPER_ADMIN |
| POST | `/:id/cancel` | SUPER_ADMIN |

### Verification — `/api/v1/verify`

| Method | Path | Auth |
|---|---|---|
| GET | `/:volunteerId` | none + 60/min/IP rate limit |

**Envelope exception:** returns `{ verified, … }` directly (no `{ success, data }` wrapper).

**Total:** 67 HTTP endpoints (1 health + 66 versioned).

---

# Services

Primary service entry points by module:

| Module | Key exports |
|---|---|
| auth | `sendOtp`, `verifyOtpAndAuthenticate`, `getMe`, `generateOtp`, `consumeOtp`, `signToken`, `verifyToken` |
| profile | `createProfile`, `getProfile`, `updateProfile`, image upload/delete |
| gram-sahakari | start/get/update/upload/submit application; list/get for admin; application-number; audit; upload |
| payment | `createPaymentOrder`, `verifyPayment`, `recordPaymentFailure`, `getPaymentDetails`, `completePayment`, `handleWebhook`, `reconcile*` |
| admin | dashboard, analytics, applications, volunteers, payments, farmers, system, seed/resolve admin |
| rewards | list/summary/create/update/mark-paid/cancel/export/CSV |
| verification | `verifyVolunteer` |
| counter | `nextSequence` |
| marketplace | listing CRUD, save/unsave, contact click, images |
| market | `getMarketPrices`, `getFavoriteMarketPrices` |
| weather | current / forecast / alerts |
| farmer-price | create/list/get/my/vote/history; `runFarmerPriceSync`; stats helpers |

---

# Repositories

| Repository | Module |
|---|---|
| `application.repository.ts` | gram-sahakari |
| `payment.repository.ts` / `event.repository.ts` | payment |
| `admin.repository.ts` | admin |
| `reward.repository.ts` | rewards |
| `counter.repository.ts` | counter |
| `verification.repository.ts` | verification |

Profile, marketplace, market, weather, and farmer-price call Mongoose directly from services.

---

# Middleware

| Middleware | Purpose |
|---|---|
| `helmet`, `cors`, `morgan`, JSON/urlencoded | Global |
| `notFoundHandler`, `errorHandler` | Terminal |
| `authenticate` / `optionalAuthenticate` | JWT |
| `requirePortalAdmin`, `requireAdminPermission` | Admin portal |
| `requireRoles` / `requireAdmin` / `requireAdminOrTeam` | Platform RBAC |
| `requireFarmerApplicant` / `requirePaymentActor` | Ownership |
| `requireSuperAdmin` | Rewards writes (local to reward routes) |
| Multer ×3 | Gram Sahakari docs, profile image, marketplace images |
| `verificationRateLimit` | Public verify only |

---

# Validation

Three coexisting styles:

1. **Zod + `parseWithZod`** — gram-sahakari, payment, admin, rewards, verification. Helper is **duplicated** across five files; error formatting differs (join all vs first only).
2. **Hand-written validators** — auth, profile, marketplace, farmer-price.
3. **Inline controller parsers** — market, weather, marketplace, farmer-price query params (`MAX_LIMIT = 100` redefined in multiple places).

Server-authoritative fields: payment amount (constants only), application phone (auth mobile), marketplace district (from profile).

---

# DTOs

Envelope: `ApiSuccessResponse<T>` / `ApiErrorResponse` in `src/types/api-response.ts`.

Every module maps to explicit DTOs (auth, profile, admin, rewards, verification, application, payment, marketplace, market, weather, farmer-price).

**Pagination inconsistency:** admin/rewards/gram-sahakari use flat `{ items, page, limit, total, totalPages }`; marketplace/farmer-price nest under `{ listings|polls, pagination }`.

**Upstream quarantine:** only `market.types.ts` / `weather.types.ts` know third-party field names.

---

# Payment Engine

✅ Production-grade design for the ₹500 Gram Sahakari registration fee.

### Money

```
REGISTRATION_FEE_PAISE = 50000   // defined ONLY in payment.constants.ts
PAYMENT_CURRENCY = "INR"
PAYMENT_GATEWAY = "RAZORPAY"
```

Client never supplies amount. Amount is re-checked on verify, webhook, and reconciliation.

### State machine

```
NOT_REQUIRED → PENDING
PENDING      → AUTHORIZED | PAID | FAILED
AUTHORIZED   → PAID | FAILED
PAID         → REFUNDED
FAILED       → PENDING | AUTHORIZED | PAID   # attempt-level, not order-terminal
REFUNDED     → (terminal)
```

### Single writer

`completePayment` in `finalize.service.ts` is the **only** function that mutates payment status, application status, timeline, and role promotion. Entry paths:

1. Browser verify (`source: VERIFY`)
2. Razorpay webhook (`source: WEBHOOK`)
3. Reconciliation (`source: RECONCILIATION`)

Concurrency: `findOneAndUpdate` guarded on `paymentStatus ∈ fromStates` derived from the transition table. First writer wins; replays return `changed: false`.

On successful PAID write → `status = SUBMITTED`, `paymentVerified = true`, promote user to `GRAM_SAHAKARI`.

### Exactly-once ledger

`razorpay_events` unique on `razorpayEventId`. `claimEvent` upserts and returns pre-image. States: `PROCESSING` / `PROCESSED` / `IGNORED` / `DUPLICATE` / `FAILED`. Survives process restart.

### Order creation

Idempotent reuse of open order; atomic `attachOrderToApplication` clears prior-attempt payment identity and pushes `ORDER_CREATED`.

### Webhook

HMAC over `req.rawBody` with `RAZORPAY_WEBHOOK_SECRET`. Unsupported/no-match → 200 IGNORED. `AppError` → 200 (don’t retry). Unexpected → 500 (retry).

### Reconciliation scheduler

Every **15 minutes** (+ immediate boot sweep). Batch limit 100. Disabled without Razorpay keys or in test. Overlap guard + `unref()`.

### Refunds

Webhook handlers for refund events exist; **no API initiates refunds** — inbound from Razorpay dashboard only.

### Tests

~100 tests across `payment.service.test.ts`, `payment.audit.test.ts`, `payment.reliability.test.ts` (races, replay, crash recovery, restart dedup).

---

# Reward Management

✅ Record-only ledger for Village Representatives.

| Item | Detail |
|---|---|
| Statuses | `PENDING` → `PAID` \| `CANCELLED` |
| Methods (record) | `BANK_TRANSFER`, `UPI`, `CASH`, `CHEQUE` |
| Reasons | 8 fixed enums (Outstanding Village Work, …, Other) |
| Reward ID | `RWD-<YEAR>-<6-digit>` |
| Eligibility | Application `SUBMITTED` + `paymentStatus PAID` |
| Amount | > 0 and ≤ 1,000,000 |
| Money movement | **None** — `markRewardPaid` documents an external transfer |

Volunteer display ID: `GS-2026-000012` → `GS-MH-2026-000012` (`toVolunteerId`, duplicated in admin/reward/verification).

CSV export: 16 columns, max 5,000 rows, RFC-4180 escaping.

---

# Digital ID

⏳ **Not implemented as a module.**

Reserved only in `IApplicationMetadata`:

```ts
/** Reserved for OCR, digital ID, commission payouts, and QR verification. */
ocrExtraction?: Record<string, unknown>;
digitalId?: string;
commissionProfileId?: string;
qrVerificationCode?: string;
```

Stored as `metadata: Schema.Types.Mixed`. **No code reads or writes these fields.** Closest live concept: Volunteer ID (`GS-MH-…`) + public verification endpoint.

---

# Verification

✅ Public volunteer verification.

- Path: `GET /api/v1/verify/:volunteerId`
- Accepts `GS-MH-2026-000012` or `GS-2026-000012`
- Projection selects **only** safe fields (never Aadhaar, bank, phone, email, userId)
- Active = `SUBMITTED` + `PAID`
- Outcomes: 200 verified · 404 not found · 200 inactive (intentional status distinction)
- Rate limit: 60 req/min/IP (in-memory)
- Response envelope differs from the rest of the API

---

# Admin Portal APIs

See endpoint tables above. Behavioural notes:

- Dashboard runs ~11–12 queries in `Promise.all`; revenue = `paidCount × 50000` paise (derived).
- Analytics re-runs the full dashboard then adds aggregations; monthly growth `$limit: 12` after ascending sort returns the **oldest** twelve months (visible bug).
- Farmers aggregation derives `accountStatus` (ACTIVE if verified + `lastLoginAt` within 90 days).
- Farmer detail returns several fields hardcoded `null` (`email`, `orders`, `communityPosts`, `marketplaceListings`, `weatherUsage`, …) as shape placeholders.
- `/system` hardcodes `backendVersion: "1.0.0"` and `frontendVersion: "0.0.0"`.
- `listPayments` search queries nested `payment.razorpayOrderId` paths that **do not exist** on the schema (real fields are top-level) — gateway-id search fails.
- Portal is read-only aside from rewards.

---

# Scheduler

| Scheduler | Interval | Role |
|---|---|---|
| Payment reconciliation | 15 min (+ boot) | Repair PENDING/AUTHORIZED/FAILED vs Razorpay |
| Farmer-price sync | 60 min (+ boot) | Create polls for district+crop pairs |

Both use `setInterval` (no `node-cron`). Overlap guards; payment scheduler disables without keys / in test. No distributed lock — safe under multi-instance due to atomic writes / slot unique index, but not designed for it.

**Not scheduled:** marketplace expiry cleanup, poll closure writes, TTL compaction.

---

# Environment Variables

**Names only** (from `src/config/env.ts` and direct `process.env` reads):

| Name | Has code default? |
|---|---|
| `PORT` | yes — `4000` |
| `HOST` | yes — `0.0.0.0` |
| `NODE_ENV` | yes — `development` |
| `CORS_ORIGIN` | yes — `*` |
| `MONGODB_URI` | yes — local mongodb |
| `JWT_SECRET` | yes — `changeme` |
| `JWT_EXPIRES_IN` | yes — `30d` |
| `OTP_EXPIRY_MINUTES` | yes — `5` |
| `MARKET_API_BASE_URL` | yes — data.gov.in |
| `MARKET_DATASET_ID` | yes — hardcoded dataset id |
| `MARKET_API_KEY` | no — empty |
| `WEATHER_API_KEY` | no — empty |
| `CLOUDINARY_CLOUD_NAME` | no — empty |
| `CLOUDINARY_API_KEY` | no — empty |
| `CLOUDINARY_API_SECRET` | no — empty |
| `RAZORPAY_KEY_ID` | no — empty |
| `RAZORPAY_KEY_SECRET` | no — empty |
| `RAZORPAY_WEBHOOK_SECRET` | no — empty |
| `MARKET_RECENT_DAYS` | yes — `20` (read outside `env.ts`) |
| `QA_BASE_URL` | scripts only |

**No `.env.example` exists.** `.env` is gitignored.

---

# Security

### Present

- `helmet()` defaults
- JWT with minimal payload; user re-fetched per request
- Razorpay Checkout signature + webhook HMAC over raw body
- Server-side fee authority; order/payment identity binding
- Ownership via `req.user.userId` (not client ids)
- Public verification field projection
- Upload MIME allowlist + 5 MB + memory storage
- Cloudinary destroy guarded by folder prefix
- Secret redaction helpers in Razorpay debug logs
- Error responses never include stack traces
- One-time OTP consume; admin resolution only post-OTP

### Visible weaknesses

| Issue | Detail |
|---|---|
| `JWT_SECRET` default `"changeme"` | Silent forgeable tokens if unset |
| `CORS_ORIGIN` default `*` | Open CORS |
| No OTP rate limit | Unlimited send/verify attempts |
| No SMS delivery | Login impossible outside development OTP echo |
| In-memory OTP + rate limiter | Broken / weak under horizontal scale |
| Temporary payment debug logs | Full verify bodies; marked “Remove after QA” |
| Market logs farmer profile | PII on favourites path |
| `SUPER_ADMIN_SEED` PII in source | Name/phone/email/address in `admin.constants.ts` |
| Unescaped regex in some searches | Rewards / payments search ReDoS risk |
| No `trust proxy` | `req.ip` wrong behind load balancers |
| Cloudinary config asserts at import | Missing creds crash boot before handlers |
| Contact-click endpoint unauthenticated | Counter trivially inflatable |

---

# Deployment

**No deployment artifacts** in the repository:

- No Dockerfile / docker-compose / `.dockerignore`
- No GitHub Actions / GitLab CI / Procfile / PM2 / systemd
- No `.nvmrc`, no `.env.example`, no README deploy section

Operational contract is `npm run build && npm start` with Node ≥ 18.

Boot design assumes an orchestrator that restarts on `process.exit(1)` after Mongo failure or uncaught errors. **No `SIGTERM`/`SIGINT` graceful shutdown** — deploys drop in-flight requests and do not close Mongoose cleanly.

Useful ops scripts: backfill application numbers, phase-5a3 status migration, payment-reset (local only), gram-sahakari seed, farmer-price QA/investigate scripts.

---

# Current Production Status

| Area | Status |
|---|---|
| Payment engine (Razorpay) | ✅ Strong — single writer, ledger, reconciliation, tests |
| Gram Sahakari application flow | ✅ Complete (review workflow intentionally removed) |
| Profile / marketplace / weather / market / farmer-price | ✅ Feature-complete for current APIs |
| Admin portal (read) + rewards ledger | ✅ Complete for implemented scope |
| Public verification | ✅ Complete |
| Authentication for real users | 🚧 OTP works in code; **SMS missing**; in-memory store |
| Multi-instance / Redis | ⏳ Not ready (OTP, caches, rate limit are process-local) |
| Deployment packaging | ⏳ Absent |
| Observability | 🚧 Morgan + console; audit stdout-only; noisy debug logs |
| Test coverage outside payment | ⏳ Effectively absent |

**Overall:** Payment and Village Representative registration are the most production-ready subsystems. Farmer-facing APIs used by the mobile app are implemented. **Authentication and deployment are the blockers for real production traffic.**

---

# Known Limitations

Only items visible in code or comments:

| Limitation | Evidence |
|---|---|
| OTP store is process-local | `otp.service.ts` — swap Redis/DB by replacing two functions |
| OTP returned in development for testing without SMS | `auth.service.ts` |
| JWT cannot be invalidated server-side | `auth.controller.ts` logout comment |
| Application review workflow removed | DTO / admin routes comments |
| Weather cache intended to become Redis | `weather.service.ts` |
| Verification rate limiter deliberately minimal | `verification.rate-limit.ts` |
| Only SUPER_ADMIN seeded | `admin.constants.ts` |
| Payment debug logger temporary | `payment-debug.ts` — “Remove after QA” |
| Razorpay temporary debug block | `razorpay.service.ts` |
| Gov market uses legacy district names | Alias map in `market.service.ts` |
| Farmer-price sync not a public HTTP API | `farmer-price.sync.service.ts` |
| Standalone Mongo cannot use transactions for votes | Compensatory rollback path |
| Cloudinary replaced-asset cleanup is best-effort | Upload services |
| Analytics monthly growth returns oldest months | `$limit` after ascending sort |
| Payments search cannot match gateway ids | Wrong nested field paths |
| Reward “this month” metrics disagree | `createdAt` vs `paidDate` |
| Double admin middleware on `/admin/rewards` | Mount order |
| Unbounded `paymentEvents[]` growth | Embedded array, no compaction |
| No TTL / expiry cleanup jobs | Listings & polls accumulate |

---

# Future Improvements

Derived **only** from existing comments / reserved fields (no invented product ideas):

1. **Persistent OTP store (Redis/DB)** — `otp.service.ts` documents the swap path.
2. **SMS provider integration** — implied by development-only OTP echo; no provider wired.
3. **Redis for weather (and similar) caches** — explicit comment in `weather.service.ts`.
4. **OCR / digital ID / commission / QR** — reserved `IApplicationMetadata` fields; unread/unwritten.
5. **Admin role assignment beyond SUPER_ADMIN** — RBAC tables ready; no assignment API.
6. **Farmer-price sync admin tooling** — comment anticipates future admin tools.
7. **Structured audit → analytics pipeline** — gram-sahakari audit service comment.
8. **Remove temporary payment / Razorpay debug loggers** after QA.
9. **Initiate refunds from API** — webhook path exists; outbound refund API does not.
10. **`.env.example`, Dockerfile, graceful shutdown, OTP rate limits** — gaps visible from missing artifacts / insecure defaults.

There are **zero** `TODO` / `FIXME` / `HACK` / `WIP` markers under `src/`.
