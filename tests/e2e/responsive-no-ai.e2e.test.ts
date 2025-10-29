/**
 * E2E Tests for Responsive Design (No AI Required)
 *
 * Tests responsive layout and navigation without requiring Chrome AI APIs.
 * These tests run on Firefox browser without any AI feature flags.
 *
 * Prerequisites:
 * - Firefox browser (default, no special flags needed)
 * - Development server running on http://localhost:5173
 * - NO Chrome AI flags required
 *
 * Test Coverage:
 * - Mobile viewport navigation (375px - drawer behavior)
 * - Desktop viewport navigation (1280px - sidebar behavior)
 * - Breakpoint transitions (responsive layout changes)
 * - Fallback UI rendering when AI unavailable
 * - Keyboard accessibility without AI
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Configuration
// ============================================================================

// Viewport sizes for testing
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
};

// API modules that should appear in navigation
const API_MODULES = [
  'Summarizer',
  'Translator',
  'Writer',
  'Rewriter',
  'Proofreader',
  'Prompt',
  'Language Detection',
];

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Wait for the page to be fully loaded
 */
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  // Wait for main heading or API selector to appear
  await page.waitForSelector('text=/Available APIs/i', { timeout: 5000 });
}

/**
 * Check if mobile drawer button is visible (Sheet trigger with Menu icon)
 */
async function isMobileDrawerVisible(page: Page): Promise<boolean> {
  try {
    // Mobile button shows "Select API" or module name with Menu icon
    const button = page.getByRole('button', {
      name: /Select API|Summarizer|Translator|Writer|Rewriter|Proofreader|Prompt|Language Detection/i,
    });
    const isVisible = await button.isVisible();
    if (!isVisible) return false;

    // Check if it also contains the badge showing "APIs" count
    const buttonWithBadge = page.locator('button', {
      has: page.locator('text=/\\d+ APIs/'),
    });
    return await buttonWithBadge.isVisible();
  } catch {
    return false;
  }
}

/**
 * Check if desktop sidebar is visible (Card with "Available APIs" title)
 */
async function isDesktopSidebarVisible(page: Page): Promise<boolean> {
  try {
    // Desktop shows a Card with "Available APIs" as CardTitle, not a button
    const sidebar = page.locator('div').filter({
      has: page.getByRole('heading', { name: /Available APIs/i }),
    });
    return await sidebar.isVisible();
  } catch {
    return false;
  }
}

/**
 * Open mobile drawer
 */
async function openMobileDrawer(page: Page) {
  // Click the button that shows current API selection
  const button = page.getByRole('button', {
    name: /Select API|Summarizer|Translator|Writer|Rewriter|Proofreader|Prompt|Language Detection/i,
  });
  await button.click();

  // Wait for drawer to open (Sheet content appears)
  await page.waitForSelector('text=/Select a Chrome AI API/i', {
    state: 'visible',
    timeout: 2000,
  });
}

/**
 * Close mobile drawer by clicking overlay or pressing Escape
 */
async function closeMobileDrawer(page: Page) {
  // Press Escape to close the drawer
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300); // Allow for close animation
}

/**
 * Click an API button in the selector
 */
async function selectAPI(page: Page, apiName: string) {
  // Find button by its text content (API name)
  const apiButton = page.getByRole('button', {
    name: new RegExp(apiName, 'i'),
  });
  await apiButton.click();
  await page.waitForTimeout(500); // Allow for state updates
}

/**
 * Verify fallback UI is displayed (Coming Soon message)
 */
async function verifyFallbackUI(page: Page): Promise<boolean> {
  try {
    // Look for "Coming Soon" badge or text
    const comingSoonBadge = page.getByText(/Coming Soon/i);
    const isVisible = await comingSoonBadge.isVisible();
    return isVisible;
  } catch {
    return false;
  }
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Responsive Design Without AI', () => {
  // Use Firefox for these tests (no AI support)
  test.use({ browserName: 'firefox' });

  // ==========================================================================
  // Test 1: Mobile Viewport Navigation
  // ==========================================================================

  test.describe('Mobile Viewport (375px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/');
      await waitForPageLoad(page);
    });

    test('should display mobile drawer and allow navigation between APIs', async ({
      page,
    }) => {
      // Assert - Verify mobile UI is rendered
      const hasMobileDrawer = await isMobileDrawerVisible(page);
      expect(hasMobileDrawer).toBe(true);

      const hasDesktopSidebar = await isDesktopSidebarVisible(page);
      expect(hasDesktopSidebar).toBe(false);

      // Act - Open mobile drawer
      await openMobileDrawer(page);

      // Assert - Verify drawer is visible with Sheet content
      await expect(page.getByText(/Select a Chrome AI API/i)).toBeVisible();

      // Verify some API modules are listed
      for (const apiName of ['Summarizer', 'Translator', 'Writer']) {
        const apiButton = page.getByRole('button', {
          name: new RegExp(apiName, 'i'),
        });
        await expect(apiButton).toBeVisible();
      }

      // Act - Click on an available API (Writer is "Soon", so try Summarizer first)
      await selectAPI(page, 'Summarizer');

      // Assert - Drawer should close after selection (mobile behavior)
      await page.waitForTimeout(500);
      await expect(page.getByText(/Select a Chrome AI API/i)).not.toBeVisible();

      // Note: Since we're on Firefox without AI APIs, Summarizer should show fallback
      // But we can't reliably test this without knowing the exact detection behavior

      // Act - Open drawer again and select a "Coming Soon" API
      await openMobileDrawer(page);
      await selectAPI(page, 'Writer');

      // Assert - Verify fallback UI appears for unavailable API
      await page.waitForTimeout(500);
      const hasFallback = await verifyFallbackUI(page);
      expect(hasFallback).toBe(true);

      // Act - Close drawer
      await closeMobileDrawer(page);

      // Assert - Verify drawer is closed
      await page.waitForTimeout(300);
      await expect(page.getByText(/Select a Chrome AI API/i)).not.toBeVisible();
    });

    test('should support keyboard accessibility on mobile', async ({
      page,
    }) => {
      // Act - Focus and open drawer with keyboard
      await page.keyboard.press('Tab'); // Tab to first interactive element
      await page.keyboard.press('Enter'); // Open drawer

      // Assert - Drawer opens
      await expect(page.getByText(/Select a Chrome AI API/i)).toBeVisible({
        timeout: 2000,
      });

      // Act - Press Escape to close
      await page.keyboard.press('Escape');

      // Assert - Drawer closes
      await expect(page.getByText(/Select a Chrome AI API/i)).not.toBeVisible({
        timeout: 2000,
      });
    });
  });

  // ==========================================================================
  // Test 2: Desktop Viewport Navigation
  // ==========================================================================

  test.describe('Desktop Viewport (1280px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await waitForPageLoad(page);
    });

    test('should display permanent sidebar and allow navigation', async ({
      page,
    }) => {
      // Assert - Verify desktop UI is rendered
      const hasDesktopSidebar = await isDesktopSidebarVisible(page);
      expect(hasDesktopSidebar).toBe(true);

      const hasMobileDrawer = await isMobileDrawerVisible(page);
      expect(hasMobileDrawer).toBe(false);

      // Assert - Verify API modules are visible in sidebar
      for (const apiName of API_MODULES) {
        const apiButton = page.getByRole('button', {
          name: new RegExp(apiName, 'i'),
        });
        await expect(apiButton).toBeVisible();
      }

      // Act - Click on a "Coming Soon" API
      await selectAPI(page, 'Writer');
      let hasFallback = await verifyFallbackUI(page);
      expect(hasFallback).toBe(true);

      // Act - Click on another "Coming Soon" API
      await selectAPI(page, 'Rewriter');
      hasFallback = await verifyFallbackUI(page);
      expect(hasFallback).toBe(true);

      // Assert - Verify "Coming Soon" badge is visible
      await expect(page.getByText(/Coming Soon/i)).toBeVisible();

      // Assert - Verify development message is shown
      await expect(
        page.getByText(/currently under development|Stay tuned/i),
      ).toBeVisible();
    });

    test('should support keyboard navigation in sidebar', async ({ page }) => {
      // Focus on first interactive element and navigate
      await page.keyboard.press('Tab');

      // Navigate through sidebar buttons
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
      }

      // Press Enter to select an API
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Assert - Verify some content is displayed (Card or fallback)
      const card = page.locator('div[class*="rounded-"]').filter({
        hasText: /API|Coming Soon|Available/i,
      });
      await expect(card.first()).toBeVisible();
    });
  });

  // ==========================================================================
  // Test 3: Breakpoint Transitions
  // ==========================================================================

  test.describe('Breakpoint Transitions', () => {
    test('should adapt layout when resizing between mobile, tablet, and desktop', async ({
      page,
    }) => {
      // Start at mobile
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/');
      await waitForPageLoad(page);

      // Assert - Mobile UI
      let hasMobileDrawer = await isMobileDrawerVisible(page);
      let hasDesktopSidebar = await isDesktopSidebarVisible(page);
      expect(hasMobileDrawer).toBe(true);
      expect(hasDesktopSidebar).toBe(false);

      // Act - Select an API on mobile
      await openMobileDrawer(page);
      await selectAPI(page, 'Writer');
      // Drawer auto-closes on mobile after selection
      await page.waitForTimeout(500);

      // Act - Resize to desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.waitForTimeout(500); // Allow layout to adjust

      // Assert - Desktop UI
      hasMobileDrawer = await isMobileDrawerVisible(page);
      hasDesktopSidebar = await isDesktopSidebarVisible(page);
      expect(hasMobileDrawer).toBe(false);
      expect(hasDesktopSidebar).toBe(true);

      // Assert - Verify selected API content persists (Coming Soon should be visible)
      await expect(page.getByText(/Coming Soon/i)).toBeVisible();

      // Act - Select a different API on desktop
      await selectAPI(page, 'Rewriter');
      await page.waitForTimeout(300);

      // Act - Resize back to mobile
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.waitForTimeout(500);

      // Assert - Back to mobile UI
      hasMobileDrawer = await isMobileDrawerVisible(page);
      hasDesktopSidebar = await isDesktopSidebarVisible(page);
      expect(hasMobileDrawer).toBe(true);
      expect(hasDesktopSidebar).toBe(false);

      // Assert - Content persists (Coming Soon message still visible)
      await expect(page.getByText(/Coming Soon/i)).toBeVisible();
    });

    test('should maintain content visibility during breakpoint changes', async ({
      page,
    }) => {
      // Start at desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await waitForPageLoad(page);

      // Select an API
      await selectAPI(page, 'Writer');
      await page.waitForTimeout(300);

      // Verify fallback content is visible
      await expect(page.getByText(/Coming Soon/i)).toBeVisible();

      // Resize to mobile
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.waitForTimeout(500);

      // Content should still be visible (Coming Soon message)
      await expect(page.getByText(/Coming Soon/i)).toBeVisible();

      // Resize back to desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.waitForTimeout(500);

      // Content still visible
      await expect(page.getByText(/Coming Soon/i)).toBeVisible();
    });
  });
});
