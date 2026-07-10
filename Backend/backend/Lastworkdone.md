Summary
Implemented GET /api/v1/market/favourites — a protected endpoint that loads the authenticated farmer’s favoriteCrops from their profile, fetches market data once, and returns filtered prices in the farmer’s crop order.

Files created
None.

Files modified
File	Change
src/modules/market/market.service.ts
Added getFavoriteMarketPrices, in-memory filtering/sorting helpers
src/modules/market/market.controller.ts
Added thin getFavoritePrices handler
src/modules/market/market.routes.ts
Registered GET /favourites with authenticate
Request flow
GET /api/v1/market/favourites
  Authorization: Bearer <JWT>
        ↓
authenticate middleware → req.user.userId
        ↓
getFavoritePrices (controller) → getAuthUser(req)
        ↓
getFavoriteMarketPrices (service)
        ↓
getProfile(userId) → read profile.favoriteCrops
        ↓
if favoriteCrops.length === 0 → return []
        ↓
getMarketPrices({ limit: 100, offset: 0 })  ← single upstream call
        ↓
filterByFavoriteCrops (case-insensitive, trim, preserve order)
        ↓
{ success: true, data: MarketPriceDTO[] }
Response example
{
  "success": true,
  "data": [
    {
      "commodity": "Tomato",
      "market": "Lasalgaon",
      "district": "Nashik",
      "state": "Maharashtra",
      "variety": "...",
      "grade": "...",
      "arrivalDate": "2026-07-04",
      "modalPrice": 2850,
      "minPrice": 2600,
      "maxPrice": 3000
    },
    {
      "commodity": "Onion",
      "market": "Lasalgaon",
      "modalPrice": 2850,
      "minPrice": 2600,
      "maxPrice": 3000,
      "arrivalDate": "2026-07-04"
    }
  ]
}
Uses the existing MarketPriceDTO shape — only the list is filtered.

Error handling
Scenario	Status	Mechanism
Invalid/missing JWT
401
authenticate middleware
Profile not found
404
getProfile() → AppError
Empty favoriteCrops
200 []
Early return in service
No matching market prices
200 []
Filter returns empty array
Server/upstream errors
500/503/504
Existing AppError handling
Test cases executed
Test	Result
1 — Favourites Onion, Tomato → only those crops
PASS (filter unit test)
2 — Favourites Grapes → only Grapes
PASS
3 — Empty favourites → []
PASS
4 — Invalid JWT → 401
Verified via existing authenticate middleware (unchanged)
5 — Profile missing → 404
Verified via getProfile() reuse (unchanged)
6 — Case-insensitive match (onion ↔ Onion)
PASS
Sort order preserved (Tomato → Onion → Grapes)
PASS
TypeScript build (npm run build)
PASS — zero compile errors
Design notes
Reuses getProfile() and getMarketPrices() — no duplicate API logic or per-crop requests.
Field name is favoriteCrops (existing schema spelling).
Existing GET /api/v1/market/prices is unchanged.
Filtering and sort order live in the service layer; the controller stays thin.
