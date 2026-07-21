import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    hookTimeout: 120000,
    testTimeout: 60000,
    // Payment tests share a single in-memory Mongo; keep them serial.
    fileParallelism: false,
  },
});
