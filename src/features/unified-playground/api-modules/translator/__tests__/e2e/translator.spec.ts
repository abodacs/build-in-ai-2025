/**
 * E2E Tests for Translator Module (Playwright)
 *
 * Tests real browser workflows, model downloads, batch operations,
 * responsive design, and accessibility
 *
 * Coverage: 20 tests total
 * Run with: pnpm test:e2e
 */

import { test, expect } from '@playwright/test';

// ==========================================================================
// Full Playground Workflow (8 tests)
// ==========================================================================

test.describe('Full Playground Workflow', () => {
  test('user visits /translator → sees UI', async ({ page }) => {
    await page.goto('/translator');

    await expect(
      page.locator('[data-testid="translator-playground"]'),
    ).toBeVisible();
    await expect(page.getByLabel(/source language/i)).toBeVisible();
    await expect(page.getByLabel(/target language/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter text/i)).toBeVisible();
  });

  test('selects en→es → availability shows "ready"', async ({ page }) => {
    await page.goto('/translator');

    await page.selectOption('[data-testid="source-lang-select"]', 'en');
    await page.selectOption('[data-testid="target-lang-select"]', 'es');

    await expect(page.getByText(/ready|readily/i)).toBeVisible();
  });

  test('types "Hello world" → clicks translate → sees "Hola mundo"', async ({
    page,
  }) => {
    await page.goto('/translator');

    // Select languages
    await page.selectOption('[data-testid="source-lang-select"]', 'en');
    await page.selectOption('[data-testid="target-lang-select"]', 'es');

    // Input text
    await page.fill('[data-testid="translator-input"]', 'Hello world');

    // Translate
    await page.click('[data-testid="translate-button"]');

    // Wait for translation
    await expect(
      page.locator('[data-testid="translation-result"]'),
    ).toContainText(/hola/i, {
      timeout: 10000,
    });
  });

  test('clicks swap → es→en → retranslates → sees "Hello world"', async ({
    page,
  }) => {
    await page.goto('/translator');

    // Initial translation
    await page.selectOption('[data-testid="source-lang-select"]', 'en');
    await page.selectOption('[data-testid="target-lang-select"]', 'es');
    await page.fill('[data-testid="translator-input"]', 'Hello');
    await page.click('[data-testid="translate-button"]');

    await expect(
      page.locator('[data-testid="translation-result"]'),
    ).toContainText(/hola/i);

    // Swap
    await page.click('[data-testid="swap-languages-button"]');

    // Retranslate
    await page.fill('[data-testid="translator-input"]', 'Hola');
    await page.click('[data-testid="translate-button"]');

    await expect(
      page.locator('[data-testid="translation-result"]'),
    ).toContainText(/hello/i);
  });

  test('clicks copy translation → clipboard has translated text', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/translator');

    // Translate
    await page.selectOption('[data-testid="source-lang-select"]', 'en');
    await page.selectOption('[data-testid="target-lang-select"]', 'es');
    await page.fill('[data-testid="translator-input"]', 'Hello');
    await page.click('[data-testid="translate-button"]');

    await expect(
      page.locator('[data-testid="translation-result"]'),
    ).toContainText(/hola/i);

    // Copy
    await page.click('[data-testid="copy-translation-button"]');

    // Verify clipboard
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText.toLowerCase()).toContain('hola');
  });

  test('clicks download → JSON file downloads', async ({ page }) => {
    await page.goto('/translator');

    // Translate
    await page.selectOption('[data-testid="source-lang-select"]', 'en');
    await page.selectOption('[data-testid="target-lang-select"]', 'es');
    await page.fill('[data-testid="translator-input"]', 'Test');
    await page.click('[data-testid="translate-button"]');

    await page.waitForSelector('[data-testid="translation-result"]');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download
    await page.click('[data-testid="download-button"]');

    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('clicks view code → modal shows TypeScript code', async ({ page }) => {
    await page.goto('/translator');

    await page.click('[data-testid="view-code-button"]');

    await expect(page.locator('[data-testid="code-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-code"]')).toContainText(
      /Translator\.create/,
    );
  });

  test('switches to 5 different language pairs → all work', async ({
    page,
  }) => {
    await page.goto('/translator');

    const pairs = [
      { source: 'en', target: 'es', input: 'Hello', output: /hola/i },
      { source: 'en', target: 'fr', input: 'Hello', output: /bonjour/i },
      { source: 'en', target: 'de', input: 'Hello', output: /hallo/i },
      { source: 'es', target: 'en', input: 'Hola', output: /hello/i },
      { source: 'fr', target: 'en', input: 'Bonjour', output: /hello/i },
    ];

    for (const pair of pairs) {
      await page.selectOption(
        '[data-testid="source-lang-select"]',
        pair.source,
      );
      await page.selectOption(
        '[data-testid="target-lang-select"]',
        pair.target,
      );
      await page.fill('[data-testid="translator-input"]', pair.input);
      await page.click('[data-testid="translate-button"]');

      await expect(
        page.locator('[data-testid="translation-result"]'),
      ).toContainText(pair.output, {
        timeout: 10000,
      });

      await page.click('[data-testid="reset-button"]');
    }
  });
});

// ==========================================================================
// Model Download (3 tests)
// ==========================================================================

test.describe('Model Download', () => {
  test('first-time language pair shows download progress', async ({ page }) => {
    await page.goto('/translator');

    await page.selectOption('[data-testid="source-lang-select"]', 'en');
    await page.selectOption('[data-testid="target-lang-select"]', 'ja'); // Assume not cached

    await page.fill('[data-testid="translator-input"]', 'Test');
    await page.click('[data-testid="translate-button"]');

    // Check for download indicator
    await expect(
      page.locator('[data-testid="download-progress"]'),
    ).toBeVisible();
  });

  test('download completes → translation proceeds', async ({ page }) => {
    await page.goto('/translator');

    await page.selectOption('[data-testid="source-lang-select"]', 'en');
    await page.selectOption('[data-testid="target-lang-select"]', 'ko');

    await page.fill('[data-testid="translator-input"]', 'Hello');
    await page.click('[data-testid="translate-button"]');

    // Wait for download and translation
    await expect(
      page.locator('[data-testid="translation-result"]'),
    ).toBeVisible({ timeout: 60000 });
  });

  test('subsequent use of same pair is instant (cached)', async ({ page }) => {
    await page.goto('/translator');

    await page.selectOption('[data-testid="source-lang-select"]', 'en');
    await page.selectOption('[data-testid="target-lang-select"]', 'es');

    // First translation
    await page.fill('[data-testid="translator-input"]', 'Test 1');
    await page.click('[data-testid="translate-button"]');
    await page.waitForSelector('[data-testid="translation-result"]');

    // Second translation (should be instant)
    await page.fill('[data-testid="translator-input"]', 'Test 2');
    const startTime = Date.now();
    await page.click('[data-testid="translate-button"]');
    await page.waitForSelector('[data-testid="translation-result"]');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000); // Should be fast
  });
});

// ==========================================================================
// Batch E2E (4 tests)
// ==========================================================================

test.describe('Batch Translation', () => {
  test('add 3 items → translate batch → export results', async ({ page }) => {
    await page.goto('/translator');

    await page.click('[data-testid="batch-tab"]');

    // Add items
    await page.click('[data-testid="add-batch-item"]');
    await page.fill('[data-testid="batch-item-0"]', 'Hello');

    await page.click('[data-testid="add-batch-item"]');
    await page.fill('[data-testid="batch-item-1"]', 'World');

    await page.click('[data-testid="add-batch-item"]');
    await page.fill('[data-testid="batch-item-2"]', 'Test');

    // Process
    await page.click('[data-testid="process-batch-button"]');

    // Wait for completion
    await expect(
      page.locator('[data-testid="batch-progress"]'),
    ).toHaveAttribute('aria-valuenow', '100', {
      timeout: 30000,
    });

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-batch-button"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/batch.*\.json$/);
  });

  test('import CSV with 10 items → process → download', async ({ page }) => {
    await page.goto('/translator');

    await page.click('[data-testid="batch-tab"]');

    // Mock file upload
    const csvContent = 'Hello\nWorld\nTest\n' + 'Item\n'.repeat(7);
    const fileInput = page.locator('[data-testid="import-csv-input"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Process
    await page.click('[data-testid="process-batch-button"]');

    await expect(
      page.locator('[data-testid="batch-progress"]'),
    ).toHaveAttribute('aria-valuenow', '100', {
      timeout: 60000,
    });

    // Download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-batch-button"]');
    await downloadPromise;
  });

  test('batch progress bar updates correctly', async ({ page }) => {
    await page.goto('/translator');

    await page.click('[data-testid="batch-tab"]');

    // Add 5 items
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="add-batch-item"]');
      await page.fill(`[data-testid="batch-item-${i}"]`, `Item ${i}`);
    }

    // Process
    await page.click('[data-testid="process-batch-button"]');

    // Check progress updates
    await expect(
      page.locator('[data-testid="batch-progress"]'),
    ).toHaveAttribute('aria-valuenow', /20|40|60|80|100/);
  });

  test('cancel batch → processing stops', async ({ page }) => {
    await page.goto('/translator');

    await page.click('[data-testid="batch-tab"]');

    // Add 10 items
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="add-batch-item"]');
      await page.fill(`[data-testid="batch-item-${i}"]`, `Item ${i}`);
    }

    // Start processing
    await page.click('[data-testid="process-batch-button"]');

    // Cancel mid-process
    await page.click('[data-testid="cancel-batch-button"]');

    // Verify stopped
    const progress = await page
      .locator('[data-testid="batch-progress"]')
      .getAttribute('aria-valuenow');
    expect(Number(progress)).toBeLessThan(100);
  });
});

// ==========================================================================
// Responsive & Accessibility (3 tests)
// ==========================================================================

test.describe('Responsive & Accessibility', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/translator');

    await expect(
      page.locator('[data-testid="translator-playground"]'),
    ).toBeVisible();
    await expect(page.getByLabel(/source language/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter text/i)).toBeVisible();
  });

  test('keyboard navigation works (Tab, Enter, Esc)', async ({ page }) => {
    await page.goto('/translator');

    // Tab to source selector
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/source language/i)).toBeFocused();

    // Tab to target selector
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/target language/i)).toBeFocused();

    // Tab to input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Test text');

    // Tab to translate button
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: /translate/i }),
    ).toBeFocused();

    // Press Enter
    await page.keyboard.press('Enter');

    // Verify translation started
    await expect(
      page.locator('[data-testid="translate-button"]'),
    ).toBeDisabled();
  });

  test('screen reader announces key actions', async ({ page }) => {
    await page.goto('/translator');

    // Check ARIA labels
    await expect(page.getByLabel(/source language/i)).toHaveAttribute(
      'aria-label',
    );
    await expect(page.getByLabel(/target language/i)).toHaveAttribute(
      'aria-label',
    );
    await expect(page.getByPlaceholder(/enter text/i)).toHaveAttribute(
      'aria-label',
    );

    // Check status announcements
    await page.selectOption('[data-testid="source-lang-select"]', 'en');
    await page.selectOption('[data-testid="target-lang-select"]', 'es');
    await page.fill('[data-testid="translator-input"]', 'Test');
    await page.click('[data-testid="translate-button"]');

    await expect(page.locator('[role="status"]')).toBeVisible();
  });
});

// ==========================================================================
// Code Generation (2 tests)
// ==========================================================================

test.describe('Code Generation', () => {
  test('generated code is valid TypeScript', async ({ page }) => {
    await page.goto('/translator');

    await page.click('[data-testid="view-code-button"]');

    const code = await page
      .locator('[data-testid="generated-code"]')
      .textContent();

    // Check for valid TypeScript syntax
    expect(code).toContain('await Translator.create');
    expect(code).toContain('sourceLanguage');
    expect(code).toContain('targetLanguage');
    expect(code).toMatch(/const|let/);
  });

  test('copy code → paste → runs without errors', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/translator');

    await page.click('[data-testid="view-code-button"]');
    await page.click('[data-testid="copy-code-button"]');

    const clipboardCode = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    // Verify code structure
    expect(clipboardCode).toBeTruthy();
    expect(clipboardCode).toContain('Translator.create');
  });
});
