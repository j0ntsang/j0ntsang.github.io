import { defineConfig, devices } from "@playwright/test";

const DEV_PORT = 5174;
const PROD_PORT = 4175;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: "prod.spec.ts",
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${DEV_PORT}/` },
    },
    {
      // The GitHub Pages path: built files, no COOP/COEP headers, isolation from coi-serviceworker.
      name: "prod",
      testMatch: "prod.spec.ts",
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${PROD_PORT}/` },
    },
  ],
  webServer: [
    {
      command: `npx vite --port ${DEV_PORT} --strictPort`,
      url: `http://localhost:${DEV_PORT}/`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && npx vite preview --port ${PROD_PORT} --strictPort`,
      url: `http://localhost:${PROD_PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
