import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 *
 * Configured for Chrome Built-in AI DevBench project
 * Tests Chrome AI APIs in real browser environment
 */

export default defineConfig({
  testDir: './tests/e2e',

  // Test timeout
  timeout: 30 * 1000, // 30 seconds per test

  // Global timeout
  globalTimeout: 60 * 60 * 1000, // 1 hour for entire test suite

  // Expect timeout
  expect: {
    timeout: 5000, // 5 seconds for assertions
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Emulate viewport
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Context options
    contextOptions: {
      // Required for Chrome AI APIs
      permissions: ['clipboard-read', 'clipboard-write'],
    },
  },

  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chrome AI APIs are only available in Chrome/Chromium
        channel: 'chrome', // Use installed Chrome
        launchOptions: {
          // Enable experimental features for Chrome AI
          args: [
            '--enable-features=Summarization,Translation,LanguageDetection,AIRewriter,AIWriter',
            '--enable-experimental-web-platform-features',
          ],
        },
      },
    },

    // Chrome Canary for latest AI features
    {
      name: 'chrome-canary',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome-canary',
        launchOptions: {
          args: [
            '--enable-features=Summarization,Translation,LanguageDetection,AIRewriter,AIWriter',
            '--enable-experimental-web-platform-features',
          ],
        },
      },
    },

    // Optional: Test fallback behavior on non-Chrome browsers
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Mobile Chrome (for responsive testing)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--enable-features=Summarization,Translation,LanguageDetection,AIRewriter,AIWriter',
            '--enable-experimental-web-platform-features',
          ],
        },
      },
    },
  ],

  // Web server configuration
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start server
  },
});
