/**
 * Generates the Agmarknet Crop Master JSON from the official commodity list.
 *
 * Source: Backend/backend/data/allCropNames.txt
 * Output: Backend/backend/src/data/crop-master.json
 *
 * Marathi names are sourced ONLY from verified curated Maharashtra crop labels
 * (historically Mobile App MAHARASHTRA_CROPS) — never invented. Single JSON file
 * (no separate translations file).
 *
 * Usage:
 *   npx ts-node scripts/generate-crop-master.ts
 *   npm run generate:crop-master
 */
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SOURCE_RELATIVE_PATH = path.join("data", "allCropNames.txt");
const OUTPUT_RELATIVE_PATH = path.join("src", "data", "crop-master.json");

// ---------------------------------------------------------------------------
// Types (mirror crop-master.json)
// ---------------------------------------------------------------------------

interface CropMasterEntry {
  cropId: number;
  name: string;
  nameMr: string;
  normalized: string;
  search: string[];
}

interface DedupWarning {
  kept: string;
  removed: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Verified Marathi + romanized aliases (seeded from the former mobile curated
// list — do NOT invent translations).
// ---------------------------------------------------------------------------

/** Agmarknet commodity name → { nameMr, extraSearch aliases (romanized etc.) } */
const VERIFIED_CROP_TRANSLATIONS: Record<
  string,
  { nameMr: string; search?: string[] }
> = {
  Cotton: { nameMr: "कापूस", search: ["kapus"] },
  Soyabean: { nameMr: "सोयाबीन", search: ["soybean"] },
  Onion: { nameMr: "कांदा", search: ["kanda"] },
  Groundnut: { nameMr: "भुईमूग" },
  "Red gram/Arhar/Tur(whole)": { nameMr: "तूर", search: ["tur", "arhar"] },
  Wheat: { nameMr: "गहू" },
  "Jowar(Sorghum)": { nameMr: "ज्वारी", search: ["jowar"] },
  "Bajra(Pearl Millet/Cumbu)": { nameMr: "बाजरी", search: ["bajri", "bajra"] },
  Maize: { nameMr: "मका" },
  "Paddy(Dhan)(Common)": { nameMr: "भात / धान", search: ["paddy", "dhan"] },
  Rice: { nameMr: "तांदूळ", search: ["bhaat"] },
  Sugarcane: { nameMr: "ऊस" },
  "Bengal Gram(Gram)(Whole)": { nameMr: "हरभरा", search: ["gram", "chana"] },
  "Green Gram(Moong)(Whole)": { nameMr: "मूग", search: ["moong"] },
  "Black Gram (Urd Beans)(Whole)": { nameMr: "उडीद", search: ["urad", "urd"] },
  Tomato: { nameMr: "टोमॅटो" },
  Brinjal: { nameMr: "वांगी", search: ["baingan"] },
  "Bhindi(Ladies Finger)": { nameMr: "भेंडी", search: ["bhindi", "okra"] },
  Potato: { nameMr: "बटाटा" },
  Garlic: { nameMr: "लसूण" },
  "Green Chilli": { nameMr: "हिरवी मिरची" },
  "Dry Chillies": { nameMr: "सुकी मिरची", search: ["mirchi"] },
  Cabbage: { nameMr: "कोबी" },
  Cauliflower: { nameMr: "फुलकोबी" },
  "Cucumbar(Kheera)": { nameMr: "काकडी", search: ["cucumber", "kheera"] },
  "Bottle gourd": { nameMr: "दुधी भोपळा", search: ["dudhi"] },
  "Bitter gourd": { nameMr: "कारले", search: ["karela"] },
  Pumpkin: { nameMr: "भोपळा" },
  "Cluster beans": { nameMr: "गवार", search: ["gavar"] },
  Spinach: { nameMr: "पालक" },
  "Methi(Leaves)": { nameMr: "मेथी", search: ["methi"] },
  "Coriander(Leaves)": { nameMr: "कोथिंबीर", search: ["coriander", "dhania"] },
  Grapes: { nameMr: "द्राक्षे", search: ["draksha"] },
  Pomegranate: { nameMr: "डाळिंब", search: ["dalimb"] },
  Mango: { nameMr: "आंबा", search: ["aam"] },
  Banana: { nameMr: "केळी", search: ["kela"] },
  Orange: { nameMr: "संत्रे", search: ["santra"] },
  "Mousambi(Sweet Lime)": { nameMr: "मोसंबी", search: ["mosambi"] },
  Guava: { nameMr: "पेरू" },
  Papaya: { nameMr: "पपई" },
  "Chikoos(Sapota)": { nameMr: "चिकू", search: ["chikoo", "sapota"] },
  "Custard Apple(Sharifa)": { nameMr: "सीताफळ", search: ["sitaphal"] },
  "Water Melon": { nameMr: "टरबूज", search: ["watermelon"] },
  "Karbuja(Musk Melon)": { nameMr: "खरबूज", search: ["kharbooja"] },
  Turmeric: { nameMr: "हळद", search: ["haldi"] },
  "Ginger(Green)": { nameMr: "आले", search: ["adrak", "ginger"] },
  "Sesamum(Sesame,Gingelly,Til)": { nameMr: "तीळ", search: ["til", "sesame"] },
  Sunflower: { nameMr: "सूर्यफूल" },
  Safflower: { nameMr: "करडई" },
  Mustard: { nameMr: "मोहरी" },
  "Castor Seed": { nameMr: "एरंडी", search: ["castor", "erandi"] },
  "Niger Seed(Ramtil)": { nameMr: "खुरासणी", search: ["niger"] },
  Linseed: { nameMr: "अळशी", search: ["alsi"] },
  Coconut: { nameMr: "नारळ", search: ["nariyal"] },
  Cashewnuts: { nameMr: "काजू", search: ["cashew", "kaju"] },
  "Ragi(Finger Millet)": { nameMr: "नाचणी", search: ["ragi"] },
  "Sweet Potato": { nameMr: "रताळे", search: ["ratalu"] },
  Drumstick: { nameMr: "शेवगा", search: ["shevga"] },
  Lemon: { nameMr: "लिंबू", search: ["limbu"] },
  "Jack Fruit": { nameMr: "फणस", search: ["jackfruit", "phanas"] },
  "Cowpea(Lobia/Karamani)": { nameMr: "चवळी", search: ["lobia", "chavli"] },
  Mataki: { nameMr: "मटकी", search: ["matki"] },
  "Kulthi(Horse Gram)": { nameMr: "कुळीथ", search: ["kulith"] },
  "Lentil(Masur)(Whole)": { nameMr: "मसूर", search: ["masur", "masoor"] },
};

/** Legacy profile labels → canonical Agmarknet name (backwards compatibility). */
const LEGACY_CROP_ALIASES: Record<string, string> = {
  "Kanda (Onion)": "Onion",
  Soyabean: "Soyabean",
  Soybean: "Soyabean",
  "Kapus (Cotton)": "Cotton",
  "Tur (Pigeon Pea)": "Red gram/Arhar/Tur(whole)",
  Bajri: "Bajra(Pearl Millet/Cumbu)",
  Jowar: "Jowar(Sorghum)",
  Wheat: "Wheat",
  "Rice (Bhaat)": "Rice",
  Sugarcane: "Sugarcane",
  "Gram (Harbhara)": "Bengal Gram(Gram)(Whole)",
  Groundnut: "Groundnut",
  Grapes: "Grapes",
  Turmeric: "Turmeric",
  "Soybean Oilseed": "Soyabean",
  Maize: "Maize",
  Cotton: "Cotton",
  Onion: "Onion",
  Tomato: "Tomato",
};

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/** Collapse whitespace only — never alter Agmarknet parenthesis spacing. */
const collapseWhitespace = (name: string): string =>
  name.trim().replace(/\s+/g, " ");

/** Dedup key only — normalizes space-before-`(` for grouping formatting duplicates. */
const dedupKey = (name: string): string =>
  collapseWhitespace(name).replace(/(\S)\(/g, "$1 (").toLowerCase();

/** Prefer Title Case over all-lowercase; prefer spaced parens when duplicates exist. */
const scoreCanonical = (name: string): number => {
  let score = 0;
  if (/ \([^)]/.test(name)) score += 10;
  if (/^[A-Z]/.test(name)) score += 5;
  if (/^[a-z]/.test(name)) score -= 5;
  if (name === name.toLowerCase() && name.length < 8) score -= 3;
  return score;
};

const pickBestCase = (candidates: string[]): string =>
  [...candidates].sort((a, b) => {
    const scoreDiff = scoreCanonical(b) - scoreCanonical(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.localeCompare(b, "en", { sensitivity: "base" });
  })[0]!;

/**
 * When duplicates exist, prefer spaced-before-`(` and better casing.
 * When only one variant exists, preserve exact Agmarknet spelling (no injected spaces).
 */
const pickCanonical = (rawVariants: string[]): string => {
  const trimmed = rawVariants.map(collapseWhitespace);
  const unique = [...new Set(trimmed)];

  if (unique.length === 1) {
    return unique[0]!;
  }

  const normalizedForms = new Set(unique.map((n) => collapseWhitespace(n).replace(/(\S)\(/g, "$1 (")));
  if (normalizedForms.size === 1) {
    const withSpacedParen = unique.filter((n) => / \([^)]/.test(n));
    const pool = withSpacedParen.length > 0 ? withSpacedParen : unique;
    return pickBestCase(pool);
  }

  return trimmed[0]!;
};

const uniqueStrings = (items: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

const buildSearchTerms = (name: string, nameMr: string, extras: string[]): string[] => {
  const terms: string[] = [name, name.toLowerCase(), name.toUpperCase(), nameMr, ...extras];

  // Add case variants of the name (Title, lower, UPPER already partially covered)
  if (name !== name.toLowerCase()) terms.push(name.toLowerCase());
  if (name !== name.toUpperCase()) terms.push(name.toUpperCase());

  // Devanagari fragments embedded in Agmarknet names (search only, not nameMr)
  const devanagariMatches = name.match(/[\u0900-\u097F]+/g);
  if (devanagariMatches) {
    for (const fragment of devanagariMatches) {
      terms.push(fragment);
    }
  }

  return uniqueStrings(terms.filter((t) => t.length > 0));
};

// ---------------------------------------------------------------------------
// Dedup + generate
// ---------------------------------------------------------------------------

const deduplicateCrops = (
  rawNames: string[]
): { canonicalNames: string[]; warnings: DedupWarning[] } => {
  const groups = new Map<string, string[]>();
  const warnings: DedupWarning[] = [];

  for (const raw of rawNames) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = dedupKey(trimmed);
    const group = groups.get(key) ?? [];
    group.push(trimmed);
    groups.set(key, group);
  }

  const canonicalNames: string[] = [];

  for (const [, group] of groups) {
    const canonical = pickCanonical(group);
    canonicalNames.push(canonical);

    for (const variant of group.map(collapseWhitespace)) {
      if (variant !== canonical) {
        warnings.push({
          kept: canonical,
          removed: variant,
          reason: "formatting or case duplicate",
        });
      }
    }
  }

  // Stable sort alphabetically by canonical name
  canonicalNames.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

  return { canonicalNames, warnings };
};

const findTranslation = (
  canonicalName: string
): { nameMr: string; search?: string[] } | undefined => {
  const direct = VERIFIED_CROP_TRANSLATIONS[canonicalName];
  if (direct) return direct;

  const key = dedupKey(canonicalName);
  for (const [mapKey, value] of Object.entries(VERIFIED_CROP_TRANSLATIONS)) {
    if (dedupKey(mapKey) === key) return value;
  }
  return undefined;
};

const resolveLegacyTarget = (
  target: string,
  canonicalNames: string[]
): string | undefined => {
  if (canonicalNames.includes(target)) return target;
  const key = dedupKey(target);
  return canonicalNames.find((name) => dedupKey(name) === key);
};

const buildCropMaster = (canonicalNames: string[]): CropMasterEntry[] => {
  const nameToCanonical = new Map<string, string>();
  for (const name of canonicalNames) {
    nameToCanonical.set(name, name);
  }

  // Register legacy aliases (only when target exists in master)
  for (const [alias, target] of Object.entries(LEGACY_CROP_ALIASES)) {
    const resolved = resolveLegacyTarget(target, canonicalNames);
    if (resolved) {
      nameToCanonical.set(alias, resolved);
    }
  }

  return canonicalNames.map((name, index) => {
    const verified = findTranslation(name);
    const nameMr = verified?.nameMr ?? "";
    const extras = verified?.search ?? [];

    // Legacy aliases that point to this crop become search terms
    const legacyAliases = Object.entries(LEGACY_CROP_ALIASES)
      .filter(([, target]) => resolveLegacyTarget(target, canonicalNames) === name)
      .map(([alias]) => alias);

    const search = buildSearchTerms(name, nameMr, [...extras, ...legacyAliases]);

    return {
      cropId: index + 1,
      name,
      nameMr,
      normalized: dedupKey(name),
      search,
    };
  });
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = (): void => {
  const startedAt = Date.now();
  const projectRoot = path.resolve(__dirname, "..");
  const sourcePath = path.join(projectRoot, SOURCE_RELATIVE_PATH);
  const outputPath = path.join(projectRoot, OUTPUT_RELATIVE_PATH);

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(sourcePath, "utf8");
  const rawLines = rawContent.split(/\r?\n/);
  const rawNames = rawLines.map((line) => line.trim()).filter(Boolean);

  const originalCount = rawNames.length;
  const { canonicalNames, warnings } = deduplicateCrops(rawNames);
  const duplicatesRemoved = originalCount - canonicalNames.length;

  const crops = buildCropMaster(canonicalNames);
  const translatedCount = crops.filter((c) => c.nameMr.length > 0).length;
  const untranslatedCount = crops.length - translatedCount;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const json = `${JSON.stringify(crops, null, 2)}\n`;
  fs.writeFileSync(outputPath, json, "utf8");

  const outputFileSizeBytes = fs.statSync(outputPath).size;
  const generationTimeMs = Date.now() - startedAt;

  if (warnings.length > 0) {
    console.log("\n========== DEDUP WARNINGS ==========");
    for (const w of warnings) {
      console.warn(`⚠ Kept "${w.kept}", removed "${w.removed}" (${w.reason})`);
    }
  }

  console.log("\n========== STATISTICS ==========");
  console.log(`Original crop count   : ${originalCount}`);
  console.log(`Duplicates removed    : ${duplicatesRemoved}`);
  console.log(`Final crop count      : ${crops.length}`);
  console.log(`With Marathi (nameMr) : ${translatedCount}`);
  console.log(`Untranslated          : ${untranslatedCount}`);
  console.log(`Dedup warnings        : ${warnings.length}`);
  console.log(`Generation time       : ${generationTimeMs} ms`);
  console.log(`Output file size      : ${(outputFileSizeBytes / 1024).toFixed(1)} KB`);
  console.log(`Output written        : ${outputPath}`);
};

main();
