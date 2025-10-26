/**
 * Haptic Feedback Utility
 *
 * Provides tactile feedback using the Vibration API (mobile devices)
 * Gracefully degrades on unsupported browsers
 *
 * @module utils/hapticFeedback
 */

// ============================================================================
// Types
// ============================================================================

type VibrationPattern = number | number[];

// ============================================================================
// Feature Detection
// ============================================================================

/**
 * Check if the Vibration API is supported
 */
export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

// ============================================================================
// Vibration Patterns
// ============================================================================

/**
 * Pre-defined vibration patterns for common interactions
 */
export const HAPTIC_PATTERNS = {
  /**
   * Success: Short pulse
   * Use for: Successful actions, copy, save
   */
  success: [50] as const,

  /**
   * Error: Two quick pulses
   * Use for: Errors, validation failures
   */
  error: [100, 50, 100] as const,

  /**
   * Warning: Single medium pulse
   * Use for: Warnings, confirmations needed
   */
  warning: [100] as const,

  /**
   * Selection: Very short pulse
   * Use for: Selecting items, toggling
   */
  selection: [25] as const,

  /**
   * Impact: Three quick pulses
   * Use for: Button presses, important actions
   */
  impact: [50, 30, 50] as const,

  /**
   * Notification: Long-short-long pattern
   * Use for: New notifications, alerts
   */
  notification: [100, 50, 50, 50, 100] as const,

  /**
   * Heavy: Strong single pulse
   * Use for: Major actions, deletions
   */
  heavy: [150] as const,

  /**
   * Light: Gentle pulse
   * Use for: Subtle feedback, hover effects
   */
  light: [20] as const,
} as const;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Trigger a vibration pattern
 *
 * @param pattern - Vibration pattern (number or array of numbers)
 * @returns true if vibration was triggered, false if unsupported
 *
 * @example
 * ```ts
 * vibrate(50); // Single 50ms vibration
 * vibrate([100, 50, 100]); // Pulse-pause-pulse pattern
 * vibrate(HAPTIC_PATTERNS.success); // Use predefined pattern
 * ```
 */
export function vibrate(pattern: VibrationPattern): boolean {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch (error) {
    console.warn('Vibration API error:', error);
    return false;
  }
}

/**
 * Cancel any ongoing vibration
 *
 * @returns true if cancellation was successful, false if unsupported
 */
export function cancelVibration(): boolean {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    return navigator.vibrate(0);
  } catch (error) {
    console.warn('Vibration cancellation error:', error);
    return false;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Success haptic feedback
 * Short, satisfying pulse for successful actions
 */
export function vibrateSuccess(): boolean {
  return vibrate([...HAPTIC_PATTERNS.success]);
}

/**
 * Error haptic feedback
 * Two quick pulses to indicate an error
 */
export function vibrateError(): boolean {
  return vibrate([...HAPTIC_PATTERNS.error]);
}

/**
 * Warning haptic feedback
 * Medium pulse for warnings
 */
export function vibrateWarning(): boolean {
  return vibrate([...HAPTIC_PATTERNS.warning]);
}

/**
 * Selection haptic feedback
 * Very short pulse for selections
 */
export function vibrateSelection(): boolean {
  return vibrate([...HAPTIC_PATTERNS.selection]);
}

/**
 * Impact haptic feedback
 * Three quick pulses for impactful actions
 */
export function vibrateImpact(): boolean {
  return vibrate([...HAPTIC_PATTERNS.impact]);
}

/**
 * Notification haptic feedback
 * Long-short-long pattern for notifications
 */
export function vibrateNotification(): boolean {
  return vibrate([...HAPTIC_PATTERNS.notification]);
}

/**
 * Heavy haptic feedback
 * Strong pulse for major actions
 */
export function vibrateHeavy(): boolean {
  return vibrate([...HAPTIC_PATTERNS.heavy]);
}

/**
 * Light haptic feedback
 * Gentle pulse for subtle feedback
 */
export function vibrateLight(): boolean {
  return vibrate([...HAPTIC_PATTERNS.light]);
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for haptic feedback
 * Provides a simple interface for using haptics in components
 *
 * @returns Object with vibration functions
 *
 * @example
 * ```tsx
 * function MyButton() {
 *   const { vibrateSuccess, isSupported } = useHapticFeedback();
 *
 *   const handleClick = () => {
 *     // Do something
 *     vibrateSuccess(); // Provide haptic feedback
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useHapticFeedback() {
  return {
    vibrate,
    vibrateSuccess,
    vibrateError,
    vibrateWarning,
    vibrateSelection,
    vibrateImpact,
    vibrateNotification,
    vibrateHeavy,
    vibrateLight,
    cancelVibration,
    isSupported: isVibrationSupported(),
    patterns: HAPTIC_PATTERNS,
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  vibrate,
  vibrateSuccess,
  vibrateError,
  vibrateWarning,
  vibrateSelection,
  vibrateImpact,
  vibrateNotification,
  vibrateHeavy,
  vibrateLight,
  cancelVibration,
  isVibrationSupported,
  HAPTIC_PATTERNS,
  useHapticFeedback,
};
