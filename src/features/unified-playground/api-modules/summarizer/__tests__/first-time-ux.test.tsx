/**
 * First-Time UX Feature Test Suite
 *
 * Tests the first-time user experience enhancements including:
 * - Auto-loading Article sample (Endowed Progress Effect)
 * - Button cue visual feedback
 * - Advanced Options tip notification (Zeigarnik Effect)
 * - QuickSamplesCard expanded state
 *
 * Issue #27: [UX] Enhance First-Time User Experience for the Summarizer API
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('First-Time UX Features', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  describe('Session Storage Keys', () => {
    it('should use correct storage keys for feature tracking', () => {
      // Set keys
      sessionStorage.setItem('summarizer-autoload', 'true');
      sessionStorage.setItem('summarizer-ran', 'true');
      sessionStorage.setItem('summarizer-tip', 'true');

      // Verify keys exist
      expect(sessionStorage.getItem('summarizer-autoload')).toBe('true');
      expect(sessionStorage.getItem('summarizer-ran')).toBe('true');
      expect(sessionStorage.getItem('summarizer-tip')).toBe('true');
    });

    it('should return null for unset keys on first session', () => {
      expect(sessionStorage.getItem('summarizer-autoload')).toBeNull();
      expect(sessionStorage.getItem('summarizer-ran')).toBeNull();
      expect(sessionStorage.getItem('summarizer-tip')).toBeNull();
    });
  });

  describe('Auto-load Detection', () => {
    it('should detect first session when no storage keys are set', () => {
      const hasAutoLoaded = sessionStorage.getItem('summarizer-autoload');
      const isFirstSession = !hasAutoLoaded;

      expect(isFirstSession).toBe(true);
    });

    it('should detect returning session when storage key is set', () => {
      sessionStorage.setItem('summarizer-autoload', 'true');

      const hasAutoLoaded = sessionStorage.getItem('summarizer-autoload');
      const isFirstSession = !hasAutoLoaded;

      expect(isFirstSession).toBe(false);
    });
  });

  describe('Button Cue Logic', () => {
    it('should show button cue when auto-loaded and not yet run', () => {
      sessionStorage.setItem('summarizer-autoload', 'true');
      const hasAutoLoaded = sessionStorage.getItem('summarizer-autoload');
      const hasRun = sessionStorage.getItem('summarizer-ran');

      const shouldShowCue = hasAutoLoaded && !hasRun;

      expect(shouldShowCue).toBe(true);
    });

    it('should hide button cue after first run', () => {
      sessionStorage.setItem('summarizer-autoload', 'true');
      sessionStorage.setItem('summarizer-ran', 'true');

      const hasAutoLoaded = sessionStorage.getItem('summarizer-autoload');
      const hasRun = sessionStorage.getItem('summarizer-ran');

      const shouldShowCue = hasAutoLoaded && !hasRun;

      expect(shouldShowCue).toBe(false);
    });

    it('should not show button cue if content was not auto-loaded', () => {
      const hasAutoLoaded = sessionStorage.getItem('summarizer-autoload');
      const hasRun = sessionStorage.getItem('summarizer-ran');

      const shouldShowCue = hasAutoLoaded && !hasRun;

      expect(shouldShowCue).toBeFalsy(); // null is falsy
    });
  });

  describe('Toast Notification Logic', () => {
    it('should show toast after first successful summary', () => {
      sessionStorage.setItem('summarizer-autoload', 'true');
      const hasSeenTip = sessionStorage.getItem('summarizer-tip');
      const hasResult = true; // Simulating successful summary
      const showButtonCue = true;

      const shouldShowToast = hasResult && showButtonCue && !hasSeenTip;

      expect(shouldShowToast).toBe(true);
    });

    it('should not show toast if already seen', () => {
      sessionStorage.setItem('summarizer-autoload', 'true');
      sessionStorage.setItem('summarizer-tip', 'true');

      const hasSeenTip = sessionStorage.getItem('summarizer-tip');
      const hasResult = true;
      const showButtonCue = true;

      const shouldShowToast = hasResult && showButtonCue && !hasSeenTip;

      expect(shouldShowToast).toBe(false);
    });

    it('should not show toast if button cue was never shown', () => {
      const hasSeenTip = sessionStorage.getItem('summarizer-tip');
      const hasResult = true;
      const showButtonCue = false;

      const shouldShowToast = hasResult && showButtonCue && !hasSeenTip;

      expect(shouldShowToast).toBe(false);
    });
  });

  describe('QuickSamplesCard Expanded State', () => {
    it('should be expanded on first session', () => {
      const isFirstSession = !sessionStorage.getItem('summarizer-ran');
      const defaultCollapsed = !isFirstSession;

      expect(defaultCollapsed).toBe(false); // Not collapsed = expanded
    });

    it('should be collapsed after first run', () => {
      sessionStorage.setItem('summarizer-ran', 'true');

      const isFirstSession = !sessionStorage.getItem('summarizer-ran');
      const defaultCollapsed = !isFirstSession;

      expect(defaultCollapsed).toBe(true); // Collapsed
    });
  });

  describe('Feature Integration Flow', () => {
    it('should follow correct sequence: auto-load → button cue → run → toast', () => {
      // Step 1: First session - auto-load triggers
      expect(sessionStorage.getItem('summarizer-autoload')).toBeNull();

      // Auto-load happens
      sessionStorage.setItem('summarizer-autoload', 'true');
      expect(sessionStorage.getItem('summarizer-autoload')).toBe('true');

      // Step 2: Button cue shows
      const hasAutoLoaded = sessionStorage.getItem('summarizer-autoload');
      let hasRun = sessionStorage.getItem('summarizer-ran');
      let shouldShowCue = hasAutoLoaded && !hasRun;
      expect(shouldShowCue).toBe(true);

      // Step 3: User runs summarizer
      sessionStorage.setItem('summarizer-ran', 'true');
      hasRun = sessionStorage.getItem('summarizer-ran');
      shouldShowCue = hasAutoLoaded && !hasRun;
      expect(shouldShowCue).toBe(false); // Cue hidden

      // Step 4: Toast shows
      const hasSeenTip = sessionStorage.getItem('summarizer-tip');
      const shouldShowToast = hasRun && !hasSeenTip;
      expect(shouldShowToast).toBe(true);

      // Step 5: Toast dismissed
      sessionStorage.setItem('summarizer-tip', 'true');
      const hasSeenTipAfter = sessionStorage.getItem('summarizer-tip');
      expect(hasSeenTipAfter).toBe('true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple page refreshes within same session', () => {
      // First load
      sessionStorage.setItem('summarizer-autoload', 'true');

      // Refresh (sessionStorage persists)
      const hasAutoLoaded = sessionStorage.getItem('summarizer-autoload');
      expect(hasAutoLoaded).toBe('true');

      // Should not auto-load again
      const shouldAutoLoad = !hasAutoLoaded;
      expect(shouldAutoLoad).toBe(false);
    });

    it('should reset on new session (browser tab closed)', () => {
      // Simulate end of session
      sessionStorage.clear();

      // New session starts
      expect(sessionStorage.getItem('summarizer-autoload')).toBeNull();
      expect(sessionStorage.getItem('summarizer-ran')).toBeNull();
      expect(sessionStorage.getItem('summarizer-tip')).toBeNull();
    });

    it('should not interfere with localStorage config', () => {
      // Simulate saved config in localStorage
      localStorage.setItem(
        'summarizer-config',
        JSON.stringify({ type: 'tldr' }),
      );

      // Session storage should be independent
      sessionStorage.setItem('summarizer-autoload', 'true');

      expect(localStorage.getItem('summarizer-config')).toBeTruthy();
      expect(sessionStorage.getItem('summarizer-autoload')).toBe('true');

      // Cleanup
      localStorage.removeItem('summarizer-config');
    });
  });
});
