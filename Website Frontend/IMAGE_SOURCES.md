# Image Sources

All external images are royalty-free and licensed for commercial use.
Brand-owned local assets live in `/public`.

## Local Assets (`/public`)

| File | Usage |
|---|---|
| `logo-circle.png` | Navbar, Footer, Login, Brand cards, Loading placeholder |
| `login-hero.png` | Flat brand illustration (auth screens) |
| `hero-field.webp` | Desktop landing hero (wide cinematic; brand-owned) |
| `hero-mobile.webp` | Mobile landing hero (portrait; brand-owned) |
| `gram-sahakari.webp` | **Gram Sahakari section portrait** — see replacement specs below |
| `favicon-96x96.png`, `favicon.svg`, `favicon.ico` | Browser favicons |
| `apple-touch-icon.png` | iOS home screen |
| `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png` | PWA icons |

Code reference: `src/data/images.ts` → `brandAssets.gramSahakari`

---

## Gram Sahakari image — current status

**Problem:** Generic international Unsplash stock felt inauthentic for rural Maharashtra
farmers and Gram Sahakari volunteers.

**Current interim:** `public/gram-sahakari.webp` is a brand-owned portrait (same visual
family as `hero-mobile.webp`) showing an Indian farmer in a rural field setting.
It is **not** the final community photograph.

**How to replace (no code change):**

1. Export the final photo as WebP (preferred) or JPEG.
2. Overwrite `Website Frontend/public/gram-sahakari.webp`.
3. Keep the filename exactly `gram-sahakari.webp`.
4. Redeploy / refresh — `brandAssets.gramSahakari` already points here.

Optional: if you change the filename, update only:

```ts
// src/data/images.ts
gramSahakari: '/your-new-filename.webp',
```

---

## Ideal replacement specifications

| Spec | Requirement |
|---|---|
| **Subject** | Indian (ideally Maharashtrian) Gram Sahakari volunteer with 1–2 farmers |
| **Action** | Helping / explaining — ideally phone or app visible, natural interaction |
| **Setting** | Rural Maharashtra village or farm (fields, village lane, farmyard) |
| **Clothing** | Everyday rural wear (shirt/dhoti/saree/kurta) — avoid polished corporate look |
| **Expressions** | Warm, real, trustworthy — not posed “stock smile” |
| **Tone** | Authenticity, community, trust over glossy agritech marketing |
| **People** | Real consent/model release if photographing community members |
| **Aspect ratio** | **4:5 portrait** (matches section `aspect-[4/5]`) |
| **Resolution** | Minimum **1600 × 2000** px (display ~800×1000 @2x) |
| **Format** | **WebP** quality ~80, or JPEG quality 85 |
| **File size** | Target **&lt; 250 KB** (max ~400 KB) |
| **Focal point** | Faces in upper 50% — CSS uses `object-top` |
| **Colors** | Natural daylight; works under dark forest gradient overlay at bottom |
| **Avoid** | Western stock farms, studio backdrops, heavy filters, English billboards, drones-only shots |

### Suggested shot list (pick one)

1. Volunteer showing Kisan Katta on a phone to a farmer beside a crop field  
2. Small group under a village tree / near a farm shed, phone in hand  
3. Gram Sahakari helping an older farmer install or open the app  

### Alt text (i18n)

Keep `gram.imageAlt` accurate after replacement:

- EN: describes who is in the photo and where  
- MR: matching Marathi description  

Keys: `gram.imageAlt` / `gram.overlay` in `src/i18n/translations.ts`

---

## Unsplash (secondary accents only)

Do **not** use Unsplash for the primary Gram Sahakari portrait going forward.

| Key | URL | Photographer | Usage |
|---|---|---|---|
| `farmland` | [photo-1500382017468](https://unsplash.com/photos/photo-1500382017468) | Annie Spratt | Become page landscape accent |
| `harvest` | [photo-1625246333195](https://unsplash.com/photos/photo-1625246333195) | Tim Mossholder | Fallback agriculture |
| `village` | [photo-1530836369250](https://unsplash.com/photos/photo-1530836369250) | — | Accent landscape |
| `produce` | [photo-1464226184884](https://unsplash.com/photos/photo-1464226184884) | — | Produce accent |
