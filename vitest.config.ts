import { defineConfig } from "vitest/config";

// Unit tests for the pure modules (fs, october model/wiki). Node environment:
// nothing here needs a DOM, and tests/ stays Playwright's.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
