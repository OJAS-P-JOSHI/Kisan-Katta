/**
 * Generates the Maharashtra Location Master JSON from the official LGD Excel.
 *
 * Source: Backend/backend/data/Villageof_Specific_State_*.xlsx
 * Output: Backend/backend/src/data/location-master.json
 *
 * Mapping:
 *   Excel "Sub-District" → project "Taluka"
 *
 * Usage:
 *   npx ts-node scripts/generate-location-master.ts
 *   npm run generate:location-master
 */
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Column indices in the LGD sheet (0-based, after the title row)
// ---------------------------------------------------------------------------

const COL = {
  DISTRICT_CODE: 1,
  DISTRICT_NAME: 2,
  /** Excel column "Sub-District Code" — exposed as Taluka everywhere. */
  TALUKA_CODE: 3,
  /** Excel column "Sub-District Name (In English)" — exposed as Taluka. */
  TALUKA_NAME: 4,
  VILLAGE_CODE: 5,
  VILLAGE_NAME: 7,
  VILLAGE_NAME_MR: 8,
  VILLAGE_CATEGORY: 9,
  VILLAGE_STATUS: 10,
} as const;

const TITLE_ROW_INDEX = 0;
const HEADER_ROW_INDEX = 1;
const DATA_START_ROW_INDEX = 2;

const EXCEL_RELATIVE_PATH = path.join(
  "data",
  "Villageof_Specific_State_2026-07-27_23-37-41.xlsx"
);
const OUTPUT_RELATIVE_PATH = path.join("src", "data", "location-master.json");

// ---------------------------------------------------------------------------
// Types (mirror the JSON shape written to disk)
// ---------------------------------------------------------------------------

interface VillageMaster {
  villageCode: number;
  name: string;
  nameMr: string;
  category: string;
  status: string;
}

interface TalukaMaster {
  talukaCode: number;
  talukaName: string;
  villages: VillageMaster[];
}

interface DistrictMaster {
  districtCode: number;
  districtName: string;
  talukas: TalukaMaster[];
}

interface GenerationStats {
  totalDistricts: number;
  totalTalukas: number;
  totalVillages: number;
  largestDistrict: { name: string; villageCount: number };
  largestTaluka: { name: string; districtName: string; villageCount: number };
  generationTimeMs: number;
  outputFileSizeBytes: number;
  warningCount: number;
  rowsParsed: number;
  rowsSkipped: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toString = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

const compareLocale = (a: string, b: string): number =>
  a.localeCompare(b, "en", { sensitivity: "base" });

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// ---------------------------------------------------------------------------
// Build + validate
// ---------------------------------------------------------------------------

const buildLocationMaster = (
  rows: unknown[][]
): { districts: DistrictMaster[]; warnings: string[]; rowsSkipped: number } => {
  const warnings: string[] = [];
  let rowsSkipped = 0;

  // Intermediate maps keyed by official LGD codes.
  const districtMap = new Map<
    number,
    {
      districtCode: number;
      districtName: string;
      talukas: Map<
        number,
        {
          talukaCode: number;
          talukaName: string;
          villages: Map<number, VillageMaster>;
        }
      >;
    }
  >();

  // Global uniqueness trackers (LGD codes are globally unique).
  const seenDistrictCodes = new Map<number, string>();
  const seenTalukaCodes = new Map<number, { name: string; districtCode: number }>();
  const seenVillageCodes = new Map<
    number,
    { name: string; talukaCode: number; districtCode: number }
  >();

  for (let i = DATA_START_ROW_INDEX; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) {
      rowsSkipped += 1;
      continue;
    }

    const districtCode = toNumber(row[COL.DISTRICT_CODE]);
    const districtName = toString(row[COL.DISTRICT_NAME]);
    const talukaCode = toNumber(row[COL.TALUKA_CODE]);
    const talukaName = toString(row[COL.TALUKA_NAME]);
    const villageCode = toNumber(row[COL.VILLAGE_CODE]);
    const villageName = toString(row[COL.VILLAGE_NAME]);
    const villageNameMr = toString(row[COL.VILLAGE_NAME_MR]);
    const category = toString(row[COL.VILLAGE_CATEGORY]);
    const status = toString(row[COL.VILLAGE_STATUS]);

    if (
      districtCode === null ||
      !districtName ||
      talukaCode === null ||
      !talukaName ||
      villageCode === null ||
      !villageName
    ) {
      warnings.push(
        `Row ${i + 1}: skipped — missing required fields ` +
          `(district=${districtCode}/${districtName}, ` +
          `taluka=${talukaCode}/${talukaName}, ` +
          `village=${villageCode}/${villageName}).`
      );
      rowsSkipped += 1;
      continue;
    }

    // --- District uniqueness ---
    const priorDistrictName = seenDistrictCodes.get(districtCode);
    if (priorDistrictName === undefined) {
      seenDistrictCodes.set(districtCode, districtName);
    } else if (priorDistrictName !== districtName) {
      warnings.push(
        `District code ${districtCode} name conflict: ` +
          `"${priorDistrictName}" vs "${districtName}" (row ${i + 1}). ` +
          `Keeping first name.`
      );
    }

    // --- Taluka uniqueness (global LGD code) ---
    const priorTaluka = seenTalukaCodes.get(talukaCode);
    if (priorTaluka === undefined) {
      seenTalukaCodes.set(talukaCode, { name: talukaName, districtCode });
    } else {
      if (priorTaluka.districtCode !== districtCode) {
        warnings.push(
          `Taluka code ${talukaCode} ("${talukaName}") appears under ` +
            `district ${districtCode} and previously under district ` +
            `${priorTaluka.districtCode} (row ${i + 1}).`
        );
      }
      if (priorTaluka.name !== talukaName) {
        warnings.push(
          `Taluka code ${talukaCode} name conflict: ` +
            `"${priorTaluka.name}" vs "${talukaName}" (row ${i + 1}). ` +
            `Keeping first name.`
        );
      }
    }

    // --- Village uniqueness (global LGD code) ---
    const priorVillage = seenVillageCodes.get(villageCode);
    if (priorVillage !== undefined) {
      warnings.push(
        `Duplicate village code ${villageCode} ("${villageName}") at row ${i + 1}. ` +
          `Previously seen as "${priorVillage.name}" under taluka ` +
          `${priorVillage.talukaCode} / district ${priorVillage.districtCode}. Skipped.`
      );
      rowsSkipped += 1;
      continue;
    }
    seenVillageCodes.set(villageCode, {
      name: villageName,
      talukaCode,
      districtCode,
    });

    // --- Insert into hierarchy ---
    let district = districtMap.get(districtCode);
    if (!district) {
      district = {
        districtCode,
        districtName: seenDistrictCodes.get(districtCode) ?? districtName,
        talukas: new Map(),
      };
      districtMap.set(districtCode, district);
    }

    let taluka = district.talukas.get(talukaCode);
    if (!taluka) {
      // Guard: same taluka name under one district with a different code.
      for (const existing of district.talukas.values()) {
        if (existing.talukaName === talukaName && existing.talukaCode !== talukaCode) {
          warnings.push(
            `District ${districtCode} ("${district.districtName}") has two ` +
              `taluka codes for name "${talukaName}": ${existing.talukaCode} ` +
              `and ${talukaCode} (row ${i + 1}).`
          );
        }
      }

      const canonicalTalukaName =
        seenTalukaCodes.get(talukaCode)?.name ?? talukaName;
      taluka = {
        talukaCode,
        talukaName: canonicalTalukaName,
        villages: new Map(),
      };
      district.talukas.set(talukaCode, taluka);
    }

    // Duplicate village name within the same taluka (different codes).
    for (const existing of taluka.villages.values()) {
      if (existing.name === villageName) {
        warnings.push(
          `Taluka ${talukaCode} ("${taluka.talukaName}") has multiple villages ` +
            `named "${villageName}" (codes ${existing.villageCode} and ` +
            `${villageCode}, row ${i + 1}). Both kept — codes differ.`
        );
        break;
      }
    }

    taluka.villages.set(villageCode, {
      villageCode,
      name: villageName,
      nameMr: villageNameMr,
      category,
      status,
    });
  }

  // Materialize + sort.
  const districts: DistrictMaster[] = Array.from(districtMap.values())
    .map((d) => ({
      districtCode: d.districtCode,
      districtName: d.districtName,
      talukas: Array.from(d.talukas.values())
        .map((t) => ({
          talukaCode: t.talukaCode,
          talukaName: t.talukaName,
          villages: Array.from(t.villages.values()).sort((a, b) =>
            compareLocale(a.name, b.name)
          ),
        }))
        .sort((a, b) => compareLocale(a.talukaName, b.talukaName)),
    }))
    .sort((a, b) => compareLocale(a.districtName, b.districtName));

  // Final structural uniqueness checks (should already hold).
  const districtCodes = new Set<number>();
  const talukaCodes = new Set<number>();
  const villageCodes = new Set<number>();

  for (const district of districts) {
    if (districtCodes.has(district.districtCode)) {
      warnings.push(
        `VALIDATION: duplicate district code ${district.districtCode} in output.`
      );
    }
    districtCodes.add(district.districtCode);

    const talukaNamesInDistrict = new Set<string>();
    for (const taluka of district.talukas) {
      if (talukaCodes.has(taluka.talukaCode)) {
        warnings.push(
          `VALIDATION: duplicate taluka code ${taluka.talukaCode} in output.`
        );
      }
      talukaCodes.add(taluka.talukaCode);

      if (talukaNamesInDistrict.has(taluka.talukaName)) {
        warnings.push(
          `VALIDATION: duplicate taluka name "${taluka.talukaName}" under ` +
            `district ${district.districtCode}.`
        );
      }
      talukaNamesInDistrict.add(taluka.talukaName);

      for (const village of taluka.villages) {
        if (villageCodes.has(village.villageCode)) {
          warnings.push(
            `VALIDATION: duplicate village code ${village.villageCode} in output.`
          );
        }
        villageCodes.add(village.villageCode);
      }
    }
  }

  return { districts, warnings, rowsSkipped };
};

const computeStats = (
  districts: DistrictMaster[],
  generationTimeMs: number,
  outputFileSizeBytes: number,
  warningCount: number,
  rowsParsed: number,
  rowsSkipped: number
): GenerationStats => {
  let totalTalukas = 0;
  let totalVillages = 0;
  let largestDistrict = { name: "", villageCount: 0 };
  let largestTaluka = { name: "", districtName: "", villageCount: 0 };

  for (const district of districts) {
    let districtVillageCount = 0;
    totalTalukas += district.talukas.length;

    for (const taluka of district.talukas) {
      const count = taluka.villages.length;
      districtVillageCount += count;
      totalVillages += count;

      if (count > largestTaluka.villageCount) {
        largestTaluka = {
          name: taluka.talukaName,
          districtName: district.districtName,
          villageCount: count,
        };
      }
    }

    if (districtVillageCount > largestDistrict.villageCount) {
      largestDistrict = {
        name: district.districtName,
        villageCount: districtVillageCount,
      };
    }
  }

  return {
    totalDistricts: districts.length,
    totalTalukas,
    totalVillages,
    largestDistrict,
    largestTaluka,
    generationTimeMs,
    outputFileSizeBytes,
    warningCount,
    rowsParsed,
    rowsSkipped,
  };
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = (): void => {
  const startedAt = Date.now();
  const projectRoot = path.resolve(__dirname, "..");
  const excelPath = path.join(projectRoot, EXCEL_RELATIVE_PATH);
  const outputPath = path.join(projectRoot, OUTPUT_RELATIVE_PATH);

  if (!fs.existsSync(excelPath)) {
    console.error(`Excel file not found: ${excelPath}`);
    process.exit(1);
  }

  console.log(`Reading LGD Excel: ${excelPath}`);
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    console.error("Excel workbook has no sheets.");
    process.exit(1);
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.error(`Sheet "${sheetName}" is missing.`);
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  // Sanity-check the header row so column drift is caught early.
  const headerRow = rows[HEADER_ROW_INDEX];
  if (!headerRow) {
    console.error("Header row missing from Excel.");
    process.exit(1);
  }

  const expectedHeaders: Record<number, string> = {
    [COL.DISTRICT_CODE]: "District Code",
    [COL.DISTRICT_NAME]: "District Name (In English)",
    [COL.TALUKA_CODE]: "Sub-District Code",
    [COL.TALUKA_NAME]: "Sub-District Name (In English)",
    [COL.VILLAGE_CODE]: "Village Code",
    [COL.VILLAGE_NAME]: "Village Name (In English)",
    [COL.VILLAGE_NAME_MR]: "Village Name (In Local)",
    [COL.VILLAGE_CATEGORY]: "Village Category",
    [COL.VILLAGE_STATUS]: "Village Status",
  };

  for (const [index, expected] of Object.entries(expectedHeaders)) {
    const actual = String(headerRow[Number(index)] ?? "");
    if (actual !== expected) {
      console.error(
        `Header mismatch at column ${index}: expected "${expected}", got "${actual}".`
      );
      process.exit(1);
    }
  }

  // Title row is informational only.
  const title = rows[TITLE_ROW_INDEX]?.[0];
  console.log(`Sheet: ${sheetName}`);
  console.log(`Title: ${String(title ?? "")}`);
  console.log(`Raw rows (including title + header): ${rows.length}`);

  const { districts, warnings, rowsSkipped } = buildLocationMaster(rows);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const json = `${JSON.stringify(districts, null, 2)}\n`;
  fs.writeFileSync(outputPath, json, "utf8");

  const generationTimeMs = Date.now() - startedAt;
  const outputFileSizeBytes = fs.statSync(outputPath).size;
  const rowsParsed = Math.max(0, rows.length - DATA_START_ROW_INDEX);

  const stats = computeStats(
    districts,
    generationTimeMs,
    outputFileSizeBytes,
    warnings.length,
    rowsParsed,
    rowsSkipped
  );

  if (warnings.length > 0) {
    console.log("\n========== WARNINGS ==========");
    for (const warning of warnings) {
      console.warn(`⚠ ${warning}`);
    }
  } else {
    console.log("\nNo uniqueness warnings.");
  }

  console.log("\n========== STATISTICS ==========");
  console.log(`Total districts : ${stats.totalDistricts}`);
  console.log(`Total talukas   : ${stats.totalTalukas}`);
  console.log(`Total villages  : ${stats.totalVillages}`);
  console.log(
    `Largest district: ${stats.largestDistrict.name} ` +
      `(${stats.largestDistrict.villageCount} villages)`
  );
  console.log(
    `Largest taluka  : ${stats.largestTaluka.name} ` +
      `(${stats.largestTaluka.districtName}, ` +
      `${stats.largestTaluka.villageCount} villages)`
  );
  console.log(`Rows parsed     : ${stats.rowsParsed}`);
  console.log(`Rows skipped    : ${stats.rowsSkipped}`);
  console.log(`Warnings        : ${stats.warningCount}`);
  console.log(`Generation time : ${stats.generationTimeMs} ms`);
  console.log(
    `Output file size: ${formatBytes(stats.outputFileSizeBytes)} ` +
      `(${stats.outputFileSizeBytes} bytes)`
  );
  console.log(`Output written  : ${outputPath}`);
};

main();
