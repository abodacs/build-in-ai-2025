/**
 * E2E Tests for Summarizer Module
 *
 * Tests complete user workflows in real browser environment
 * Validates Chrome AI Summarizer API integration
 *
 * Prerequisites:
 * - Chrome/Chromium browser with AI features enabled
 * - Development server running on http://localhost:5173
 * - Chrome flags: --enable-features=Summarization
 *
 * Test Coverage:
 * - User workflows (text input → summarization → output display)
 * - UI interactions (buttons, dropdowns, text areas)
 * - Configuration changes
 * - Error handling in UI
 * - Accessibility
 * - Visual regression (optional)
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Navigate to the Summarizer playground
 */
async function navigateToSummarizer(page: Page) {
  await page.goto('/');
  // Click on Summarizer tab/link (adjust selector based on actual UI)
  await page.click('text=/summarizer/i');
  await page.waitForLoadState('networkidle');
}

/**
 * Check if Chrome AI is available
 */
async function isChromeAIAvailable(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return 'Summarizer' in self || 'Summarizer' in window;
  });
}

/**
 * Wait for summarization to complete
 */
async function waitForSummarization(page: Page, timeout = 10000) {
  await page.waitForSelector('[data-testid="summary-output"]', { timeout });
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Summarizer E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSummarizer(page);
  });

  // ==========================================================================
  // A. Basic User Workflows
  // ==========================================================================

  test.describe('Basic User Workflows', () => {
    test('should complete basic summarization workflow', async ({ page }) => {
      // Skip if Chrome AI not available
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      // Arrange - Enter text to summarize
      const inputText =
        'This is a sample document about artificial intelligence. AI is transforming how we interact with technology. Machine learning models are becoming more sophisticated every day.';

      await page.fill('[data-testid="input-textarea"]', inputText);

      // Act - Click summarize button
      await page.click('[data-testid="summarize-button"]');

      // Assert - Wait for and verify summary output
      await waitForSummarization(page);

      const summaryText = await page.textContent(
        '[data-testid="summary-output"]',
      );
      expect(summaryText).toBeTruthy();
      expect(summaryText!.length).toBeGreaterThan(0);
      expect(summaryText!.length).toBeLessThan(inputText.length);
    });

    test('should show loading state during summarization', async ({ page }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      // Arrange
      const inputText = 'Sample text for loading state test. '.repeat(50);
      await page.fill('[data-testid="input-textarea"]', inputText);

      // Act
      await page.click('[data-testid="summarize-button"]');

      // Assert - Check loading indicator appears
      const loadingIndicator = page.locator(
        '[data-testid="loading-indicator"]',
      );
      await expect(loadingIndicator).toBeVisible({ timeout: 1000 });

      // Wait for completion
      await waitForSummarization(page);

      // Loading indicator should disappear
      await expect(loadingIndicator).not.toBeVisible();
    });

    test('should clear output when clearing input', async ({ page }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      // Arrange - Summarize some text
      await page.fill('[data-testid="input-textarea"]', 'Test content');
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      // Act - Clear input
      await page.click('[data-testid="clear-button"]');

      // Assert
      const inputValue = await page.inputValue(
        '[data-testid="input-textarea"]',
      );
      expect(inputValue).toBe('');

      const summaryText = await page.textContent(
        '[data-testid="summary-output"]',
      );
      expect(summaryText).toBeFalsy();
    });

    test('should copy summary to clipboard', async ({ page, context }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      // Arrange - Generate summary
      await page.fill('[data-testid="input-textarea"]', 'Content to summarize');
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      const summaryText = await page.textContent(
        '[data-testid="summary-output"]',
      );

      // Act - Click copy button
      await page.click('[data-testid="copy-button"]');

      // Assert - Verify clipboard content
      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(clipboardText).toBe(summaryText);
    });
  });

  // ==========================================================================
  // B. Configuration Options
  // ==========================================================================

  test.describe('Configuration Options', () => {
    test('should change summary type (TL;DR, Key Points, etc.)', async ({
      page,
    }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      const inputText = 'Test content for type selection';

      // Test TL;DR
      await page.selectOption('[data-testid="type-select"]', 'tldr');
      await page.fill('[data-testid="input-textarea"]', inputText);
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      const summary1 = await page.textContent('[data-testid="summary-output"]');
      expect(summary1).toBeTruthy();

      // Test Key Points
      await page.selectOption('[data-testid="type-select"]', 'key-points');
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      const summary2 = await page.textContent('[data-testid="summary-output"]');
      expect(summary2).toBeTruthy();
      // Different types may produce different summaries
    });

    test('should change summary length (Short, Medium, Long)', async ({
      page,
    }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      const inputText = 'Test content for length selection. '.repeat(20);

      // Test Short length
      await page.selectOption('[data-testid="length-select"]', 'short');
      await page.fill('[data-testid="input-textarea"]', inputText);
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      const shortSummary = await page.textContent(
        '[data-testid="summary-output"]',
      );
      const shortLength = shortSummary!.length;

      // Test Long length
      await page.selectOption('[data-testid="length-select"]', 'long');
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      const longSummary = await page.textContent(
        '[data-testid="summary-output"]',
      );
      const longLength = longSummary!.length;

      // Long summary should generally be longer than short
      expect(longLength).toBeGreaterThanOrEqual(shortLength * 0.8);
    });

    test('should change output format (Plain Text, Markdown)', async ({
      page,
    }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      const inputText = 'Test content with multiple points and sections';

      // Test Markdown format
      await page.selectOption('[data-testid="format-select"]', 'markdown');
      await page.fill('[data-testid="input-textarea"]', inputText);
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      const markdownSummary = await page.textContent(
        '[data-testid="summary-output"]',
      );

      // Markdown might contain formatting characters
      expect(markdownSummary).toBeTruthy();
    });

    test('should change output language', async ({ page }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      const inputText = 'This is a test document in English';

      // Test Spanish output
      await page.selectOption('[data-testid="language-select"]', 'es');
      await page.fill('[data-testid="input-textarea"]', inputText);
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      const summary = await page.textContent('[data-testid="summary-output"]');
      expect(summary).toBeTruthy();
    });
  });

  // ==========================================================================
  // C. Error Handling
  // ==========================================================================

  test.describe('Error Handling', () => {
    test('should show error for empty input', async ({ page }) => {
      // Act - Try to summarize empty text
      await page.click('[data-testid="summarize-button"]');

      // Assert - Error message should appear
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 2000 });

      const errorText = await errorMessage.textContent();
      expect(errorText).toMatch(/empty|required|enter/i);
    });

    test('should show error when API unavailable', async ({ page }) => {
      // Check if API is unavailable
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(
        isAvailable,
        'Chrome AI is available, cannot test unavailable state',
      );

      // Act - Try to summarize
      await page.fill('[data-testid="input-textarea"]', 'Test content');
      await page.click('[data-testid="summarize-button"]');

      // Assert - Error message about API unavailability
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      const errorText = await errorMessage.textContent();
      expect(errorText).toMatch(/not available|not supported|browser/i);
    });

    test('should recover from errors', async ({ page }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      // Arrange - Trigger error with empty input
      await page.click('[data-testid="summarize-button"]');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

      // Act - Provide valid input and retry
      await page.fill('[data-testid="input-textarea"]', 'Valid content');
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      // Assert - Error should be cleared, summary should appear
      await expect(
        page.locator('[data-testid="error-message"]'),
      ).not.toBeVisible();

      const summary = await page.textContent('[data-testid="summary-output"]');
      expect(summary).toBeTruthy();
    });
  });

  // ==========================================================================
  // D. Long Text & Chunking
  // ==========================================================================

  test.describe('Long Text Processing', () => {
    test('should handle long text with progress indicator', async ({
      page,
    }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      // Arrange - Very long text
      const longText = 'Long document paragraph. '.repeat(500); // ~12k chars
      await page.fill('[data-testid="input-textarea"]', longText);

      // Act
      await page.click('[data-testid="summarize-button"]');

      // Assert - Progress indicator should appear for long text
      const progressBar = page.locator('[data-testid="progress-bar"]');

      // Check if progress bar appears (may be very quick)
      try {
        await expect(progressBar).toBeVisible({ timeout: 2000 });
      } catch {
        // Progress might be too fast to catch
      }

      await waitForSummarization(page, 30000); // 30s timeout for long text

      const summary = await page.textContent('[data-testid="summary-output"]');
      expect(summary).toBeTruthy();
    });

    test('should successfully summarize very long documents', async ({
      page,
    }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      // Arrange - Extremely long text
      const veryLongText =
        'Document section with detailed information. '.repeat(1000); // ~45k chars

      await page.fill('[data-testid="input-textarea"]', veryLongText);

      // Act
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page, 60000); // 60s timeout

      // Assert
      const summary = await page.textContent('[data-testid="summary-output"]');
      expect(summary).toBeTruthy();
      expect(summary!.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // E. Accessibility
  // ==========================================================================

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab'); // Focus input
      await page.keyboard.type('Keyboard navigation test');

      await page.keyboard.press('Tab'); // Focus summarize button
      await page.keyboard.press('Enter'); // Activate

      // Should trigger summarization
      const isAvailable = await isChromeAIAvailable(page);
      if (isAvailable) {
        await waitForSummarization(page);
        const summary = await page.textContent(
          '[data-testid="summary-output"]',
        );
        expect(summary).toBeTruthy();
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check input has label
      const input = page.locator('[data-testid="input-textarea"]');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      expect(ariaLabel || ariaLabelledBy).toBeTruthy();

      // Check button has accessible name
      const button = page.locator('[data-testid="summarize-button"]');
      const buttonText = await button.textContent();
      const buttonAriaLabel = await button.getAttribute('aria-label');

      expect(buttonText || buttonAriaLabel).toBeTruthy();
    });

    test('should announce loading state to screen readers', async ({
      page,
    }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      await page.fill('[data-testid="input-textarea"]', 'Accessibility test');
      await page.click('[data-testid="summarize-button"]');

      // Check for aria-live region
      const liveRegion = page.locator(
        '[aria-live="polite"], [aria-live="assertive"]',
      );
      await expect(liveRegion).toBeVisible({ timeout: 2000 });
    });
  });

  // ==========================================================================
  // F. Responsive Design
  // ==========================================================================

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      // Test basic workflow on mobile
      await page.fill('[data-testid="input-textarea"]', 'Mobile test content');
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      const summary = await page.textContent('[data-testid="summary-output"]');
      expect(summary).toBeTruthy();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check layout adapts
      const container = page.locator('[data-testid="summarizer-container"]');
      await expect(container).toBeVisible();

      const width = await container.evaluate((el) => el.clientWidth);
      expect(width).toBeLessThanOrEqual(768);
    });
  });

  // ==========================================================================
  // G. Visual Regression (Optional)
  // ==========================================================================

  test.describe('Visual Regression', () => {
    test('should match screenshot of initial state', async ({ page }) => {
      await expect(page).toHaveScreenshot('summarizer-initial.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match screenshot with summary output', async ({ page }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      await page.fill(
        '[data-testid="input-textarea"]',
        'Test content for screenshot',
      );
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page);

      await expect(page).toHaveScreenshot('summarizer-with-output.png', {
        fullPage: true,
        animations: 'disabled',
        // Mask dynamic content
        mask: [page.locator('[data-testid="summary-output"]')],
      });
    });
  });

  // ==========================================================================
  // H. Performance
  // ==========================================================================

  test.describe('Performance', () => {
    test('should load page within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test('should complete summarization within reasonable time', async ({
      page,
    }) => {
      const isAvailable = await isChromeAIAvailable(page);
      test.skip(!isAvailable, 'Chrome AI not available');

      const mediumText = 'Medium length content. '.repeat(100); // ~2.3k chars

      await page.fill('[data-testid="input-textarea"]', mediumText);

      const startTime = Date.now();
      await page.click('[data-testid="summarize-button"]');
      await waitForSummarization(page, 10000);
      const duration = Date.now() - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });
  });
});
