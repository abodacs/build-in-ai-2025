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

  // Memory-safe: Limit workers to prevent excessive memory usage
  // On CI: 1 worker for stability, Local: max 2 workers to conserve memory
  workers: process.env.CI ? 1 : 2,

  // Memory-safe: Stop test run after N failures to prevent resource waste
  maxFailures: process.env.CI ? 5 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['list'],
  ],

  // Memory-safe: Output directory for test artifacts
  outputDir: 'test-results',

  // Memory-safe: Only preserve output for failed tests
  preserveOutput: 'failures-only',

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',

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
            // Memory-safe: Limit memory usage in browser
            '--disable-dev-shm-usage', // Overcome limited resource problems
            '--disable-gpu', // Reduce GPU memory usage in headless mode
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
            // Memory-safe: Limit memory usage in browser
            '--disable-dev-shm-usage',
            '--disable-gpu',
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
            // Memory-safe: Limit memory usage in browser
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
        },
      },
    },
  ],

  // Web server configuration
  webServer: {
    command: process.env.CI ? 'pnpm preview' : 'pnpm dev',
    url: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start server
  },
});
