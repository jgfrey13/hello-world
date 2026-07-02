import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration. Two modes:
 * - Default: runs against a locally started production build (no database
 *   required) — covers static pages, accessibility (axe), and
 *   graceful-degradation behavior.
 * - Full stack: set E2E_BASE_URL to a deployment backed by a real Supabase
 *   project to enable the data-dependent flow specs (they skip otherwise).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Environments with a preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH
        // + PLAYWRIGHT_CHROMIUM_PATH) can point here instead of downloading.
        ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? {
              launchOptions: {
                executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
              },
            }
          : {}),
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start -- --port 3100",
        // Health-check a page that renders without a database.
        url: "http://localhost:3100/methodology",
        reuseExistingServer: true,
        timeout: 60_000,
        env: {
          NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
          NEXT_PUBLIC_SUPABASE_URL:
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:59999",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "e2e-dummy-anon",
          SUPABASE_SERVICE_ROLE_KEY:
            process.env.SUPABASE_SERVICE_ROLE_KEY ?? "e2e-dummy-service",
        },
      },
});
