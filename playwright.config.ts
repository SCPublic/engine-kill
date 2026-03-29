import { defineConfig, devices } from '@playwright/test';

/** Dedicated E2E port (not 8081). App is stubbed with fixture data for pure tests. */
const E2E_PORT = process.env.E2E_PORT || '8199';
const E2E_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${E2E_PORT}`;

/**
 * Playwright E2E: starts the app on a separate port (8199), then shuts the server down.
 * Keeps 8081 free for your normal development.
 * Tests can run concurrently: each has its own browser context (isolated storage).
 *
 * Titan data for tests (route = respond from disk):
 * - TITAN_DATA_PATH: path to titan-data repo or to templates.json file.
 *   Default: sibling repo ../titan-data. If the file exists, we fulfill templates.json with it.
 * - Unset or missing file: fall back to minimal fixture in src/__fixtures__/templates-minimal.json.
 * - E2E_USE_REMOTE_DATA=1: do not stub; app fetches from its configured URL (e.g. GitHub in CI).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  reporter: [['list'], ['html']],
  use: {
    baseURL: E2E_BASE_URL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run web:test',
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
