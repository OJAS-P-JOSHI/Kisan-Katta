import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // Sequential files: a single shared in-memory MongoDB per file, no cross-file races.
    fileParallelism: false,
  },
});
