import { defineConfig } from "@playwright/test";

if (process.env.E2E_CORE !== "1")
  throw Error("Use pnpm test:e2e:core to provision an isolated runtime");
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: [
    "auth.spec.ts",
    "admin-place.spec.ts",
    "public-places.spec.ts",
    "import-review.spec.ts",
    "security.spec.ts",
    "viewer.spec.ts",
  ],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 90000,
  globalTimeout: 8 * 60 * 1000,
  outputDir: "test-results/core-private",
  reporter: [["./tests/support/core-reporter.ts"]],
  use: {
    baseURL: process.env.E2E_BASE_URL,
    channel: process.env.CI ? undefined : "chrome",
    headless: true,
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
    serviceWorkers: "block",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
