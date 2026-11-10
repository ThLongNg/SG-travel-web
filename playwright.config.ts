// Owner: Agent C. E2E tests run against the production build: `npm run build && npm run test:e2e`.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4341;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 45_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL,
    locale: 'ja-JP',
    timezoneId: 'Asia/Ho_Chi_Minh',
    // The service worker is tested on its own (pwa.spec.ts); elsewhere it would only add caching noise.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    // SPEC: design starts at 375×667 (iPhone SE 2nd/3rd gen). Playwright's "iPhone SE" is the 320px 1st gen.
    {
      name: 'iphone-se',
      use: { ...devices['iPhone SE'], viewport: { width: 375, height: 667 } },
    },
    { name: 'iphone-15', use: { ...devices['iPhone 15'] } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --host 127.0.0.1`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
