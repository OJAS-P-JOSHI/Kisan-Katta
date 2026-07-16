/**
 * Lightweight verification for farmer-price calculation helpers.
 * Run: npx ts-node src/modules/farmer-price/farmer-price.stats.verify.ts
 */
import {
  calculateConfidence,
  calculateDifferenceFromGovernment,
  calculateMedianPrice,
  resolveCommunityExpectedPrice,
} from "./farmer-price.stats";

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

// Odd median
assertEqual(
  calculateMedianPrice([6800, 6900, 7000, 7050, 7100, 7200, 7300]),
  7050,
  "odd median"
);

// Even median (average of middle two, rounded)
assertEqual(
  calculateMedianPrice([6800, 6900, 7000, 7050, 7100, 7200]),
  7025,
  "even median"
);

// Spec-style odd set
assertEqual(
  calculateMedianPrice([6800, 6900, 7000, 7050, 7100, 7200].concat([7050]).sort((a, b) => a - b)),
  7050,
  "odd median with seven values centered on 7050"
);

// First / ninth / tenth / hundredth confidence + community price gate
assertEqual(calculateConfidence(1), "NOT_AVAILABLE", "first vote confidence");
assertEqual(calculateConfidence(9), "NOT_AVAILABLE", "ninth vote confidence");
assertEqual(calculateConfidence(10), "LOW", "tenth vote confidence");
assertEqual(calculateConfidence(49), "LOW", "49 vote confidence");
assertEqual(calculateConfidence(50), "MEDIUM", "50 vote confidence");
assertEqual(calculateConfidence(149), "MEDIUM", "149 vote confidence");
assertEqual(calculateConfidence(150), "HIGH", "150 vote confidence");
assertEqual(calculateConfidence(100), "MEDIUM", "hundredth vote confidence");

assertEqual(resolveCommunityExpectedPrice(9, 10, 7000), null, "ninth vote hides price");
assertEqual(resolveCommunityExpectedPrice(10, 10, 7050), 7050, "tenth vote exposes price");

// Difference calculation
const diff = calculateDifferenceFromGovernment(7100, true, 6840);
assertEqual(diff.differenceFromGovernmentPrice, 260, "difference amount");
assertEqual(diff.differencePercentage, 3.8, "difference percentage");

// Government price missing
const missing = calculateDifferenceFromGovernment(7100, false, null);
assertEqual(missing.differenceFromGovernmentPrice, null, "missing gov difference");
assertEqual(missing.differencePercentage, null, "missing gov percentage");

// Never divide by zero
const zeroGov = calculateDifferenceFromGovernment(7100, true, 0);
assertEqual(zeroGov.differenceFromGovernmentPrice, null, "zero gov difference");
assertEqual(zeroGov.differencePercentage, null, "zero gov percentage");

// eslint-disable-next-line no-console
console.log("farmer-price.stats.verify: all assertions passed");
