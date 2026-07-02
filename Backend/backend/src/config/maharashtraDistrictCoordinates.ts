import { AppError } from "../utils/AppError";

export interface DistrictCoordinates {
  district: string; // Official display name used in API responses
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// Step 1 — Input normalization
//
// Applied to every raw user input before any lookup is attempted.
// Handles: leading/trailing whitespace, internal runs of spaces, case.
// "  PUNE  " → "pune"   "Mumbai  City" → "mumbai city"   "PuNe" → "pune"
// ---------------------------------------------------------------------------
export const normalizeDistrictName = (name: string): string =>
  name
    .trim()           // remove leading/trailing whitespace
    .replace(/\s+/g, " ") // collapse multiple interior spaces to one
    .toLowerCase();   // case-insensitive comparison

// ---------------------------------------------------------------------------
// Step 2 — Alias resolution
//
// Maps normalized alias keys to the normalized canonical DISTRICT_MAP key.
// Covers official renames, historical names, spelling variants, and
// colloquial names. Every alias key is already lowercase (post-normalization).
//
// Add new entries here whenever a new variant surfaces; no other file changes.
// ---------------------------------------------------------------------------
const ALIAS_MAP: Record<string, string> = {
  // Official government renames
  "aurangabad":            "chhatrapati sambhajinagar", // renamed 2023
  "osmanabad":             "dharashiv",                 // renamed 2023

  // Short forms of renamed districts
  "sambhajinagar":         "chhatrapati sambhajinagar",
  "chhatrapati-sambhajinagar": "chhatrapati sambhajinagar",

  // Mumbai colloquials and sub-area references
  "bombay":                "mumbai city",
  "mumbai":                "mumbai city", // unqualified "Mumbai" → City district
  "mumbai-city":           "mumbai city",
  "mumbai-suburban":       "mumbai suburban",

  // Nashik — WeatherAPI indexes this location as "Nasik"
  "nasik":                 "nashik",

  // Common spelling variants used in government records and forms
  "ahmadnagar":            "ahmednagar",
  "ahmadanagar":           "ahmednagar",
  "sholapur":              "solapur",    // older/alternate romanisation
  "buldana":               "buldhana",  // common misspelling
  "buldhana":              "buldhana",  // already canonical, harmless duplicate
  "amraoti":               "amravati",  // pre-independence name still in use
  "thana":                 "thane",     // older official spelling
  "ratnagiri district":    "ratnagiri",
};

// ---------------------------------------------------------------------------
// Step 3 — Canonical district map (coordinates)
//
// Keys are normalized (lowercase, single-spaced) canonical district names.
// These are the authoritative entries; aliases resolve to these keys.
// Coordinates are the district headquarters (HQ) lat/lon.
// WeatherAPI always receives coordinates (lat,lon), never raw text.
// ---------------------------------------------------------------------------
const DISTRICT_MAP: Record<string, DistrictCoordinates> = {
  // Western Maharashtra
  "pune":                      { district: "Pune",                      latitude: 18.5204, longitude: 73.8567 },
  "satara":                    { district: "Satara",                    latitude: 17.6805, longitude: 73.9999 },
  "sangli":                    { district: "Sangli",                    latitude: 16.8524, longitude: 74.5815 },
  "solapur":                   { district: "Solapur",                   latitude: 17.6599, longitude: 75.9064 },
  "kolhapur":                  { district: "Kolhapur",                  latitude: 16.7050, longitude: 74.2433 },
  "raigad":                    { district: "Raigad",                    latitude: 18.5000, longitude: 73.1167 },

  // Konkan
  "ratnagiri":                 { district: "Ratnagiri",                 latitude: 16.9902, longitude: 73.3120 },
  "sindhudurg":                { district: "Sindhudurg",                latitude: 16.3000, longitude: 73.5500 },
  "palghar":                   { district: "Palghar",                   latitude: 19.6967, longitude: 72.7658 },
  "thane":                     { district: "Thane",                     latitude: 19.2183, longitude: 72.9781 },
  "mumbai city":               { district: "Mumbai City",               latitude: 18.9667, longitude: 72.8333 },
  "mumbai suburban":           { district: "Mumbai Suburban",           latitude: 19.0760, longitude: 72.8777 },

  // North Maharashtra
  "nashik":                    { district: "Nashik",                    latitude: 19.9975, longitude: 73.7898 },
  "dhule":                     { district: "Dhule",                     latitude: 20.9042, longitude: 74.7749 },
  "nandurbar":                 { district: "Nandurbar",                 latitude: 21.3667, longitude: 74.2333 },
  "jalgaon":                   { district: "Jalgaon",                   latitude: 21.0077, longitude: 75.5626 },
  "ahmednagar":                { district: "Ahmednagar",                latitude: 19.0948, longitude: 74.7480 },

  // Marathwada
  "chhatrapati sambhajinagar": { district: "Chhatrapati Sambhajinagar", latitude: 19.8762, longitude: 75.3433 },
  "jalna":                     { district: "Jalna",                     latitude: 19.8350, longitude: 75.8800 },
  "beed":                      { district: "Beed",                      latitude: 18.9891, longitude: 75.7601 },
  "latur":                     { district: "Latur",                     latitude: 18.4088, longitude: 76.5604 },
  "dharashiv":                 { district: "Dharashiv",                 latitude: 18.1789, longitude: 76.0411 },
  "nanded":                    { district: "Nanded",                    latitude: 19.1383, longitude: 77.3210 },
  "hingoli":                   { district: "Hingoli",                   latitude: 19.7165, longitude: 77.1500 },
  "parbhani":                  { district: "Parbhani",                  latitude: 19.2704, longitude: 76.7764 },

  // Vidarbha
  "nagpur":                    { district: "Nagpur",                    latitude: 21.1458, longitude: 79.0882 },
  "wardha":                    { district: "Wardha",                    latitude: 20.7453, longitude: 78.6022 },
  "yavatmal":                  { district: "Yavatmal",                  latitude: 20.3888, longitude: 78.1204 },
  "amravati":                  { district: "Amravati",                  latitude: 20.9374, longitude: 77.7796 },
  "akola":                     { district: "Akola",                     latitude: 20.7002, longitude: 77.0082 },
  "buldhana":                  { district: "Buldhana",                  latitude: 20.5292, longitude: 76.1842 },
  "washim":                    { district: "Washim",                    latitude: 20.1125, longitude: 77.1329 },
  "bhandara":                  { district: "Bhandara",                  latitude: 21.1667, longitude: 79.6500 },
  "gondia":                    { district: "Gondia",                    latitude: 21.4600, longitude: 80.1900 },
  "chandrapur":                { district: "Chandrapur",                latitude: 19.9615, longitude: 79.2961 },
  "gadchiroli":                { district: "Gadchiroli",                latitude: 20.1809, longitude: 80.0007 },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ResolvedDistrict {
  /** Canonical display name (e.g. "Nashik", "Chhatrapati Sambhajinagar") */
  district: string;
  /**
   * Normalized canonical key used as the in-memory cache key.
   * Aliases share the same key as their canonical district, so "nasik" and
   * "nashik" always hit the same cache entry.
   */
  cacheKey: string;
  /** "lat,lon" string passed to WeatherAPI as the `q` parameter */
  coordQuery: string;
}

/**
 * Converts raw user input into a WeatherAPI-ready coordinate query.
 *
 * Pipeline:
 *   raw input → normalizeDistrictName() → ALIAS_MAP → DISTRICT_MAP → coordinates
 *
 * WeatherAPI never receives raw user text — only precise lat/lon coordinates.
 * Throws HTTP 400 for any input that cannot be resolved to a known district.
 */
export const resolveDistrict = (name: string): ResolvedDistrict => {
  // 1. Normalize: trim, collapse spaces, lowercase.
  const normalized = normalizeDistrictName(name);

  // 2. Resolve alias: if the normalized key is an alias, swap it for the
  //    canonical key so both "nasik" and "nashik" resolve identically.
  const canonicalKey = ALIAS_MAP[normalized] ?? normalized;

  // 3. Coordinate lookup using the canonical key.
  const entry = DISTRICT_MAP[canonicalKey];

  if (!entry) {
    throw new AppError("Unknown Maharashtra district.", 400);
  }

  return {
    district:   entry.district,
    cacheKey:   canonicalKey,   // canonical → consistent across all aliases
    coordQuery: `${entry.latitude},${entry.longitude}`,
  };
};
