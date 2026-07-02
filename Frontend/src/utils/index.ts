/** Small, dependency-free helpers shared across features. */

/** Resolves after `ms` milliseconds. Useful for simulating network latency in mocks. */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
