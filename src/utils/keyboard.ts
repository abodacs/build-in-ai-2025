/**
 * Keyboard Utility Functions
 *
 * Helpers for keyboard shortcuts and OS detection
 *
 * @module utils/keyboard
 */

// ============================================================================
// OS Detection
// ============================================================================

/**
 * Detect the user's operating system
 */
export function detectOS(): 'mac' | 'windows' | 'linux' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || '';

  if (
    platform.includes('mac') ||
    userAgent.includes('mac') ||
    platform.includes('darwin')
  ) {
    return 'mac';
  }

  if (platform.includes('win') || userAgent.includes('win')) {
    return 'windows';
  }

  if (
    platform.includes('linux') ||
    userAgent.includes('linux') ||
    userAgent.includes('x11')
  ) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Check if user is on macOS
 */
export function isMac(): boolean {
  return detectOS() === 'mac';
}

/**
 * Check if user is on Windows
 */
export function isWindows(): boolean {
  return detectOS() === 'windows';
}

/**
 * Check if user is on Linux
 */
export function isLinux(): boolean {
  return detectOS() === 'linux';
}

// ============================================================================
// Keyboard Shortcut Formatting
// ============================================================================

/**
 * Get the modifier key symbol based on OS
 * - macOS: ⌘ (Command)
 * - Windows/Linux: Ctrl
 */
export function getModifierKey(format: 'symbol' | 'text' = 'symbol'): string {
  const os = detectOS();

  if (format === 'symbol') {
    return os === 'mac' ? '⌘' : 'Ctrl';
  }

  return os === 'mac' ? 'Cmd' : 'Ctrl';
}

/**
 * Get the Option/Alt key symbol based on OS
 */
export function getOptionKey(format: 'symbol' | 'text' = 'symbol'): string {
  const os = detectOS();

  if (format === 'symbol') {
    return os === 'mac' ? '⌥' : 'Alt';
  }

  return os === 'mac' ? 'Option' : 'Alt';
}

/**
 * Get the Shift key symbol based on OS
 * Windows/Linux use text even in symbol mode for better readability
 */
export function getShiftKey(format: 'symbol' | 'text' = 'symbol'): string {
  const os = detectOS();

  // Windows/Linux always use "Shift" for clarity
  if (os === 'windows' || os === 'linux') {
    return 'Shift';
  }

  // macOS uses symbol in symbol mode
  if (format === 'symbol') {
    return '⇧';
  }
  return 'Shift';
}

/**
 * Format a keyboard shortcut for display based on OS
 *
 * @example
 * formatShortcut('K') // macOS: "⌘K", Windows: "Ctrl+K"
 * formatShortcut('K', { shift: true }) // macOS: "⇧⌘K", Windows: "Shift+Ctrl+K"
 */
export function formatShortcut(
  key: string,
  options: {
    shift?: boolean;
    alt?: boolean;
    format?: 'symbol' | 'text';
    separator?: string;
  } = {},
): string {
  const { shift = false, alt = false, format = 'symbol', separator } = options;
  const os = detectOS();
  const isMacOS = os === 'mac';

  // Default separators
  const sep = separator ?? (isMacOS && format === 'symbol' ? '' : '+');

  const parts: string[] = [];

  // macOS: Shift + Option + Command + Key
  // Windows/Linux: Ctrl + Shift + Alt + Key

  if (isMacOS) {
    if (shift) parts.push(getShiftKey(format));
    if (alt) parts.push(getOptionKey(format));
    parts.push(getModifierKey(format));
    parts.push(key.toUpperCase());
  } else {
    parts.push(getModifierKey(format));
    if (shift) parts.push(getShiftKey(format));
    if (alt) parts.push(getOptionKey(format));
    parts.push(key.toUpperCase());
  }

  return parts.join(sep);
}

// ============================================================================
// Keyboard Event Helpers
// ============================================================================

/**
 * Check if the modifier key (Cmd on Mac, Ctrl on Windows/Linux) is pressed
 */
export function isModifierKeyPressed(event: KeyboardEvent): boolean {
  const os = detectOS();
  return os === 'mac' ? event.metaKey : event.ctrlKey;
}

/**
 * Check if a specific keyboard shortcut matches the event
 *
 * @example
 * isShortcut(event, 'K') // Cmd+K on Mac, Ctrl+K on Windows
 * isShortcut(event, 'K', { shift: true }) // Cmd+Shift+K or Ctrl+Shift+K
 */
export function isShortcut(
  event: KeyboardEvent,
  key: string,
  options: {
    shift?: boolean;
    alt?: boolean;
  } = {},
): boolean {
  const { shift = false, alt = false } = options;

  const keyMatch = event.key.toUpperCase() === key.toUpperCase();
  const modifierMatch = isModifierKeyPressed(event);
  const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
  const altMatch = alt ? event.altKey : !event.altKey;

  return keyMatch && modifierMatch && shiftMatch && altMatch;
}

// ============================================================================
// Common Shortcuts
// ============================================================================

/**
 * Pre-formatted common shortcuts
 */
export const SHORTCUTS = {
  /**
   * View Code: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
   */
  viewCode: () => formatShortcut('K'),

  /**
   * Download: Cmd+D (Mac) or Ctrl+D (Windows/Linux)
   */
  download: () => formatShortcut('D'),

  /**
   * Download All: Cmd+Shift+D (Mac) or Ctrl+Shift+D (Windows/Linux)
   */
  downloadAll: () => formatShortcut('D', { shift: true }),

  /**
   * Copy: Cmd+C (Mac) or Ctrl+C (Windows/Linux)
   */
  copy: () => formatShortcut('C'),

  /**
   * Find: Cmd+F (Mac) or Ctrl+F (Windows/Linux)
   */
  find: () => formatShortcut('F'),

  /**
   * Close: Escape
   */
  close: () => 'Esc',

  /**
   * Next Tab: Tab
   */
  nextTab: () => 'Tab',

  /**
   * Previous Tab: Shift+Tab
   */
  prevTab: () => formatShortcut('Tab', { shift: true }),
} as const;

// ============================================================================
// Export
// ============================================================================

export default {
  detectOS,
  isMac,
  isWindows,
  isLinux,
  getModifierKey,
  getOptionKey,
  getShiftKey,
  formatShortcut,
  isModifierKeyPressed,
  isShortcut,
  SHORTCUTS,
};
