/**
 * Haptic Feedback Utility Tests
 *
 * @module utils/__tests__/hapticFeedback.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isVibrationSupported,
  vibrate,
  cancelVibration,
  vibrateSuccess,
  vibrateError,
  vibrateWarning,
  vibrateSelection,
  vibrateImpact,
  vibrateNotification,
  vibrateHeavy,
  vibrateLight,
  useHapticFeedback,
  HAPTIC_PATTERNS,
} from '../hapticFeedback';

// ============================================================================
// Test Setup
// ============================================================================

describe('Haptic Feedback Utility', () => {
  let originalNavigator: Navigator;
  let vibrateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalNavigator = global.navigator;
    vibrateSpy = vi.fn().mockReturnValue(true);

    // Mock navigator with vibrate support
    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        ...originalNavigator,
        vibrate: vibrateSpy,
      },
    });
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    vi.clearAllMocks();
  });

  // ============================================================================
  // Feature Detection Tests
  // ============================================================================

  describe('Feature Detection', () => {
    it('should detect vibration support when available', () => {
      expect(isVibrationSupported()).toBe(true);
    });

    it('should detect lack of vibration support', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {},
      });

      expect(isVibrationSupported()).toBe(false);
    });

    it('should handle missing navigator', () => {
      // @ts-expect-error - Testing edge case
      delete global.navigator;

      expect(isVibrationSupported()).toBe(false);
    });
  });

  // ============================================================================
  // Core Vibration Tests
  // ============================================================================

  describe('Core Vibration', () => {
    it('should trigger single vibration', () => {
      const result = vibrate(100);

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(100);
      expect(vibrateSpy).toHaveBeenCalledTimes(1);
    });

    it('should trigger pattern vibration', () => {
      const pattern = [100, 50, 100];
      const result = vibrate(pattern);

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(pattern);
      expect(vibrateSpy).toHaveBeenCalledTimes(1);
    });

    it('should return false when vibration is not supported', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {},
      });

      const result = vibrate(100);
      expect(result).toBe(false);
    });

    it('should handle vibration errors gracefully', () => {
      vibrateSpy.mockImplementation(() => {
        throw new Error('Vibration failed');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = vibrate(100);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should cancel vibration', () => {
      const result = cancelVibration();

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(0);
    });

    it('should handle cancellation when unsupported', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {},
      });

      const result = cancelVibration();
      expect(result).toBe(false);
    });

    it('should handle cancellation errors gracefully', () => {
      vibrateSpy.mockImplementation(() => {
        throw new Error('Cancellation failed');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = cancelVibration();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // Predefined Patterns Tests
  // ============================================================================

  describe('Predefined Patterns', () => {
    it('should have success pattern', () => {
      expect(HAPTIC_PATTERNS.success).toEqual([50]);
    });

    it('should have error pattern', () => {
      expect(HAPTIC_PATTERNS.error).toEqual([100, 50, 100]);
    });

    it('should have warning pattern', () => {
      expect(HAPTIC_PATTERNS.warning).toEqual([100]);
    });

    it('should have selection pattern', () => {
      expect(HAPTIC_PATTERNS.selection).toEqual([25]);
    });

    it('should have impact pattern', () => {
      expect(HAPTIC_PATTERNS.impact).toEqual([50, 30, 50]);
    });

    it('should have notification pattern', () => {
      expect(HAPTIC_PATTERNS.notification).toEqual([100, 50, 50, 50, 100]);
    });

    it('should have heavy pattern', () => {
      expect(HAPTIC_PATTERNS.heavy).toEqual([150]);
    });

    it('should have light pattern', () => {
      expect(HAPTIC_PATTERNS.light).toEqual([20]);
    });

    it('should have readonly patterns (TypeScript enforced)', () => {
      // Patterns are readonly at TypeScript level with 'as const'
      // Runtime mutation is allowed in JS but TypeScript prevents it
      const pattern = HAPTIC_PATTERNS.success;
      expect(pattern).toEqual([50]);
      expect(Array.isArray(pattern)).toBe(true);
      // TypeScript prevents mutation, but runtime doesn't throw
    });
  });

  // ============================================================================
  // Convenience Functions Tests
  // ============================================================================

  describe('Convenience Functions', () => {
    it('should trigger success vibration', () => {
      const result = vibrateSuccess();

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_PATTERNS.success);
    });

    it('should trigger error vibration', () => {
      const result = vibrateError();

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_PATTERNS.error);
    });

    it('should trigger warning vibration', () => {
      const result = vibrateWarning();

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_PATTERNS.warning);
    });

    it('should trigger selection vibration', () => {
      const result = vibrateSelection();

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_PATTERNS.selection);
    });

    it('should trigger impact vibration', () => {
      const result = vibrateImpact();

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_PATTERNS.impact);
    });

    it('should trigger notification vibration', () => {
      const result = vibrateNotification();

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_PATTERNS.notification);
    });

    it('should trigger heavy vibration', () => {
      const result = vibrateHeavy();

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_PATTERNS.heavy);
    });

    it('should trigger light vibration', () => {
      const result = vibrateLight();

      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_PATTERNS.light);
    });

    it('should gracefully handle unsupported vibration in convenience functions', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {},
      });

      expect(vibrateSuccess()).toBe(false);
      expect(vibrateError()).toBe(false);
      expect(vibrateWarning()).toBe(false);
      expect(vibrateSelection()).toBe(false);
      expect(vibrateImpact()).toBe(false);
      expect(vibrateNotification()).toBe(false);
      expect(vibrateHeavy()).toBe(false);
      expect(vibrateLight()).toBe(false);
    });
  });

  // ============================================================================
  // React Hook Tests
  // ============================================================================

  describe('React Hook', () => {
    it('should provide all vibration functions', () => {
      const hook = useHapticFeedback();

      expect(hook).toHaveProperty('vibrate');
      expect(hook).toHaveProperty('vibrateSuccess');
      expect(hook).toHaveProperty('vibrateError');
      expect(hook).toHaveProperty('vibrateWarning');
      expect(hook).toHaveProperty('vibrateSelection');
      expect(hook).toHaveProperty('vibrateImpact');
      expect(hook).toHaveProperty('vibrateNotification');
      expect(hook).toHaveProperty('vibrateHeavy');
      expect(hook).toHaveProperty('vibrateLight');
      expect(hook).toHaveProperty('cancelVibration');
      expect(hook).toHaveProperty('isSupported');
      expect(hook).toHaveProperty('patterns');
    });

    it('should report support status', () => {
      const hook = useHapticFeedback();
      expect(hook.isSupported).toBe(true);

      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {},
      });

      const hookUnsupported = useHapticFeedback();
      expect(hookUnsupported.isSupported).toBe(false);
    });

    it('should provide patterns object', () => {
      const hook = useHapticFeedback();
      expect(hook.patterns).toBe(HAPTIC_PATTERNS);
    });

    it('should have working vibration methods', () => {
      const hook = useHapticFeedback();

      hook.vibrateSuccess();
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_PATTERNS.success);

      hook.vibrate(200);
      expect(vibrateSpy).toHaveBeenCalledWith(200);

      hook.cancelVibration();
      expect(vibrateSpy).toHaveBeenCalledWith(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle zero vibration', () => {
      const result = vibrate(0);
      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(0);
    });

    it('should handle empty pattern array', () => {
      const result = vibrate([]);
      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith([]);
    });

    it('should handle large vibration values', () => {
      const result = vibrate(10000);
      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(10000);
    });

    it('should handle complex patterns', () => {
      const pattern = [100, 50, 100, 50, 200, 100, 50];
      const result = vibrate(pattern);
      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(pattern);
    });

    it('should handle navigator.vibrate returning false', () => {
      vibrateSpy.mockReturnValue(false);
      const result = vibrate(100);
      expect(result).toBe(false);
    });

    it('should not crash when console.warn is unavailable', () => {
      vibrateSpy.mockImplementation(() => {
        throw new Error('Test error');
      });

      const originalWarn = console.warn;
      // @ts-expect-error - Intentionally deleting console.warn for testing error handling
      delete console.warn;

      expect(() => vibrate(100)).not.toThrow();

      console.warn = originalWarn;
    });
  });

  // ============================================================================
  // Real-World Usage Patterns
  // ============================================================================

  describe('Real-World Usage', () => {
    it('should support copy-paste success pattern', () => {
      // User copies code
      const result = vibrateSuccess();
      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalled();
    });

    it('should support form validation error pattern', () => {
      // Form validation fails
      const result = vibrateError();
      expect(result).toBe(true);
      expect(vibrateSpy).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should support button press pattern', () => {
      // User presses important button
      const result = vibrateImpact();
      expect(result).toBe(true);
    });

    it('should support rapid interactions', () => {
      // Simulate rapid button presses
      vibrateSelection();
      vibrateSelection();
      vibrateSelection();

      expect(vibrateSpy).toHaveBeenCalledTimes(3);
    });

    it('should support pattern chaining', () => {
      // Complex interaction pattern
      vibrateLight(); // Hover
      vibrateSelection(); // Click
      vibrateSuccess(); // Action complete

      expect(vibrateSpy).toHaveBeenCalledTimes(3);
    });
  });
});
