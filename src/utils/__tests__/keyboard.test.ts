/**
 * Keyboard Utility Tests
 *
 * @module utils/__tests__/keyboard.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
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
} from '../keyboard';

// ============================================================================
// Test Setup
// ============================================================================

describe('Keyboard Utility', () => {
  let originalNavigator: Navigator;
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    originalNavigator = global.navigator;
    originalWindow = global.window;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.window = originalWindow;
  });

  // ============================================================================
  // OS Detection Tests
  // ============================================================================

  describe('OS Detection', () => {
    it('should detect macOS from userAgent', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          platform: 'MacIntel',
        },
      });

      expect(detectOS()).toBe('mac');
      expect(isMac()).toBe(true);
      expect(isWindows()).toBe(false);
      expect(isLinux()).toBe(false);
    });

    it('should detect Windows from userAgent', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          platform: 'Win32',
        },
      });

      expect(detectOS()).toBe('windows');
      expect(isWindows()).toBe(true);
      expect(isMac()).toBe(false);
      expect(isLinux()).toBe(false);
    });

    it('should detect Linux from userAgent', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
          platform: 'Linux x86_64',
        },
      });

      expect(detectOS()).toBe('linux');
      expect(isLinux()).toBe(true);
      expect(isMac()).toBe(false);
      expect(isWindows()).toBe(false);
    });

    it('should return unknown for unsupported OS', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Unknown Browser',
          platform: '',
        },
      });

      expect(detectOS()).toBe('unknown');
    });

    it('should handle missing navigator gracefully', () => {
      // @ts-expect-error - Testing edge case
      delete global.window;

      expect(detectOS()).toBe('unknown');
    });
  });

  // ============================================================================
  // Modifier Key Tests
  // ============================================================================

  describe('Modifier Keys', () => {
    it('should return Cmd symbol for macOS', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });

      expect(getModifierKey('symbol')).toBe('⌘');
      expect(getModifierKey('text')).toBe('Cmd');
    });

    it('should return Ctrl for Windows', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Windows',
          platform: 'Win32',
        },
      });

      expect(getModifierKey('symbol')).toBe('Ctrl');
      expect(getModifierKey('text')).toBe('Ctrl');
    });

    it('should return Ctrl for Linux', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Linux',
          platform: 'Linux',
        },
      });

      expect(getModifierKey('symbol')).toBe('Ctrl');
      expect(getModifierKey('text')).toBe('Ctrl');
    });

    it('should return correct Option/Alt key', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });

      expect(getOptionKey('symbol')).toBe('⌥');
      expect(getOptionKey('text')).toBe('Option');

      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Windows',
          platform: 'Win32',
        },
      });

      expect(getOptionKey('symbol')).toBe('Alt');
      expect(getOptionKey('text')).toBe('Alt');
    });

    it('should return correct Shift key based on OS', () => {
      // macOS should return symbol
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });
      expect(getShiftKey('symbol')).toBe('⇧');
      expect(getShiftKey('text')).toBe('Shift');

      // Windows/Linux should always return 'Shift' for clarity
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Windows',
          platform: 'Win32',
        },
      });
      expect(getShiftKey('symbol')).toBe('Shift');
      expect(getShiftKey('text')).toBe('Shift');
    });
  });

  // ============================================================================
  // Shortcut Formatting Tests
  // ============================================================================

  describe('Shortcut Formatting', () => {
    it('should format shortcut for macOS with symbols', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });

      expect(formatShortcut('K')).toBe('⌘K');
      expect(formatShortcut('K', { shift: true })).toBe('⇧⌘K');
      expect(formatShortcut('K', { alt: true })).toBe('⌥⌘K');
      expect(formatShortcut('K', { shift: true, alt: true })).toBe('⇧⌥⌘K');
    });

    it('should format shortcut for Windows with plus signs', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Windows',
          platform: 'Win32',
        },
      });

      expect(formatShortcut('K')).toBe('Ctrl+K');
      expect(formatShortcut('K', { shift: true })).toContain('Ctrl');
      expect(formatShortcut('K', { shift: true })).toContain('Shift');
      expect(formatShortcut('K', { shift: true })).toContain('K');
      expect(formatShortcut('K', { alt: true })).toBe('Ctrl+Alt+K');
      expect(formatShortcut('K', { shift: true, alt: true })).toContain('Ctrl');
      expect(formatShortcut('K', { shift: true, alt: true })).toContain(
        'Shift',
      );
      expect(formatShortcut('K', { shift: true, alt: true })).toContain('Alt');
    });

    it('should support text format', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });

      expect(formatShortcut('K', { format: 'text' })).toBe('Cmd+K');
      expect(formatShortcut('K', { format: 'text', shift: true })).toBe(
        'Shift+Cmd+K',
      );
    });

    it('should support custom separator', () => {
      expect(formatShortcut('K', { separator: '-' })).toContain('K');
    });

    it('should uppercase the key', () => {
      expect(formatShortcut('k')).toMatch(/K$/);
      expect(formatShortcut('escape')).toMatch(/ESCAPE$/);
    });
  });

  // ============================================================================
  // Keyboard Event Helper Tests
  // ============================================================================

  describe('Keyboard Event Helpers', () => {
    it('should detect modifier key press on macOS', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });

      expect(isModifierKeyPressed(event)).toBe(true);
    });

    it('should detect modifier key press on Windows', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Windows',
          platform: 'Win32',
        },
      });

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
      });

      expect(isModifierKeyPressed(event)).toBe(true);
    });

    it('should detect shortcut match', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });

      const cmdK = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });

      expect(isShortcut(cmdK, 'K')).toBe(true);
      expect(isShortcut(cmdK, 'D')).toBe(false);
    });

    it('should detect shortcut with shift', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });

      const cmdShiftK = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        shiftKey: true,
      });

      expect(isShortcut(cmdShiftK, 'K', { shift: true })).toBe(true);
      expect(isShortcut(cmdShiftK, 'K')).toBe(false); // Expects no shift
    });

    it('should detect shortcut with alt', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });

      const cmdAltK = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        altKey: true,
      });

      expect(isShortcut(cmdAltK, 'K', { alt: true })).toBe(true);
      expect(isShortcut(cmdAltK, 'K')).toBe(false); // Expects no alt
    });

    it('should be case insensitive', () => {
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });

      const cmdK = new KeyboardEvent('keydown', {
        key: 'K',
        metaKey: true,
      });

      expect(isShortcut(cmdK, 'k')).toBe(true);
      expect(isShortcut(cmdK, 'K')).toBe(true);
    });
  });

  // ============================================================================
  // Predefined Shortcuts Tests
  // ============================================================================

  describe('Predefined Shortcuts', () => {
    it('should provide viewCode shortcut', () => {
      const shortcut = SHORTCUTS.viewCode();
      expect(shortcut).toBeTruthy();
      expect(shortcut).toMatch(/K$/); // Ends with K
    });

    it('should provide download shortcut', () => {
      const shortcut = SHORTCUTS.download();
      expect(shortcut).toBeTruthy();
      expect(shortcut).toMatch(/D$/); // Ends with D
    });

    it('should provide downloadAll shortcut with Shift', () => {
      const shortcut = SHORTCUTS.downloadAll();
      expect(shortcut).toBeTruthy();
      expect(shortcut).toMatch(/D$/); // Ends with D
      // Should include shift indicator
      expect(shortcut).toMatch(/Shift|⇧/);
    });

    it('should provide copy shortcut', () => {
      const shortcut = SHORTCUTS.copy();
      expect(shortcut).toBeTruthy();
      expect(shortcut).toMatch(/C$/);
    });

    it('should provide find shortcut', () => {
      const shortcut = SHORTCUTS.find();
      expect(shortcut).toBeTruthy();
      expect(shortcut).toMatch(/F$/);
    });

    it('should provide close shortcut', () => {
      expect(SHORTCUTS.close()).toBe('Esc');
    });

    it('should provide nextTab shortcut', () => {
      expect(SHORTCUTS.nextTab()).toBe('Tab');
    });

    it('should provide prevTab shortcut with Shift', () => {
      const shortcut = SHORTCUTS.prevTab();
      expect(shortcut).toBeTruthy();
      expect(shortcut).toMatch(/TAB$/i); // Case insensitive match
      expect(shortcut).toContain('Shift'); // Should include Shift
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty key gracefully', () => {
      const result = formatShortcut('');
      expect(result).toBeTruthy(); // Should not crash
    });

    it('should handle special characters in key', () => {
      const result = formatShortcut('Enter');
      expect(result).toContain('ENTER');
    });

    it('should handle multiple platforms in single test run', () => {
      // Mac
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Mac',
          platform: 'MacIntel',
        },
      });
      const macShortcut = formatShortcut('K');

      // Windows
      Object.defineProperty(global, 'navigator', {
        writable: true,
        value: {
          userAgent: 'Windows',
          platform: 'Win32',
        },
      });
      const winShortcut = formatShortcut('K');

      expect(macShortcut).not.toBe(winShortcut);
      expect(macShortcut).toContain('⌘');
      expect(winShortcut).toContain('Ctrl');
    });
  });
});
