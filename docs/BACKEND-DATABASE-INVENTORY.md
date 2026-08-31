# Kissan Agrisathi — Backend + Database Inventory

**Audit only. No code or database was modified.**  
**Date:** 2026-08-30  
**Scope:** `Backend/backend`, `Website Frontend`, `Mobile App`

---

## Summary counts

| Metric | Count |
|---|---|
| Total API endpoints | **114** |
| Used APIs (live UI, mobile, or Razorpay webhook) | **87** |
| Unused APIs (no live caller) | **27** |
| Potentially duplicated APIs | **7** |
| Missing APIs identified | **10** |
| Total MongoDB collections/models | **16** |
| Used collections | **15** |
| Partially used | **1** |
| Unused/orphaned collections | **0** |
| Third-party integrations | **4** |

**Usage rule:** *Used* = called by a routed website/admin page, a mobile screen, or Razorpay. Pages that exist but are **not registered in `App.tsx`** are treated as unused.

---

## 1. All API endpoints

Base: Express `createApp()` — no extra prefix. Business APIs under `/api/v1`. Health at `/health`. No Swagger.

Auth keys: **Public** · **JWT** · **Admin** (portal RBAC) · **JWT ADMIN/TEAM** (legacy GS) · **Webhook** (Razorpay HMAC)

---

### Health

#### GET /health
Purpose: Liveness + Mongo ready + uptime. Auth: Public  
Used in: Infra only  
Backend: `health.controller` → `getHealth`

---

### Auth

#### POST /api/v1/auth/send-otp
Purpose: Generate OTP (in-memory; no SMS provider). Auth: Public  
Used in: Website Login/VerifyOtp · Mobile Mobile/OTP  
Backend: `sendOtpHandler` → `sendOtp` / `otp.service`

#### POST /api/v1/auth/verify-otp
Purpose: Verify OTP, create AuthUser if new, issue JWT. Auth: Public  
Used in: Website VerifyOtp · Mobile OTP  
Backend: `verifyOtpHandler` → `verifyOtpAndAuthenticate`

#### GET /api/v1/auth/me
Purpose: Current user + subscription flags. Auth: JWT  
Used in: Website AuthContext · Mobile AuthContext  
Backend: `getMeHandler` → `getMe`

#### POST /api/v1/auth/logout
Purpose: Stateless logout ack. Auth: JWT  
Used in: Website LogoutButton · Mobile: NONE (local token wipe)  
Backend: `logoutHandler` (no service)

---

### Profile

All JWT. Website never calls these (website `/profile` uses GS `application/me`).

#### POST /api/v1/profile
Purpose: Create farmer profile. Auth: JWT  
Used in: Mobile Complete Profile  
Backend: `createProfileHandler` → `createProfile`

#### GET /api/v1/profile/me
Purpose: Own profile. Auth: JWT  
Used in: Mobile Home, Market, Profile, Edit Profile, Farmer Price, marketplace/assistance autofill  
Backend: `getProfileHandler` → `getProfile`

#### PUT /api/v1/profile/me
Purpose: Update profile. Auth: JWT  
Used in: Mobile Edit Profile  
Backend: `updateProfileHandler` → `updateProfile`

#### POST /api/v1/profile/image
Purpose: Upload avatar to Cloudinary. Auth: JWT  
Used in: Mobile Complete/Edit/Profile  
Backend: `uploadProfileImageHandler` → `uploadProfileImage`

#### DELETE /api/v1/profile/image
Purpose: Delete avatar. Auth: JWT  
Used in: Mobile Complete/Edit/Profile  
Backend: `deleteProfileImageHandler` → `deleteProfileImage`

---

### Location

All Public. Data: in-memory `location-master.json` (LGD), not Mongo.

#### GET /api/v1/location/districts
Purpose: District list. Auth: Public  
Used in: Website AddressStep · Mobile ProfileForm  
Backend: `listDistrictsHandler` → `listDistricts`

#### GET /api/v1/location/talukas/:districtCode
Purpose: Talukas in district. Auth: Public  
Used in: Website AddressStep · Mobile ProfileForm  
Backend: `listTalukasHandler` → `listTalukasByDistrictCode`

#### GET /api/v1/location/villages/:talukaCode
Purpose: Villages in taluka. Auth: Public  
Used in: Website AddressStep · Mobile ProfileForm  
Backend: `listVillagesHandler` → `listVillagesByTalukaCode`

---

### Crops

All Public. Data: in-memory `crop-master.json` (Agmarknet catalog). Website: NONE.

#### GET /api/v1/crops
Purpose: Full crop list. Auth: Public  
Used in: Mobile Profile, CropMultiSelect, Farmer Price  
Backend: `listCropsHandler` → `listCrops`

#### GET /api/v1/crops/search
Purpose: Search crops. Auth: Public  
Used in: Mobile CropMultiSelect / CropSelector  
Backend: `searchCropsHandler` → `searchCrops`

---

### Weather

All Public. Website: NONE.

#### GET /api/v1/weather/current
Purpose: Current weather by district. Auth: Public  
Used in: Mobile Home weather card  
Backend: `getCurrentWeatherHandler` → `getCurrentWeather`

#### GET /api/v1/weather/forecast
Purpose: Forecast by district. Auth: Public  
Used in: Mobile Home 7-day forecast  
Backend: `getForecastHandler` → `getForecast`

#### GET /api/v1/weather/alerts
Purpose: Alerts by district. Auth: Public  
Used in: Mobile Home alerts  
Backend: `getAlertsHandler` → `getAlerts`

---

### Market

#### GET /api/v1/market/intelligence
Purpose: Crop intelligence (multi-mandi). Auth: Public  
Used in: Mobile Home market cards · Mobile Market tab  
Backend: `getIntelligence` → `getCropMarketIntelligence`

#### GET /api/v1/market/prices
Purpose: Flat mandi list. Auth: Public  
Used in: **UNUSED** (mobile helper exists, never called; QA scripts only)  
Backend: `getPrices` → `getMarketPrices`

#### GET /api/v1/market/favourites
Purpose: Favorite-crop prices. Auth: JWT  
Used in: **UNUSED** (mobile uses `/intelligence` per crop)  
Backend: `getFavoritePrices` → `getFavoriteMarketPrices`

---

### Farmer Price

All JWT. Polls are created by `farmer-price.scheduler` (service), not by mobile.

#### GET /api/v1/farmer-price/polls/my
Purpose: My district/crop polls. Auth: JWT  
Used in: Mobile Farmer Price tab  
Backend: `getMyPollsHandler` → `getMyPolls`

#### GET /api/v1/farmer-price/polls/:pollId
Purpose: Poll detail. Auth: JWT  
Used in: Mobile Farmer Price tab · Poll Detail  
Backend: `getPollHandler` → `getPoll`

#### POST /api/v1/farmer-price/polls/:pollId/vote
Purpose: Submit vote. Auth: JWT  
Used in: Mobile Poll Detail  
Backend: `submitVoteHandler` → `submitVote`

#### POST /api/v1/farmer-price/polls
Purpose: Create poll. Auth: JWT  
Used in: **UNUSED** (scheduler writes via service; QA only)  
Backend: `createPollHandler` → `createPoll`

#### GET /api/v1/farmer-price/polls
Purpose: List polls. Auth: JWT  
Used in: **UNUSED** (QA only)  
Backend: `getPollsHandler` → `getPolls`

#### GET /api/v1/farmer-price/history/:crop
Purpose: Vote history. Auth: JWT  
Used in: **UNUSED** (QA only)  
Backend: `getHistoryHandler` → `getHistory`

---

### Marketplace

Website: NONE (admin pages exist, not routed).

#### GET /api/v1/marketplace/listings
Purpose: Browse listings. Auth: Optional JWT  
Used in: Mobile Produce / Products / Labour  
Backend: `getListingsHandler` → `getListings`

#### POST /api/v1/marketplace/listings
Purpose: Create listing. Auth: JWT  
Used in: Mobile Create Listing  
Backend: `createListingHandler` → `createListing`

#### GET /api/v1/marketplace/listings/:id
Purpose: Listing detail. Auth: Optional JWT  
Used in: Mobile Listing Detail · Edit Listing  
Backend: `getListingByIdHandler` → `getListingById`

#### PUT /api/v1/marketplace/listings/:id
Purpose: Update / mark sold. Auth: JWT  
Used in: Mobile Edit Listing  
Backend: `updateListingHandler` → `updateListing`

#### DELETE /api/v1/marketplace/listings/:id
Purpose: Archive listing. Auth: JWT  
Used in: Mobile My Listings · Detail  
Backend: `archiveListingHandler` → `archiveListing`

#### GET /api/v1/marketplace/my-listings
Purpose: Seller listings. Auth: JWT  
Used in: Mobile My Listings  
Backend: `getMyListingsHandler` → `getMyListings`

#### GET /api/v1/marketplace/my-summary
Purpose: Seller summary. Auth: JWT  
Used in: Mobile Home marketplace card  
Backend: `getMyMarketplaceSummaryHandler` → `getMyMarketplaceSummary`

#### GET /api/v1/marketplace/saved
Purpose: Saved listings. Auth: JWT  
Used in: Mobile Browse · Saved Listings  
Backend: `getSavedListingsHandler` → `getSavedListings`

#### POST /api/v1/marketplace/listings/:id/save
Purpose: Save listing. Auth: JWT  
Used in: Mobile browse heart  
Backend: `saveListingHandler` → `saveListing`

#### DELETE /api/v1/marketplace/listings/:id/save
Purpose: Unsave. Auth: JWT  
Used in: Mobile browse · Saved  
Backend: `unsaveListingHandler` → `unsaveListing`

#### POST /api/v1/marketplace/listings/:id/contact
Purpose: Record contact click. Auth: Public  
Used in: Mobile Listing Detail call/WhatsApp  
Backend: `contactListingHandler` → `recordContactClick`

#### POST /api/v1/marketplace/images/upload
Purpose: Upload images. Auth: JWT  
Used in: Mobile Create/Edit Listing  
Backend: `uploadMarketplaceImagesHandler` → `uploadMarketplaceImages`

#### DELETE /api/v1/marketplace/images
Purpose: Delete uploaded image. Auth: JWT  
Used in: Mobile Create/Edit Listing  
Backend: `deleteMarketplaceImageHandler` → `deleteMarketplaceImage`

---

### Assistance

Website farmer: NONE. Admin moderation pages exist, **not routed**.

#### GET /api/v1/assistance
Purpose: Public approved feed. Auth: Optional JWT  
Used in: Mobile Assistance tab  
Backend: `getHelpRequestsHandler` → `getHelpRequests`

#### POST /api/v1/assistance
Purpose: Create request. Auth: JWT  
Used in: Mobile Create Help Request  
Backend: `createHelpRequestHandler` → `createHelpRequest`

#### GET /api/v1/assistance/:id
Purpose: Request detail. Auth: Optional JWT  
Used in: Mobile Detail · Edit  
Backend: `getHelpRequestByIdHandler` → `getHelpRequestById`

#### PATCH /api/v1/assistance/:id
Purpose: Update own request. Auth: JWT  
Used in: Mobile Edit Help Request  
Backend: `updateHelpRequestHandler` → `updateHelpRequest`

#### PATCH /api/v1/assistance/:id/resolve
Purpose: Mark resolved. Auth: JWT  
Used in: Mobile My Requests · Detail  
Backend: `resolveHelpRequestHandler` → `resolveHelpRequest`

#### DELETE /api/v1/assistance/:id
Purpose: Soft-delete own request. Auth: JWT  
Used in: Mobile My Requests · Detail  
Backend: `deleteHelpRequestHandler` → `deleteHelpRequest`

#### POST /api/v1/assistance/:id/support
Purpose: Support another request. Auth: JWT  
Used in: Mobile feed · Detail  
Backend: `supportHelpRequestHandler` → `supportHelpRequest`

#### POST /api/v1/assistance/:id/report
Purpose: Report request. Auth: JWT  
Used in: Mobile feed · Detail  
Backend: `reportHelpRequestHandler` → `reportHelpRequest`

#### GET /api/v1/assistance/my-assistance
Purpose: My requests. Auth: JWT  
Used in: Mobile My Help Requests  
Backend: `getMyHelpRequestsHandler` → `getMyHelpRequests`

#### GET /api/v1/assistance/my-summary
Purpose: My stats / slot gate. Auth: JWT  
Used in: Mobile Assistance tab · Create · My Requests  
Backend: `getMyAssistanceSummaryHandler` → `getMyAssistanceSummary`

#### POST /api/v1/assistance/images/upload
Purpose: Upload proof photos. Auth: JWT  
Used in: Mobile Create/Edit  
Backend: `uploadAssistanceImagesHandler` → `uploadAssistanceImages`

#### DELETE /api/v1/assistance/images
Purpose: Delete proof photo. Auth: JWT  
Used in: Mobile Create/Edit  
Backend: `deleteAssistanceImageHandler` → `deleteAssistanceImage`

---

### Assistance admin

All Admin + `assistance` permission. **UNUSED** — `AdminAssistancePage` not in `App.tsx`.

| Method | Route | Purpose | Backend |
|---|---|---|---|
| GET | `/api/v1/admin/assistance` | Moderation queue | `listAdminHelpRequestsHandler` |
| PATCH | `/api/v1/admin/assistance/:id/approve` | Approve | `approveHelpRequestHandler` |
| PATCH | `/api/v1/admin/assistance/:id/reject` | Reject | `rejectHelpRequestHandler` |
| PATCH | `/api/v1/admin/assistance/:id/archive` | Archive | `archiveHelpRequestHandler` |

---

### Gram Sahakari — application

Mobile does **not** run the application wizard (website only). Mobile uses representative discovery only.

#### POST /api/v1/gram-sahakari/application/start
Purpose: Start draft. Auth: JWT + farmer applicant  
Used in: Website ApplicationPage  
Backend: `startApplicationHandler` → `startApplication`

#### GET /api/v1/gram-sahakari/application/me
Purpose: Own application. Auth: JWT + farmer applicant  
Used in: Website Application, Status, Success, Profile  
Backend: `getMyApplicationHandler` → `getMyApplication`

#### PUT /api/v1/gram-sahakari/application
Purpose: Autosave wizard. Auth: JWT + farmer applicant  
Used in: Website ApplicationWizard  
Backend: `updateApplicationHandler` → `updateMyApplication`

#### POST /api/v1/gram-sahakari/application/upload
Purpose: Upload KYC doc (Cloudinary). Auth: JWT + farmer applicant  
Used in: Website UploadCard  
Backend: `uploadDocumentHandler` → `uploadApplicationDocument`

#### POST /api/v1/gram-sahakari/application/submit
Purpose: Submit after payment. Auth: JWT + farmer applicant  
Used in: Website Wizard · Status  
Backend: `submitApplicationHandler` → `submitApplication`

#### GET /api/v1/gram-sahakari/application/status
Purpose: Status/progress. Auth: JWT + farmer applicant  
Used in: Website ApplicationStatusPage  
Backend: `getApplicationStatusHandler` → `getApplicationStatus`

#### GET /api/v1/gram-sahakari/representative
Purpose: Nearby Village Representatives. Auth: JWT  
Used in: Mobile Home GS card · Website: NONE  
Backend: `getRepresentativeDiscoveryHandler` → `discoverRepresentativesForFarmer`

---

### Gram Sahakari — payment

#### POST /api/v1/gram-sahakari/application/payment/create-order
Purpose: Razorpay order. Auth: JWT + farmer applicant  
Used in: Website payment flow  
Backend: `createOrderHandler` → `createPaymentOrder`

#### POST /api/v1/gram-sahakari/application/payment/verify
Purpose: Verify checkout. Auth: JWT + payment actor  
Used in: Website payment flow  
Backend: `verifyPaymentHandler` → `verifyPayment`

#### POST /api/v1/gram-sahakari/application/payment/webhook
Purpose: Razorpay webhook (also forwards `subscription.*`). Auth: Webhook  
Used in: Razorpay  
Backend: `webhookHandler` → `handleWebhook` / `handleSubscriptionWebhook`

#### POST /api/v1/gram-sahakari/application/payment/failure
Purpose: Record failed payment. Auth: JWT  
Used in: **UNUSED**  
Backend: `paymentFailureHandler` → `recordPaymentFailure`

#### GET /api/v1/gram-sahakari/application/payment/details
Purpose: Own payment details. Auth: JWT  
Used in: **UNUSED**  
Backend: `paymentDetailsHandler` → `getPaymentDetails`

#### GET /api/v1/gram-sahakari/application/payment/reconcile/:applicationId
Purpose: Reconcile vs Razorpay. Auth: JWT ADMIN  
Used in: **UNUSED** (duplicate of admin POST)  
Backend: `reconcileHandler` → `reconcileApplicationForAdmin`

---

### Gram Sahakari — legacy admin

Website uses `/api/v1/admin/applications` instead.

#### GET /api/v1/gram-sahakari/admin/applications
Purpose: List applications. Auth: JWT ADMIN/TEAM  
Used in: **UNUSED**  
Backend: `listApplicationsHandler` → `listApplications`

#### GET /api/v1/gram-sahakari/admin/application/:id
Purpose: Application detail. Auth: JWT ADMIN/TEAM  
Used in: **UNUSED**  
Backend: `getApplicationByIdHandler` → `getApplicationById`

---

### Subscription

Website: NONE. Mobile paywall + billing.

#### POST /api/v1/subscription/create
Purpose: Create Razorpay subscription. Auth: JWT  
Used in: Mobile Subscription paywall  
Backend: `createSubscriptionHandler` → `createSubscription`

#### GET /api/v1/subscription/status
Purpose: Status summary. Auth: JWT  
Used in: Mobile paywall  
Backend: `getSubscriptionStatusHandler` → `getSubscriptionStatus`

#### GET /api/v1/subscription/current
Purpose: Current record. Auth: JWT  
Used in: Mobile Billing  
Backend: `getCurrentSubscriptionHandler` → `getCurrentSubscription`

#### POST /api/v1/subscription/verify
Purpose: Verify auth payment. Auth: JWT  
Used in: Mobile paywall  
Backend: `verifySubscriptionHandler` → `verifySubscriptionAuth`

#### POST /api/v1/subscription/refresh
Purpose: Sync from Razorpay. Auth: JWT  
Used in: Mobile paywall · Billing  
Backend: `refreshSubscriptionHandler` → `refreshSubscriptionState`

#### POST /api/v1/subscription/cancel
Purpose: Cancel at cycle end. Auth: JWT  
Used in: Mobile Billing  
Backend: `cancelSubscriptionHandler` → `cancelSubscription`

#### GET /api/v1/subscription/billing/history
Purpose: Billing list. Auth: JWT  
Used in: Mobile Billing  
Backend: `billingHistoryHandler` → `getBillingHistory`

#### GET /api/v1/subscription/billing/history/:paymentId
Purpose: One payment. Auth: JWT  
Used in: Mobile Billing Detail  
Backend: `billingDetailHandler` → `getBillingPaymentDetail`

#### POST /api/v1/subscription/webhook
Purpose: Subscription webhook. Auth: Webhook  
Used in: Razorpay (duplicate capability vs GS webhook)  
Backend: `subscriptionWebhookHandler` → `handleSubscriptionWebhook`

#### POST /api/v1/subscription/resume
Purpose: Resume paused sub. Auth: JWT  
Used in: **UNUSED**  
Backend: `resumeSubscriptionHandler` → `resumeSubscription`

#### POST /api/v1/subscription/refund
Purpose: User refund — **always returns 501** after calling refund service. Auth: JWT  
Used in: **UNUSED**  
Backend: `refundSubscriptionHandler` → `createSubscriptionRefund`

---

### Verification

#### GET /api/v1/verify/:volunteerId
Purpose: Public GS ID check. Auth: Public + rate limit  
Used in: Website VerifyVolunteerPage · Mobile: NONE  
Backend: `verifyVolunteerHandler` → `verifyVolunteer`

---

### Admin portal

Router: JWT + `requirePortalAdmin`. Permission noted where applicable.

#### GET /api/v1/admin/me
Purpose: Portal admin profile. Auth: Admin  
Used in: Admin Settings  
Backend: `getMeAdminHandler`

#### GET /api/v1/admin/dashboard
Purpose: Dashboard summary. Auth: Admin `dashboard`  
Used in: AdminDashboardPage  
Backend: `getDashboardHandler` → `getDashboardSummary`

#### GET /api/v1/admin/dashboard/ops
Purpose: Ops metrics. Auth: Admin `dashboard`  
Used in: AdminDashboardPage  
Backend: `enhancedDashboardHandler` → `getEnhancedDashboardMetrics`

#### GET /api/v1/admin/analytics
Purpose: Analytics. Auth: Admin `analytics`  
Used in: AdminAnalyticsPage  
Backend: `getAnalyticsHandler` → `getAnalyticsSummary`

#### GET /api/v1/admin/analytics/locations
Purpose: Location breakdown. Auth: Admin `analytics`  
Used in: AdminAnalyticsPage  
Backend: `getAnalyticsLocationsHandler`

#### GET /api/v1/admin/search
Purpose: Unified search. Auth: Admin `farmers`  
Used in: AdminLayout topbar  
Backend: `unifiedSearchHandler` → `unifiedAdminSearch`

#### GET /api/v1/admin/users/:userId/vault
Purpose: User PII vault. Auth: Admin `farmers`  
Used in: AdminUserVaultPage  
Backend: `getUserVaultHandler` → `getUserVault`

#### GET /api/v1/admin/applications
Purpose: GS applications. Auth: Admin `applications`  
Used in: AdminGramSahakariPage  
Backend: `listApplicationsHandler` → `listAdminApplications`

#### GET /api/v1/admin/applications/:id
Purpose: Application detail. Auth: Admin `applications`  
Used in: AdminApplicationDetailPage  
Backend: `getApplicationHandler` → `getAdminApplicationById`

#### GET /api/v1/admin/farmers
Purpose: Farmer list. Auth: Admin `farmers`  
Used in: AdminFarmersPage  
Backend: `listFarmersHandler` → `listFarmers`

#### GET /api/v1/admin/farmers/:id
Purpose: Farmer detail. Auth: Admin `farmers`  
Used in: AdminFarmerDetailPage  
Backend: `getFarmerHandler` → `getFarmerById`

#### GET /api/v1/admin/payments/center
Purpose: Unified payment center. Auth: Admin `payments`  
Used in: AdminPaymentsPage  
Backend: `paymentCenterHandler` → `listPaymentCenter`

#### GET /api/v1/admin/subscriptions
Purpose: Subscription list. Auth: Admin `subscriptions`  
Used in: AdminSubscriptionsPage  
Backend: `listSubscriptionsHandler` → `listAdminSubscriptions`

#### POST /api/v1/admin/subscriptions/:id/sync
Purpose: Sync from Razorpay. Auth: Admin `subscriptions`  
Used in: AdminSubscriptionsPage · UserVault  
Backend: `syncSubscriptionHandler` → `adminSyncSubscription`

#### POST /api/v1/admin/users/:userId/subscriptions/cancel
Purpose: Admin cancel. Auth: Admin `subscriptions`  
Used in: AdminUserVaultPage  
Backend: `cancelSubscriptionAdminHandler` → `adminCancelSubscription`

#### POST /api/v1/admin/users/:userId/subscriptions/refund
Purpose: Admin refund. Auth: Admin `subscriptions`  
Used in: AdminUserVaultPage  
Backend: `refundSubscriptionAdminHandler` → `adminRefundSubscription`

#### POST /api/v1/admin/subscriptions/:id/grant-free-month
Purpose: Grant free month. Auth: Admin `subscriptions`  
Used in: AdminUserVaultPage  
Backend: `grantFreeMonthHandler` → `adminGrantFreeMonth`

#### POST /api/v1/admin/subscriptions/:id/deactivate
Purpose: Deactivate premium. Auth: Admin `subscriptions`  
Used in: AdminUserVaultPage  
Backend: `deactivatePremiumHandler` → `adminDeactivatePremium`

#### GET /api/v1/admin/reports/export/:type
Purpose: CSV export (`revenue`, `payments`, `subscriptions`, `gram-sahakari`, `users`). Auth: Admin `reports`  
Used in: AdminReportsPage · AdminPaymentsPage  
Backend: `exportReportHandler` → `exportAdminReportCsv`

#### GET /api/v1/admin/system
Purpose: System info. Auth: Admin `settings`  
Used in: AdminSettingsPage  
Backend: `getSystemInfoHandler` → `getSystemInfo`

#### GET /api/v1/admin/volunteers
Purpose: Volunteer list. Auth: Admin `volunteers`  
Used in: **UNUSED** (only unrouted RewardForm)  
Backend: `listVolunteersHandler` → `listVolunteers`

#### GET /api/v1/admin/payments
Purpose: Legacy payment list. Auth: Admin `payments`  
Used in: **UNUSED** (hook defined; Payments page uses `/center`)  
Backend: `listPaymentsHandler` → `listPayments`

#### GET /api/v1/admin/subscriptions/:id
Purpose: Subscription detail. Auth: Admin `subscriptions`  
Used in: **UNUSED** (API fn defined, never called)  
Backend: `getSubscriptionHandler` → `getAdminSubscription`

#### POST /api/v1/admin/applications/:applicationId/reconcile
Purpose: Reconcile GS payment. Auth: Admin `payments`  
Used in: **UNUSED** (API fn defined, never called)  
Backend: `reconcileGsPaymentHandler` → `reconcileApplicationForAdmin`

#### GET /api/v1/admin/notifications
Purpose: Computed ops alerts (no notifications collection). Auth: Admin `notifications`  
Used in: **UNUSED** (API fn defined; topbar links to payments)  
Backend: `notificationsHandler` → `getAdminNotifications`

#### GET /api/v1/admin/marketplace
#### GET /api/v1/admin/marketplace/:id
#### POST /api/v1/admin/marketplace/:id/archive
#### POST /api/v1/admin/marketplace/:id/restore
#### POST /api/v1/admin/marketplace/:id/delete
Purpose: Marketplace moderation. Auth: Admin `marketplace`  
Used in: **UNUSED** (`AdminMarketplacePage` not routed)  
Backend: `admin.marketplace.service`

#### POST /api/v1/admin/marketplace/:id/hide
Purpose: Hide listing. Auth: Admin `marketplace`  
Used in: **UNUSED** (no frontend caller at all)  
Backend: `hideMarketplaceHandler` → `adminHideListing`

---

## 2. Grouped by module

| Module | Endpoints | Live usage |
|---|---|---|
| Health | 1 | Infra |
| Auth | 4 | Website + Mobile |
| Profile | 5 | Mobile only |
| Location | 3 | Website + Mobile |
| Crops | 2 | Mobile only |
| Weather | 3 | Mobile only |
| Market | 3 | 1 used · 2 unused |
| Farmer Price | 6 | 3 used · 3 unused |
| Marketplace | 13 | Mobile only |
| Assistance | 12 | Mobile only |
| Assistance admin | 4 | Unused (page unrouted) |
| Gram Sahakari application | 7 | Website wizard + Mobile representative |
| Gram Sahakari payment | 6 | 3 used · 3 unused |
| Gram Sahakari legacy admin | 2 | Unused |
| Subscription | 11 | Mobile + webhook; resume/refund unused |
| Verification | 1 | Website |
| Admin portal | 31 | 20 used · 11 unused |
| **Notifications (farmer/device)** | **0** | No module |
| **Rewards** | **0 backend** | Website client exists |

---

## 3. API usage map

### Split of responsibility (by design)

| Surface | Owns |
|---|---|
| Mobile | Auth, farmer profile, location, crops, weather, market intelligence, marketplace, assistance, farmer-price vote, subscription, GS representative |
| Website public | Auth, GS application + payment, location, volunteer verify |
| Website admin (routed) | Dashboard, farmers, vault, GS applications, subscriptions, payment center, analytics, reports, settings, search |
| Website admin (built, not routed) | Rewards, marketplace moderation, assistance moderation |

### UNUSED APIs (27)

| Endpoint | Why |
|---|---|
| GET `/market/prices` | Mobile uses `/intelligence` |
| GET `/market/favourites` | Same |
| POST `/farmer-price/polls` | Scheduler writes via service |
| GET `/farmer-price/polls` | QA only |
| GET `/farmer-price/history/:crop` | No UI |
| GET `/gram-sahakari/admin/applications` | Duplicate of `/admin/applications` |
| GET `/gram-sahakari/admin/application/:id` | Duplicate of `/admin/applications/:id` |
| POST `.../payment/failure` | Website never reports failure |
| GET `.../payment/details` | Website reads `application/me` |
| GET `.../payment/reconcile/:id` | Duplicate of admin POST |
| POST `/subscription/resume` | No mobile UI |
| POST `/subscription/refund` | 501 stub; admin has its own refund |
| GET `/admin/volunteers` | Only unrouted RewardForm |
| GET `/admin/payments` | Superseded by `/payments/center` |
| GET `/admin/subscriptions/:id` | Client defined, never called |
| POST `/admin/applications/:id/reconcile` | Client defined, never called |
| GET `/admin/notifications` | Client defined, never called |
| 4× `/admin/assistance*` | Page not routed |
| 5× `/admin/marketplace*` (list/get/archive/restore/delete) | Page not routed |
| POST `/admin/marketplace/:id/hide` | No frontend caller |

### MISSING APIs (frontend expects, backend absent)

| Expected path | Evidence |
|---|---|
| GET/POST `/api/v1/admin/rewards` | `reward.api.ts`, AdminRewards pages |
| GET `/api/v1/admin/rewards/summary` | same |
| GET `/api/v1/admin/rewards/:id` | same |
| GET `/api/v1/admin/rewards/by-representative/:applicationId` | hook exists |
| PATCH `/api/v1/admin/rewards/:id` | same |
| POST `/api/v1/admin/rewards/:id/mark-paid` | same |
| POST `/api/v1/admin/rewards/:id/cancel` | same |
| GET `/api/v1/admin/rewards/export` | same |
| Home summary API | `Mobile App/src/features/home/home.service.ts`: *“swap to the api client when the endpoint exists”* (mock; Home currently composes other APIs) |

**10 missing paths.** No rewards Mongoose model.

### Potentially duplicated (7)

1. `/admin/applications` vs `/gram-sahakari/admin/applications`
2. `/admin/applications/:id` vs `/gram-sahakari/admin/application/:id`
3. POST `/admin/applications/:id/reconcile` vs GET `.../payment/reconcile/:id`
4. POST `/subscription/webhook` vs GS payment webhook forwarding `subscription.*`
5. GET `/admin/payments` vs GET `/admin/payments/center`
6. GET `/market/prices` vs GET `/market/intelligence`
7. POST `/subscription/refund` (501) vs POST `/admin/users/:userId/subscriptions/refund`

---

## 4. Collection / database inventory

Mongoose lives only in `Backend/backend`. **16 models → 16 collections.**

Location master, crop master, OTP, weather/market caches are **not** Mongo collections.

---

### auth_users
Model: `AuthUser`  
Purpose: Mobile identity, role (`FARMER` / `GRAM_SAHAKARI` / `TEAM` / `ADMIN`), profile-complete + verified flags  
Owner: Auth  
Written by: Auth service; profile (`isProfileCompleted`); GS finalize (role → GRAM_SAHAKARI)  
Read by: Auth middleware, most farmer/admin modules  
Relationship: Root. No outgoing refs.

### farmer_profiles
Model: `FarmerProfile`  
Purpose: Name, LGD location, favorite crops, language, Cloudinary avatar  
Owner: Farmer  
Written by: Profile + image services  
Read by: Mobile features; admin farmers/search/ops; marketplace; farmer-price sync; GS representative  
Relationship: `userId` → AuthUser (unique)

### admins
Model: `Admin`  
Purpose: Portal accounts, RBAC permissions, optional AuthUser link  
Owner: Portal admin  
Written by: `admin.repository` / login sync  
Read by: Admin middleware + repository  
Relationship: `userId` → AuthUser. Deactivate via `isActive`.

### admin_audit_logs
Model: `AdminAuditLog`  
Purpose: Append-only admin action trail  
Owner: Admin ops  
Written by: `writeAdminAudit()` from marketplace/subscription/ops  
Read by: **NONE** (no list API)  
Relationship: `adminId` → Admin; `actorUserId` / `affectedUserId` → AuthUser

### counters
Model: `Counter`  
Purpose: Atomic sequences (`_id` string key)  
Owner: GS application numbers  
Written by: `getNextSequence()` via application-number service  
Read by: Counter service  
Relationship: None. Known key: `gram_sahakari_application`

### razorpay_events
Model: `RazorpayEvent`  
Purpose: Idempotent webhook/verify ledger  
Owner: Payments  
Written by: `event.repository`  
Read by: Event repo; admin ops (failed events)  
Relationship: `applicationId` → GramSahakariApplication (GS events only)

### user_subscriptions
Model: `UserSubscription`  
Purpose: Mobile monthly plan + embedded `billingPayments[]` / `events[]`  
Owner: Farmer + Razorpay  
Written by: Subscription services, webhook, admin subscription service  
Read by: Mobile subscription; `/auth/me`; admin list/vault/ops  
Relationship: `userId` → AuthUser

### gram_sahakari_applications
Model: `GramSahakariApplication`  
Purpose: GS wizard + KYC docs + **embedded payment state** (no separate payments collection)  
Owner: Applicant  
Written by: Application + payment repositories/finalize/webhook/reconcile  
Read by: Website application; admin GS; verification; representative discovery  
Relationship: `userId` → AuthUser

### help_requests
Model: `HelpRequest`  
Purpose: Community help posts + moderation  
Owner: Farmer author  
Written by: Assistance service/repo  
Read by: Mobile assistance; admin search/ops; (unrouted) admin assistance  
Relationship: `author.userId` → AuthUser; `reviewedBy` → Admin  
Soft delete: `isDeleted` + `deletedAt`. Also `status: ARCHIVED`.

### help_request_supports
Model: `HelpRequestSupport`  
Purpose: One support per user per request  
Written/read by: Assistance repository  
Relationship: `requestId` → HelpRequest; `userId` → AuthUser

### help_request_reports
Model: `HelpRequestReport`  
Purpose: One report per user per request  
Written by: Assistance repository  
Read by: Assistance repo; admin ops counts  
Relationship: `requestId` → HelpRequest; `userId` → AuthUser

### marketplace
Model: `MarketplaceListing`  
Purpose: Produce / product / labour listings  
Owner: Seller AuthUser  
Written by: Marketplace service; admin marketplace service  
Read by: Mobile marketplace; admin search/ops  
Relationship: `sellerId` → AuthUser  
Archive: `status: ARCHIVED`. `expiresAt` is query-filtered, **not a TTL index**.

### marketplace_saved
Model: `MarketplaceSaved`  
Purpose: Saved listings  
Written/read by: Marketplace service; admin search  
Relationship: `userId` → AuthUser; `listingId` → MarketplaceListing

### farmer_price_polls
Model: `FarmerPricePoll`  
Purpose: District+crop community price polls  
Written by: Farmer-price service + sync scheduler  
Read by: Farmer-price service (mobile my/detail/vote)  
Relationship: None outbound

### farmer_price_votes
Model: `FarmerPriceVote`  
Purpose: One vote per user per poll  
Written/read by: Farmer-price service  
Relationship: `pollId` → FarmerPricePoll; `userId` → AuthUser

### farmer_price_open_slots
Model: `FarmerPriceOpenSlot`  
Purpose: Concurrency lock — one open poll slot per district+crop  
Written/read by: Slot helpers used by farmer-price service/sync  
Relationship: `pollId` → FarmerPricePoll

---

## 5. Collection usage

| Collection | Class | Note |
|---|---|---|
| `auth_users` | USED | Core identity |
| `farmer_profiles` | USED | Mobile + admin |
| `admins` | USED | Portal gate |
| `admin_audit_logs` | PARTIALLY USED | Written, never queried |
| `counters` | USED | GS application numbers |
| `razorpay_events` | USED | Idempotency + failed-event ops |
| `user_subscriptions` | USED | Mobile + admin |
| `gram_sahakari_applications` | USED | Website + admin + verify |
| `help_requests` | USED | Mobile; admin UI unrouted |
| `help_request_supports` | USED | |
| `help_request_reports` | USED | |
| `marketplace` | USED | Mobile; admin UI unrouted |
| `marketplace_saved` | USED | |
| `farmer_price_polls` | USED | Scheduler + mobile vote |
| `farmer_price_votes` | USED | |
| `farmer_price_open_slots` | USED | Internal lock |

**No orphaned collection.** Missing collection implied by frontend: **rewards** (no model).

**Duplicated concepts (not duplicate collections):**
- Payment events: `razorpay_events` + embedded `paymentEvents[]` on GS application + embedded `events[]` on subscription
- Cloudinary `{url, publicId}` embedded in profile, GS docs, assistance, marketplace — not a collection
- GS payment money lives on the application document, not a payments collection
- Subscription money lives in `billingPayments[]`, not a payments collection

---

## 6. Relationships (schema refs only)

```
AuthUser
 ├── FarmerProfile.userId
 ├── Admin.userId
 ├── GramSahakariApplication.userId
 ├── UserSubscription.userId
 ├── MarketplaceListing.sellerId
 ├── MarketplaceSaved.userId
 ├── FarmerPriceVote.userId
 ├── HelpRequest.author.userId
 ├── HelpRequestSupport.userId
 └── HelpRequestReport.userId

Admin
 ├── AdminAuditLog.adminId
 └── HelpRequest.reviewedBy

GramSahakariApplication
 └── RazorpayEvent.applicationId

MarketplaceListing
 └── MarketplaceSaved.listingId

HelpRequest
 ├── HelpRequestSupport.requestId
 └── HelpRequestReport.requestId

FarmerPricePoll
 ├── FarmerPriceVote.pollId
 └── FarmerPriceOpenSlot.pollId
```

No schema ref from `RazorpayEvent` to `UserSubscription` (subscription events still stored in `razorpay_events` without that link).

---

## 7. Storage / third-party

### Cloudinary
Purpose: Images and GS KYC documents  
Used by: Profile avatar, marketplace images, assistance proof photos, GS application uploads  
Modules: `profile.image`, `marketplace.image`, `assistance.image`, `gram-sahakari/upload`  
Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Razorpay
Purpose: GS registration fee + mobile subscription  
Used by: Website GS checkout; Mobile subscription; admin refund/sync; webhooks  
Modules: `payment/*`, `subscription/*`, admin subscription  
Env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_SUBSCRIPTION_PLAN_ID`

### WeatherAPI.com
Purpose: Current / forecast / alerts  
Used by: Mobile Home  
Modules: `weather`  
Env: `WEATHER_API_KEY`  
Base: `https://api.weatherapi.com/v1` (in-memory cache)

### data.gov.in (AGMARKNET dataset)
Purpose: Mandi prices  
Used by: Mobile market intelligence  
Modules: `market`  
Env: `MARKET_API_BASE_URL` (default `https://api.data.gov.in`), `MARKET_DATASET_ID`, `MARKET_API_KEY`, `MARKET_DISTRICT_LIMIT`, `MARKET_RECENT_DAYS`

### OTP — no provider
Purpose: Login OTP  
Used by: Website + Mobile login  
Module: `otp.service` — **process-local `Map`**. Production `sendOtp` returns “OTP sent” but never sends SMS.  
Env: `OTP_EXPIRY_MINUTES`

### Other (not third-party APIs)
| Item | Role | Env |
|---|---|---|
| MongoDB | All 16 collections | `MONGODB_URI` |
| JWT | Auth | `JWT_SECRET`, `JWT_EXPIRES_IN` |
| `location-master.json` | LGD hierarchy | — |
| `crop-master.json` | Crop catalog | — |
| In-memory caches | Weather + market | — |

No Redis, FCM, Firebase, S3, MSG91/Twilio, or device-token store in the repo.

---

## 8. Important gaps (repo-supported only)

| Gap | Evidence |
|---|---|
| Frontend calls no matching API | 9 `/admin/rewards*` paths; Home `getHomeSummary` mock |
| API exists, frontend never uses | 27 unused endpoints listed above |
| Collection unused | None |
| Collection written, never read | `admin_audit_logs` |
| Data duplicated | Payment events in ledger + embedded arrays; two payment list APIs; two GS admin routers; two subscription webhooks |
| Business entity with no persistent record | Rewards (UI+client only). Farmer push/device tokens (no client either). GS/subscription money has no standalone payments collection (embedded by design) |
| Missing relationship | `RazorpayEvent` has no `userId` / subscription ref |
| Missing CRUD | No AuthUser delete/archive API (middleware already handles missing user). No farmer account lifecycle. User refund route is 501 |
| Missing audit trail read | Audit written, no viewer |
| Missing financial record | GS fee + subscription charges are embedded, not a unified ledger collection. User refund stubbed |
| Missing notification/device record | Admin notifications are computed queries. No `device_tokens` / push module. Mobile has no FCM |
| Missing deletion/archive | AuthUser/FarmerProfile have no archive. Marketplace and HelpRequest do |
| Missing indexes | No TTL anywhere. Marketplace `village`/`taluka` indexes exist in a migration script but are not declared on the schema. OTP store is not durable across instances |
| Admin UI vs routes | Assistance + marketplace + rewards pages exist; **not in `App.tsx`** |
| Production OTP | No SMS gateway; in-memory store breaks with multiple server instances |

---

## 9. Final architecture map

### BACKEND MODULES
Auth · Profile · Location · Crops · Weather · Market · Farmer Price · Marketplace · Assistance · Gram Sahakari · Payment · Subscription · Verification · Admin · Counter · Health

### DATABASE COLLECTIONS
`auth_users` · `farmer_profiles` · `admins` · `admin_audit_logs` · `counters` · `razorpay_events` · `user_subscriptions` · `gram_sahakari_applications` · `help_requests` · `help_request_supports` · `help_request_reports` · `marketplace` · `marketplace_saved` · `farmer_price_polls` · `farmer_price_votes` · `farmer_price_open_slots`

Non-Mongo: `location-master.json` · `crop-master.json` · in-memory OTP · in-memory weather/market caches

### FRONTEND → BACKEND

```
Mobile  → auth, profile, location, crops, weather, market/intelligence,
          marketplace*, assistance*, farmer-price (read/vote),
          subscription*, gram-sahakari/representative

Website → auth, location, gram-sahakari/application*,
          gram-sahakari/payment (create+verify), verify/:id

Admin   → /api/v1/admin/* (dashboard, farmers, vault, applications,
          subscriptions, payments/center, analytics, reports, settings, search)

Not wired: admin assistance, admin marketplace, admin rewards, admin notifications
```

### THIRD-PARTY SERVICES
Cloudinary · Razorpay · WeatherAPI.com · data.gov.in / AGMARKNET

### TOP 10 BACKEND GAPS

1. **Rewards** — full website API client + pages; **no backend routes or collection**
2. **OTP** — no SMS provider; in-memory Map (multi-instance / production gap)
3. **Admin assistance + marketplace** — backend ready; pages **not routed**
4. **Duplicate GS admin / reconcile / webhook surfaces** — two routers, two reconcile paths, two webhooks
5. **`admin_audit_logs` write-only** — no read API
6. **User subscription refund is 501** while admin refund is implemented
7. **No AuthUser delete/archive** despite middleware expecting deleted users
8. **GS payment failure/details unused**; money only on application document
9. **Farmer-price create/list/history HTTP unused** (scheduler owns writes)
10. **Admin notifications unused**; no farmer device/push record; Home summary still mocked
