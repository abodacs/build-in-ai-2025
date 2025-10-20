/**
 * History Manager for Undo/Redo
 *
 * Manages state history for text and corrections to enable undo/redo functionality.
 * Implements a stack-based history with configurable limits.
 *
 * Features:
 * - Push states to history
 * - Undo to previous state
 * - Redo to next state
 * - Clear history
 * - Check if undo/redo available
 * - Configurable history size limit
 *
 * @module proofreader/utils/history
 */

import type { CorrectionState } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * A single history entry representing a state snapshot
 */
export interface HistoryEntry<T = any> {
  /** The state data */
  data: T;

  /** Timestamp when state was created */
  timestamp: number;

  /** Optional description of the change */
  description?: string;
}

/**
 * Proofreader-specific history state
 */
export interface ProofreaderHistoryState {
  /** Text content */
  text: string;

  /** Correction states (applied/ignored/pending) */
  correctionStates: CorrectionState[];

  /** Original input text */
  originalInput: string | null;
}

/**
 * History manager configuration
 */
export interface HistoryManagerConfig {
  /** Maximum number of history entries (default: 50) */
  maxSize?: number;

  /** Enable logging for debugging */
  debug?: boolean;
}

// ============================================================================
// History Manager Class
// ============================================================================

/**
 * Generic history manager with undo/redo capabilities
 *
 * @example
 * ```typescript
 * const history = new HistoryManager<ProofreaderHistoryState>({ maxSize: 50 });
 *
 * // Push initial state
 * history.push({ text: 'Hello', correctionStates: [], originalInput: 'Hello' });
 *
 * // Make change
 * history.push({ text: 'Hello world', correctionStates: [], originalInput: 'Hello' });
 *
 * // Undo
 * const previousState = history.undo();
 * console.log(previousState?.data.text); // 'Hello'
 *
 * // Redo
 * const nextState = history.redo();
 * console.log(nextState?.data.text); // 'Hello world'
 * ```
 */
export class HistoryManager<T = any> {
  private stack: HistoryEntry<T>[] = [];
  private pointer: number = -1;
  private maxSize: number;
  private debug: boolean;

  constructor(config: HistoryManagerConfig = {}) {
    this.maxSize = config.maxSize ?? 50;
    this.debug = config.debug ?? false;
  }

  /**
   * Push a new state to history
   * Clears any redo entries after current pointer
   *
   * @param data - The state data to save
   * @param description - Optional description of the change
   */
  push(data: T, description?: string): void {
    // Remove any redo entries (everything after current pointer)
    if (this.pointer < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.pointer + 1);
    }

    // Create history entry
    const entry: HistoryEntry<T> = {
      data,
      timestamp: Date.now(),
      description,
    };

    // Add to stack
    this.stack.push(entry);
    this.pointer++;

    // Enforce size limit (keep most recent entries)
    if (this.stack.length > this.maxSize) {
      const removeCount = this.stack.length - this.maxSize;
      this.stack = this.stack.slice(removeCount);
      this.pointer -= removeCount;
    }

    if (this.debug) {
      console.log('[HistoryManager] Pushed state:', {
        description,
        pointer: this.pointer,
        stackSize: this.stack.length,
      });
    }
  }

  /**
   * Undo to previous state
   *
   * @returns The previous history entry, or null if at beginning
   */
  undo(): HistoryEntry<T> | null {
    if (!this.canUndo()) {
      if (this.debug) {
        console.log('[HistoryManager] Cannot undo: at beginning of history');
      }
      return null;
    }

    this.pointer--;
    const entry = this.stack[this.pointer];

    if (this.debug) {
      console.log('[HistoryManager] Undo:', {
        description: entry?.description,
        pointer: this.pointer,
        stackSize: this.stack.length,
      });
    }

    return entry ?? null;
  }

  /**
   * Redo to next state
   *
   * @returns The next history entry, or null if at end
   */
  redo(): HistoryEntry<T> | null {
    if (!this.canRedo()) {
      if (this.debug) {
        console.log('[HistoryManager] Cannot redo: at end of history');
      }
      return null;
    }

    this.pointer++;
    const entry = this.stack[this.pointer];

    if (this.debug) {
      console.log('[HistoryManager] Redo:', {
        description: entry?.description,
        pointer: this.pointer,
        stackSize: this.stack.length,
      });
    }

    return entry ?? null;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.pointer > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }

  /**
   * Get current state without moving pointer
   */
  getCurrent(): HistoryEntry<T> | null {
    if (this.pointer < 0 || this.pointer >= this.stack.length) {
      return null;
    }
    return this.stack[this.pointer] ?? null;
  }

  /**
   * Get all history entries (for debugging)
   */
  getHistory(): HistoryEntry<T>[] {
    return [...this.stack];
  }

  /**
   * Get current pointer position
   */
  getPointer(): number {
    return this.pointer;
  }

  /**
   * Get history size
   */
  size(): number {
    return this.stack.length;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.stack = [];
    this.pointer = -1;

    if (this.debug) {
      console.log('[HistoryManager] Cleared history');
    }
  }

  /**
   * Reset to specific state index
   */
  resetToIndex(index: number): HistoryEntry<T> | null {
    if (index < 0 || index >= this.stack.length) {
      console.error('[HistoryManager] Invalid index:', index);
      return null;
    }

    this.pointer = index;
    return this.stack[this.pointer] ?? null;
  }

  /**
   * Get summary of history state for debugging
   */
  getSummary(): {
    size: number;
    pointer: number;
    canUndo: boolean;
    canRedo: boolean;
    current: HistoryEntry<T> | null;
  } {
    return {
      size: this.stack.length,
      pointer: this.pointer,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      current: this.getCurrent(),
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Deep clone object for history storage
 * Uses JSON serialization for simplicity
 */
export function cloneState<T>(state: T): T {
  try {
    return JSON.parse(JSON.stringify(state));
  } catch (error) {
    console.error('[HistoryManager] Failed to clone state:', error);
    return state;
  }
}

/**
 * Compare two states for equality
 * Uses JSON serialization for deep comparison
 */
export function statesEqual<T>(state1: T, state2: T): boolean {
  try {
    return JSON.stringify(state1) === JSON.stringify(state2);
  } catch (error) {
    console.error('[HistoryManager] Failed to compare states:', error);
    return false;
  }
}

/**
 * Create a proofreader history state snapshot
 */
export function createProofreaderSnapshot(
  text: string,
  correctionStates: CorrectionState[],
  originalInput: string | null,
): ProofreaderHistoryState {
  return {
    text: cloneState(text),
    correctionStates: cloneState(correctionStates),
    originalInput: cloneState(originalInput),
  };
}

// ============================================================================
// Exports
// ============================================================================

export default HistoryManager;
