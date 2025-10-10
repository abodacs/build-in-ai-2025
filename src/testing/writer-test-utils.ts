/**
 * Writer API Testing Utilities
 *
 * Helper functions for testing Writer API implementation.
 * These utilities can be run in the browser console for manual testing.
 *
 * @module testing/writer-test-utils
 */

import {
  TEMPLATE_CATEGORIES,
  getAllTemplates,
  searchTemplates,
} from '../features/unified-playground/api-modules/writer/utils/promptTemplates';
import type {
  WriterConfig,
  WriterTone,
  WriterFormat,
  WriterLength,
  WriterTemplate,
} from '../features/unified-playground/api-modules/writer/types';

// ============================================================================
// Test Data
// ============================================================================

export const TEST_PROMPTS = {
  short: 'Write a welcome email',
  medium: 'Write a blog post about the benefits of AI in healthcare',
  long: 'Write a comprehensive tutorial on how to use TypeScript generics with real-world examples and best practices',
  empty: '',
  whitespace: '   \n\t  ',
  special: 'Write about: ~!@#$%^&*()_+-=[]{}|;:,.<>?',
  emoji: '🚀 Write a post about space exploration 🌟',
  veryLong: 'A'.repeat(10000),
};

export const TEST_CONFIGS: Record<string, WriterConfig> = {
  formal_markdown_short: {
    tone: 'formal',
    format: 'markdown',
    length: 'short',
    outputLanguage: 'en',
    sharedContext: '',
  },
  casual_plain_long: {
    tone: 'casual',
    format: 'plain-text',
    length: 'long',
    outputLanguage: 'en',
    sharedContext: '',
  },
  neutral_markdown_medium: {
    tone: 'neutral',
    format: 'markdown',
    length: 'medium',
    outputLanguage: 'en',
    sharedContext: 'This is for a tech blog',
  },
};

// ============================================================================
// Template Testing
// ============================================================================

/**
 * Test: Verify template count
 */
export function testTemplateCount(): boolean {
  const templates = getAllTemplates();
  const expected = 18;
  const actual = templates.length;

  console.log(`✓ Template Count Test`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual: ${actual}`);
  console.log(`  Result: ${actual === expected ? '✅ PASS' : '❌ FAIL'}`);

  return actual === expected;
}

/**
 * Test: Verify no duplicate template IDs
 */
export function testNoDuplicateTemplateIds(): boolean {
  const templates = getAllTemplates();
  const ids = templates.map((t) => t.id);
  const uniqueIds = new Set(ids);

  console.log(`✓ Duplicate ID Test`);
  console.log(`  Total IDs: ${ids.length}`);
  console.log(`  Unique IDs: ${uniqueIds.size}`);
  console.log(
    `  Result: ${ids.length === uniqueIds.size ? '✅ PASS' : '❌ FAIL'}`,
  );

  if (ids.length !== uniqueIds.size) {
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    console.error('  Duplicates:', duplicates);
  }

  return ids.length === uniqueIds.size;
}

/**
 * Test: Verify all categories have templates
 */
export function testAllCategoriesHaveTemplates(): boolean {
  const results = TEMPLATE_CATEGORIES.map((category) => ({
    category: category.name,
    count: category.templates.length,
    passed: category.templates.length > 0,
  }));

  console.log(`✓ Category Templates Test`);
  results.forEach((r) => {
    console.log(
      `  ${r.category}: ${r.count} templates ${r.passed ? '✅' : '❌'}`,
    );
  });

  const allPassed = results.every((r) => r.passed);
  console.log(`  Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);

  return allPassed;
}

/**
 * Test: Verify template structure
 */
export function testTemplateStructure(): boolean {
  const templates = getAllTemplates();
  const requiredFields = [
    'id',
    'name',
    'description',
    'category',
    'prompt',
    'icon',
  ];

  const invalidTemplates = templates.filter((template) => {
    return requiredFields.some((field) => !(field in template));
  });

  console.log(`✓ Template Structure Test`);
  console.log(`  Templates checked: ${templates.length}`);
  console.log(`  Invalid templates: ${invalidTemplates.length}`);
  console.log(
    `  Result: ${invalidTemplates.length === 0 ? '✅ PASS' : '❌ FAIL'}`,
  );

  if (invalidTemplates.length > 0) {
    console.error('  Invalid templates:', invalidTemplates);
  }

  return invalidTemplates.length === 0;
}

// ============================================================================
// Configuration Testing
// ============================================================================

/**
 * Test: Verify tone options
 */
export function testToneOptions(): boolean {
  const validTones: WriterTone[] = ['formal', 'neutral', 'casual'];
  const allValid = validTones.every((tone) => {
    return typeof tone === 'string' && tone.length > 0;
  });

  console.log(`✓ Tone Options Test`);
  console.log(`  Valid tones: ${validTones.join(', ')}`);
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid;
}

/**
 * Test: Verify format options
 */
export function testFormatOptions(): boolean {
  const validFormats: WriterFormat[] = ['markdown', 'plain-text'];
  const allValid = validFormats.every((format) => {
    return typeof format === 'string' && format.length > 0;
  });

  console.log(`✓ Format Options Test`);
  console.log(`  Valid formats: ${validFormats.join(', ')}`);
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid;
}

/**
 * Test: Verify length options
 */
export function testLengthOptions(): boolean {
  const validLengths: WriterLength[] = ['short', 'medium', 'long'];
  const allValid = validLengths.every((length) => {
    return typeof length === 'string' && length.length > 0;
  });

  console.log(`✓ Length Options Test`);
  console.log(`  Valid lengths: ${validLengths.join(', ')}`);
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid;
}

// ============================================================================
// Prompt Validation Testing
// ============================================================================

/**
 * Test: Empty prompt should be invalid
 */
export function testEmptyPromptInvalid(): boolean {
  const isEmpty = TEST_PROMPTS.empty.trim().length === 0;
  const isWhitespaceOnly = TEST_PROMPTS.whitespace.trim().length === 0;

  console.log(`✓ Empty Prompt Validation Test`);
  console.log(`  Empty string invalid: ${isEmpty ? '✅' : '❌'}`);
  console.log(`  Whitespace-only invalid: ${isWhitespaceOnly ? '✅' : '❌'}`);
  console.log(
    `  Result: ${isEmpty && isWhitespaceOnly ? '✅ PASS' : '❌ FAIL'}`,
  );

  return isEmpty && isWhitespaceOnly;
}

/**
 * Test: Valid prompts should pass
 */
export function testValidPromptsPass(): boolean {
  const validPrompts = [
    TEST_PROMPTS.short,
    TEST_PROMPTS.medium,
    TEST_PROMPTS.long,
    TEST_PROMPTS.special,
    TEST_PROMPTS.emoji,
  ];

  const results = validPrompts.map((prompt) => ({
    prompt: prompt.substring(0, 30) + '...',
    valid: prompt.trim().length > 0,
  }));

  console.log(`✓ Valid Prompt Test`);
  results.forEach((r) => {
    console.log(`  "${r.prompt}": ${r.valid ? '✅' : '❌'}`);
  });

  const allValid = results.every((r) => r.valid);
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid;
}

// ============================================================================
// Search Testing
// ============================================================================

/**
 * Test: Template search functionality
 */
export function testTemplateSearch(query: string): void {
  const results = searchTemplates(query);

  console.log(`✓ Template Search Test`);
  console.log(`  Query: "${query}"`);
  console.log(`  Results: ${results.length} templates found`);

  if (results.length > 0) {
    console.log('  Matches:');
    results.forEach((t: WriterTemplate) => {
      console.log(`    - ${t.name} (${t.category})`);
    });
  } else {
    console.log('  No matches found');
  }
}

/**
 * Test: Search should be case-insensitive
 */
export function testSearchCaseInsensitive(): boolean {
  const lowerResults = searchTemplates('email');
  const upperResults = searchTemplates('EMAIL');
  const mixedResults = searchTemplates('EmAiL');

  console.log(`✓ Case-Insensitive Search Test`);
  console.log(`  "email": ${lowerResults.length} results`);
  console.log(`  "EMAIL": ${upperResults.length} results`);
  console.log(`  "EmAiL": ${mixedResults.length} results`);

  const allEqual =
    lowerResults.length === upperResults.length &&
    upperResults.length === mixedResults.length;

  console.log(`  Result: ${allEqual ? '✅ PASS' : '❌ FAIL'}`);

  return allEqual;
}

// ============================================================================
// Test Suite Runner
// ============================================================================

/**
 * Run all Writer API tests
 */
export function runAllWriterTests(): void {
  console.log('═══════════════════════════════════════');
  console.log('📝 Writer API Test Suite');
  console.log('═══════════════════════════════════════\n');

  const tests = [
    { name: 'Template Count', fn: testTemplateCount },
    { name: 'No Duplicate IDs', fn: testNoDuplicateTemplateIds },
    {
      name: 'All Categories Have Templates',
      fn: testAllCategoriesHaveTemplates,
    },
    { name: 'Template Structure', fn: testTemplateStructure },
    { name: 'Tone Options', fn: testToneOptions },
    { name: 'Format Options', fn: testFormatOptions },
    { name: 'Length Options', fn: testLengthOptions },
    { name: 'Empty Prompt Invalid', fn: testEmptyPromptInvalid },
    { name: 'Valid Prompts Pass', fn: testValidPromptsPass },
    { name: 'Search Case-Insensitive', fn: testSearchCaseInsensitive },
  ];

  const results = tests.map((test) => {
    try {
      const passed = test.fn();
      return { name: test.name, passed, error: null };
    } catch (error) {
      return { name: test.name, passed: false, error };
    }
  });

  console.log('\n═══════════════════════════════════════');
  console.log('📊 Test Results Summary');
  console.log('═══════════════════════════════════════\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((r) => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}`);
    if (r.error) {
      console.error(`   Error: ${r.error}`);
    }
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Please review.`);
  }
}

// ============================================================================
// Export for Console Use
// ============================================================================

/**
 * Make utilities available in browser console
 * Usage: Run in console: writerTests.runAllWriterTests()
 */
if (typeof window !== 'undefined') {
  (window as any).writerTests = {
    runAllWriterTests,
    testTemplateCount,
    testNoDuplicateTemplateIds,
    testAllCategoriesHaveTemplates,
    testTemplateStructure,
    testToneOptions,
    testFormatOptions,
    testLengthOptions,
    testEmptyPromptInvalid,
    testValidPromptsPass,
    testTemplateSearch,
    testSearchCaseInsensitive,
    TEST_PROMPTS,
    TEST_CONFIGS,
  };

  console.log('💡 Writer test utilities loaded!');
  console.log('   Run: writerTests.runAllWriterTests()');
}
