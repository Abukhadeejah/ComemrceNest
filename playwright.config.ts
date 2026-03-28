import { defineConfig, devices } from '@playwright/test'

// Resolve base URL from env – fall back to local dev server
const baseURL =
  process.env.E2E_BASE_URL ||
  process.env.STAGING_BASE_URL ||
  'http://localhost:3000'

// Start dev server only when we’re pointing to localhost
const useWebServer =
  baseURL.startsWith('http://localhost') ||
  baseURL.startsWith('https://localhost')

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  ...(useWebServer && {
    webServer: {
      command: 'npm run dev',
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  }),

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})


