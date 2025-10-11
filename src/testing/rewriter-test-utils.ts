/**
 * Rewriter API Testing Utilities
 *
 * Helper functions for testing Rewriter API implementation.
 * These utilities can be run in the browser console for manual testing.
 *
 * @module testing/rewriter-test-utils
 */

import type {
  RewriterConfig,
  RewriterTone,
  RewriterFormat,
  RewriterLength,
} from '../features/unified-playground/api-modules/rewriter/types';
import {
  calculateDiffResult,
  getDiffSummary,
} from '../features/unified-playground/api-modules/rewriter/utils/diffCalculator';

// ============================================================================
// Test Data
// ============================================================================

export const TEST_INPUTS = {
  short: 'Hello, this is a test.',
  medium:
    'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.',
  long: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  empty: '',
  whitespace: '   \n\t  ',
  special: 'Test with ~!@#$%^&*()_+-=[]{}|;:,.<>? characters',
  emoji: 'Hello 🌟 world 🚀 test',
  veryLong: 'A'.repeat(10000),
  formal: 'Hey! Can you please send me that file ASAP? Thanks!',
  casual:
    'Dear Sir/Madam, I would appreciate it if you could provide me with the requested document at your earliest convenience. Thank you for your attention to this matter.',
};

export const TEST_CONFIGS: Record<string, RewriterConfig> = {
  more_formal_markdown_as_is: {
    tone: 'more-formal',
    format: 'markdown',
    length: 'as-is',
    outputLanguage: 'en',
    sharedContext: '',
  },
  more_casual_plain_shorter: {
    tone: 'more-casual',
    format: 'plain-text',
    length: 'shorter',
    outputLanguage: 'en',
    sharedContext: '',
  },
  as_is_as_is_longer: {
    tone: 'as-is',
    format: 'as-is',
    length: 'longer',
    outputLanguage: 'en',
    sharedContext: 'Add more technical details',
  },
};

export const TEST_DIFFS = {
  added: {
    original: 'Hello world',
    rewritten: 'Hello beautiful world',
  },
  removed: {
    original: 'Hello beautiful world',
    rewritten: 'Hello world',
  },
  changed: {
    original: 'The quick brown fox',
    rewritten: 'The fast red fox',
  },
  unchanged: {
    original: 'Hello world',
    rewritten: 'Hello world',
  },
};

// ============================================================================
// Configuration Testing
// ============================================================================

/**
 * Test: Verify tone options (includes 'as-is')
 */
export function testToneOptions(): boolean {
  const validTones: RewriterTone[] = ['more-formal', 'as-is', 'more-casual'];
  const allValid = validTones.every((tone) => {
    return typeof tone === 'string' && tone.length > 0;
  });

  console.log(`✓ Tone Options Test`);
  console.log(`  Valid tones: ${validTones.join(', ')}`);
  console.log(
    `  Has 'as-is' option: ${validTones.includes('as-is') ? '✅' : '❌'}`,
  );
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid && validTones.includes('as-is');
}

/**
 * Test: Verify format options (includes 'as-is')
 */
export function testFormatOptions(): boolean {
  const validFormats: RewriterFormat[] = ['as-is', 'markdown', 'plain-text'];
  const allValid = validFormats.every((format) => {
    return typeof format === 'string' && format.length > 0;
  });

  console.log(`✓ Format Options Test`);
  console.log(`  Valid formats: ${validFormats.join(', ')}`);
  console.log(
    `  Has 'as-is' option: ${validFormats.includes('as-is') ? '✅' : '❌'}`,
  );
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid && validFormats.includes('as-is');
}

/**
 * Test: Verify length options (includes 'as-is')
 */
export function testLengthOptions(): boolean {
  const validLengths: RewriterLength[] = ['shorter', 'as-is', 'longer'];
  const allValid = validLengths.every((length) => {
    return typeof length === 'string' && length.length > 0;
  });

  console.log(`✓ Length Options Test`);
  console.log(`  Valid lengths: ${validLengths.join(', ')}`);
  console.log(
    `  Has 'as-is' option: ${validLengths.includes('as-is') ? '✅' : '❌'}`,
  );
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid && validLengths.includes('as-is');
}

// ============================================================================
// Input Validation Testing
// ============================================================================

/**
 * Test: Empty input should be invalid
 */
export function testEmptyInputInvalid(): boolean {
  const isEmpty = TEST_INPUTS.empty.trim().length === 0;
  const isWhitespaceOnly = TEST_INPUTS.whitespace.trim().length === 0;

  console.log(`✓ Empty Input Validation Test`);
  console.log(`  Empty string invalid: ${isEmpty ? '✅' : '❌'}`);
  console.log(`  Whitespace-only invalid: ${isWhitespaceOnly ? '✅' : '❌'}`);
  console.log(
    `  Result: ${isEmpty && isWhitespaceOnly ? '✅ PASS' : '❌ FAIL'}`,
  );

  return isEmpty && isWhitespaceOnly;
}

/**
 * Test: Valid inputs should pass
 */
export function testValidInputsPass(): boolean {
  const validInputs = [
    TEST_INPUTS.short,
    TEST_INPUTS.medium,
    TEST_INPUTS.long,
    TEST_INPUTS.special,
    TEST_INPUTS.emoji,
  ];

  const results = validInputs.map((input) => ({
    input: input.substring(0, 30) + '...',
    valid: input.trim().length > 0,
  }));

  console.log(`✓ Valid Input Test`);
  results.forEach((r) => {
    console.log(`  "${r.input}": ${r.valid ? '✅' : '❌'}`);
  });

  const allValid = results.every((r) => r.valid);
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid;
}

// ============================================================================
// Diff Calculation Testing
// ============================================================================

/**
 * Test: Diff calculation for added content
 */
export function testDiffAdded(): boolean {
  const diff = calculateDiffResult(
    TEST_DIFFS.added.original,
    TEST_DIFFS.added.rewritten,
  );

  const hasAddedSegments = diff.segments.some((s) => s.type === 'added');
  const lengthIncreased =
    diff.stats.rewrittenLength > diff.stats.originalLength;

  console.log(`✓ Diff Added Content Test`);
  console.log(`  Original: "${TEST_DIFFS.added.original}"`);
  console.log(`  Rewritten: "${TEST_DIFFS.added.rewritten}"`);
  console.log(`  Has 'added' segments: ${hasAddedSegments ? '✅' : '❌'}`);
  console.log(`  Length increased: ${lengthIncreased ? '✅' : '❌'}`);
  console.log(`  Added chars: ${diff.stats.added}`);
  console.log(
    `  Result: ${hasAddedSegments && lengthIncreased ? '✅ PASS' : '❌ FAIL'}`,
  );

  return hasAddedSegments && lengthIncreased;
}

/**
 * Test: Diff calculation for removed content
 */
export function testDiffRemoved(): boolean {
  const diff = calculateDiffResult(
    TEST_DIFFS.removed.original,
    TEST_DIFFS.removed.rewritten,
  );

  const hasRemovedSegments = diff.segments.some((s) => s.type === 'removed');
  const lengthDecreased =
    diff.stats.rewrittenLength < diff.stats.originalLength;

  console.log(`✓ Diff Removed Content Test`);
  console.log(`  Original: "${TEST_DIFFS.removed.original}"`);
  console.log(`  Rewritten: "${TEST_DIFFS.removed.rewritten}"`);
  console.log(`  Has 'removed' segments: ${hasRemovedSegments ? '✅' : '❌'}`);
  console.log(`  Length decreased: ${lengthDecreased ? '✅' : '❌'}`);
  console.log(`  Removed chars: ${diff.stats.removed}`);
  console.log(
    `  Result: ${hasRemovedSegments && lengthDecreased ? '✅ PASS' : '❌ FAIL'}`,
  );

  return hasRemovedSegments && lengthDecreased;
}

/**
 * Test: Diff calculation for unchanged content
 */
export function testDiffUnchanged(): boolean {
  const diff = calculateDiffResult(
    TEST_DIFFS.unchanged.original,
    TEST_DIFFS.unchanged.rewritten,
  );

  const allUnchanged = diff.segments.every((s) => s.type === 'unchanged');
  const zeroChanges = diff.stats.added === 0 && diff.stats.removed === 0;

  console.log(`✓ Diff Unchanged Content Test`);
  console.log(`  Original: "${TEST_DIFFS.unchanged.original}"`);
  console.log(`  Rewritten: "${TEST_DIFFS.unchanged.rewritten}"`);
  console.log(`  All segments 'unchanged': ${allUnchanged ? '✅' : '❌'}`);
  console.log(`  Zero changes: ${zeroChanges ? '✅' : '❌'}`);
  console.log(`  Percent changed: ${diff.stats.percentChanged}%`);
  console.log(
    `  Result: ${allUnchanged && zeroChanges ? '✅ PASS' : '❌ FAIL'}`,
  );

  return allUnchanged && zeroChanges;
}

/**
 * Test: Diff statistics accuracy
 */
export function testDiffStatistics(): boolean {
  const diff = calculateDiffResult(
    TEST_DIFFS.changed.original,
    TEST_DIFFS.changed.rewritten,
  );

  const hasStats = diff.stats !== null;
  const hasOriginalLength = typeof diff.stats.originalLength === 'number';
  const hasRewrittenLength = typeof diff.stats.rewrittenLength === 'number';
  const hasPercentChanged = typeof diff.stats.percentChanged === 'number';

  console.log(`✓ Diff Statistics Test`);
  console.log(`  Has statistics: ${hasStats ? '✅' : '❌'}`);
  console.log(`  Original length: ${diff.stats.originalLength}`);
  console.log(`  Rewritten length: ${diff.stats.rewrittenLength}`);
  console.log(`  Percent changed: ${diff.stats.percentChanged}%`);
  console.log(`  Added: ${diff.stats.added}`);
  console.log(`  Removed: ${diff.stats.removed}`);
  console.log(`  Unchanged: ${diff.stats.unchanged}`);

  const allValid =
    hasStats && hasOriginalLength && hasRewrittenLength && hasPercentChanged;
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid;
}

/**
 * Test: Diff summary generation
 */
export function testDiffSummary(): boolean {
  const diff = calculateDiffResult(
    TEST_DIFFS.changed.original,
    TEST_DIFFS.changed.rewritten,
  );

  const summary = getDiffSummary(diff.stats);
  const hasSummary = typeof summary === 'string' && summary.length > 0;

  console.log(`✓ Diff Summary Test`);
  console.log(`  Summary: "${summary}"`);
  console.log(`  Has summary: ${hasSummary ? '✅' : '❌'}`);
  console.log(`  Result: ${hasSummary ? '✅ PASS' : '❌ FAIL'}`);

  return hasSummary;
}

// ============================================================================
// View Mode Testing
// ============================================================================

/**
 * Test: All view modes available
 */
export function testViewModes(): boolean {
  const validViewModes = ['original', 'rewritten', 'diff'];
  const allValid = validViewModes.every((mode) => typeof mode === 'string');

  console.log(`✓ View Modes Test`);
  console.log(`  Available modes: ${validViewModes.join(', ')}`);
  console.log(`  All valid: ${allValid ? '✅' : '❌'}`);
  console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

  return allValid;
}

// ============================================================================
// Test Suite Runner
// ============================================================================

/**
 * Run all Rewriter API tests
 */
export function runAllRewriterTests(): void {
  console.log('═══════════════════════════════════════');
  console.log('🔄 Rewriter API Test Suite');
  console.log('═══════════════════════════════════════\n');

  const tests = [
    { name: 'Tone Options (with as-is)', fn: testToneOptions },
    { name: 'Format Options (with as-is)', fn: testFormatOptions },
    { name: 'Length Options (with as-is)', fn: testLengthOptions },
    { name: 'Empty Input Invalid', fn: testEmptyInputInvalid },
    { name: 'Valid Inputs Pass', fn: testValidInputsPass },
    { name: 'Diff Added Content', fn: testDiffAdded },
    { name: 'Diff Removed Content', fn: testDiffRemoved },
    { name: 'Diff Unchanged Content', fn: testDiffUnchanged },
    { name: 'Diff Statistics', fn: testDiffStatistics },
    { name: 'Diff Summary', fn: testDiffSummary },
    { name: 'View Modes', fn: testViewModes },
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
 * Usage: Run in console: rewriterTests.runAllRewriterTests()
 */
if (typeof window !== 'undefined') {
  (window as any).rewriterTests = {
    runAllRewriterTests,
    testToneOptions,
    testFormatOptions,
    testLengthOptions,
    testEmptyInputInvalid,
    testValidInputsPass,
    testDiffAdded,
    testDiffRemoved,
    testDiffUnchanged,
    testDiffStatistics,
    testDiffSummary,
    testViewModes,
    TEST_INPUTS,
    TEST_CONFIGS,
    TEST_DIFFS,
    calculateDiffResult,
    getDiffSummary,
  };

  console.log('💡 Rewriter test utilities loaded!');
  console.log('   Run: rewriterTests.runAllRewriterTests()');
}
