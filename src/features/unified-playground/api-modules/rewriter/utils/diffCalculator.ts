/**
 * Diff Calculator
 *
 * Utility for calculating text differences between original and rewritten text.
 * Provides simple word-level diff for visualization.
 *
 * @module rewriter/utils/diffCalculator
 */

import type { DiffSegment, DiffResult } from '../types';

// ============================================================================
// Diff Calculation
// ============================================================================

/**
 * Calculate simple word-level diff
 *
 * This is a simplified diff algorithm for basic visualization.
 * For production, consider using a library like diff-match-patch.
 *
 * @param original - Original text
 * @param rewritten - Rewritten text
 * @returns Diff segments
 */
export function calculateDiff(
  original: string,
  rewritten: string,
): DiffSegment[] {
  // Split into words
  const originalWords = original.split(/(\s+)/);
  const rewrittenWords = rewritten.split(/(\s+)/);

  const segments: DiffSegment[] = [];

  // Simple diff: just compare word by word
  // This is a naive approach - a proper diff would use LCS or similar
  const maxLen = Math.max(originalWords.length, rewrittenWords.length);

  for (let i = 0; i < maxLen; i++) {
    const origWord = originalWords[i];
    const rewrWord = rewrittenWords[i];

    if (origWord === rewrWord) {
      // Unchanged
      if (origWord) {
        segments.push({
          type: 'unchanged',
          value: origWord,
        });
      }
    } else {
      // Changed
      if (origWord && !rewrWord) {
        // Removed
        segments.push({
          type: 'removed',
          value: origWord,
        });
      } else if (!origWord && rewrWord) {
        // Added
        segments.push({
          type: 'added',
          value: rewrWord,
        });
      } else {
        // Both exist but different - mark as removed then added
        if (origWord) {
          segments.push({
            type: 'removed',
            value: origWord,
          });
        }
        if (rewrWord) {
          segments.push({
            type: 'added',
            value: rewrWord,
          });
        }
      }
    }
  }

  return segments;
}

/**
 * Calculate diff result with statistics
 *
 * @param original - Original text
 * @param rewritten - Rewritten text
 * @returns Complete diff result with stats
 */
export function calculateDiffResult(
  original: string,
  rewritten: string,
): DiffResult {
  const segments = calculateDiff(original, rewritten);

  // Calculate statistics
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const segment of segments) {
    const len = segment.value.length;

    if (segment.type === 'added') {
      added += len;
    } else if (segment.type === 'removed') {
      removed += len;
    } else {
      unchanged += len;
    }
  }

  const originalLength = original.length;
  const rewrittenLength = rewritten.length;
  const totalChanges = added + removed;
  const percentChanged =
    originalLength > 0 ? (totalChanges / (originalLength * 2)) * 100 : 0;

  return {
    original,
    rewritten,
    segments,
    stats: {
      added,
      removed,
      unchanged,
      originalLength,
      rewrittenLength,
      percentChanged: Math.round(percentChanged * 10) / 10,
    },
  };
}

/**
 * Merge consecutive segments of the same type
 *
 * @param segments - Diff segments
 * @returns Merged segments
 */
export function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) {
    return [];
  }

  const merged: DiffSegment[] = [];
  let current = segments[0];

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];

    if (segment.type === current.type) {
      // Merge with current
      current = {
        type: current.type,
        value: current.value + segment.value,
      };
    } else {
      // Push current and start new
      merged.push(current);
      current = segment;
    }
  }

  // Push last segment
  merged.push(current);

  return merged;
}

/**
 * Get diff summary text
 *
 * @param stats - Diff statistics
 * @returns Summary text
 */
export function getDiffSummary(stats: DiffResult['stats']): string {
  const { originalLength, rewrittenLength, percentChanged } = stats;

  const lengthChange = rewrittenLength - originalLength;
  const lengthChangeAbs = Math.abs(lengthChange);
  const lengthChangePercent = Math.round(
    (lengthChangeAbs / originalLength) * 100,
  );

  if (lengthChange > 0) {
    return `Expanded by ${lengthChangeAbs} characters (${lengthChangePercent}% longer). ${Math.round(percentChanged)}% of content modified.`;
  } else if (lengthChange < 0) {
    return `Condensed by ${lengthChangeAbs} characters (${lengthChangePercent}% shorter). ${Math.round(percentChanged)}% of content modified.`;
  } else {
    return `Length unchanged. ${Math.round(percentChanged)}% of content modified.`;
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculateDiff,
  calculateDiffResult,
  mergeSegments,
  getDiffSummary,
};
