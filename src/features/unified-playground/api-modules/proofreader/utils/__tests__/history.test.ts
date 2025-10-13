/**
 * History Manager Tests
 *
 * Tests for undo/redo history management utility.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  HistoryManager,
  cloneState,
  statesEqual,
  createProofreaderSnapshot,
  type ProofreaderHistoryState,
} from '../history';
import type { CorrectionState } from '../../types';

describe('HistoryManager', () => {
  let history: HistoryManager<string>;

  beforeEach(() => {
    history = new HistoryManager<string>({ maxSize: 5, debug: false });
  });

  // ==========================================================================
  // Push
  // ==========================================================================

  describe('push', () => {
    it('should push state to history', () => {
      history.push('state1');

      expect(history.size()).toBe(1);
      expect(history.getCurrent()?.data).toBe('state1');
    });

    it('should push multiple states', () => {
      history.push('state1');
      history.push('state2');
      history.push('state3');

      expect(history.size()).toBe(3);
      expect(history.getCurrent()?.data).toBe('state3');
    });

    it('should include description', () => {
      history.push('state1', 'Initial state');

      const current = history.getCurrent();
      expect(current?.description).toBe('Initial state');
    });

    it('should include timestamp', () => {
      const before = Date.now();
      history.push('state1');
      const after = Date.now();

      const current = history.getCurrent();
      expect(current?.timestamp).toBeGreaterThanOrEqual(before);
      expect(current?.timestamp).toBeLessThanOrEqual(after);
    });

    it('should clear redo history on new push', () => {
      history.push('state1');
      history.push('state2');
      history.push('state3');

      // Undo twice
      history.undo();
      history.undo();

      expect(history.canRedo()).toBe(true);

      // Push new state
      history.push('state4');

      // Redo should no longer be available
      expect(history.canRedo()).toBe(false);
    });

    it('should enforce max size limit', () => {
      // Push more than max size
      for (let i = 0; i < 10; i++) {
        history.push(`state${i}`);
      }

      expect(history.size()).toBe(5);
    });

    it('should keep most recent states when exceeding limit', () => {
      for (let i = 0; i < 10; i++) {
        history.push(`state${i}`);
      }

      // Should have states 5-9
      const current = history.getCurrent();
      expect(current?.data).toBe('state9');
    });
  });

  // ==========================================================================
  // Undo
  // ==========================================================================

  describe('undo', () => {
    it('should undo to previous state', () => {
      history.push('state1');
      history.push('state2');

      const result = history.undo();

      expect(result?.data).toBe('state1');
      expect(history.getCurrent()?.data).toBe('state1');
    });

    it('should return null at beginning of history', () => {
      history.push('state1');

      const result = history.undo();

      expect(result).toBeNull();
    });

    it('should return null when history is empty', () => {
      const result = history.undo();

      expect(result).toBeNull();
    });

    it('should allow multiple undos', () => {
      history.push('state1');
      history.push('state2');
      history.push('state3');

      history.undo();
      const result = history.undo();

      expect(result?.data).toBe('state1');
    });

    it('should update pointer correctly', () => {
      history.push('state1');
      history.push('state2');

      const initialPointer = history.getPointer();
      history.undo();
      const newPointer = history.getPointer();

      expect(newPointer).toBe(initialPointer - 1);
    });
  });

  // ==========================================================================
  // Redo
  // ==========================================================================

  describe('redo', () => {
    it('should redo to next state', () => {
      history.push('state1');
      history.push('state2');
      history.undo();

      const result = history.redo();

      expect(result?.data).toBe('state2');
      expect(history.getCurrent()?.data).toBe('state2');
    });

    it('should return null at end of history', () => {
      history.push('state1');
      history.push('state2');

      const result = history.redo();

      expect(result).toBeNull();
    });

    it('should return null when history is empty', () => {
      const result = history.redo();

      expect(result).toBeNull();
    });

    it('should allow multiple redos', () => {
      history.push('state1');
      history.push('state2');
      history.push('state3');

      history.undo();
      history.undo();

      history.redo();
      const result = history.redo();

      expect(result?.data).toBe('state3');
    });

    it('should update pointer correctly', () => {
      history.push('state1');
      history.push('state2');
      history.undo();

      const initialPointer = history.getPointer();
      history.redo();
      const newPointer = history.getPointer();

      expect(newPointer).toBe(initialPointer + 1);
    });
  });

  // ==========================================================================
  // Can Undo/Redo
  // ==========================================================================

  describe('canUndo', () => {
    it('should return false when at beginning', () => {
      history.push('state1');

      expect(history.canUndo()).toBe(false);
    });

    it('should return true when not at beginning', () => {
      history.push('state1');
      history.push('state2');

      expect(history.canUndo()).toBe(true);
    });

    it('should return false when history is empty', () => {
      expect(history.canUndo()).toBe(false);
    });
  });

  describe('canRedo', () => {
    it('should return false when at end', () => {
      history.push('state1');

      expect(history.canRedo()).toBe(false);
    });

    it('should return true after undo', () => {
      history.push('state1');
      history.push('state2');
      history.undo();

      expect(history.canRedo()).toBe(true);
    });

    it('should return false when history is empty', () => {
      expect(history.canRedo()).toBe(false);
    });
  });

  // ==========================================================================
  // Get Current
  // ==========================================================================

  describe('getCurrent', () => {
    it('should return current state', () => {
      history.push('state1');
      history.push('state2');

      const current = history.getCurrent();

      expect(current?.data).toBe('state2');
    });

    it('should return null when history is empty', () => {
      const current = history.getCurrent();

      expect(current).toBeNull();
    });

    it('should return state at pointer after undo', () => {
      history.push('state1');
      history.push('state2');
      history.undo();

      const current = history.getCurrent();

      expect(current?.data).toBe('state1');
    });
  });

  // ==========================================================================
  // Clear
  // ==========================================================================

  describe('clear', () => {
    it('should clear all history', () => {
      history.push('state1');
      history.push('state2');

      history.clear();

      expect(history.size()).toBe(0);
      expect(history.getPointer()).toBe(-1);
      expect(history.getCurrent()).toBeNull();
    });

    it('should allow pushing after clear', () => {
      history.push('state1');
      history.clear();
      history.push('state2');

      expect(history.size()).toBe(1);
      expect(history.getCurrent()?.data).toBe('state2');
    });
  });

  // ==========================================================================
  // Reset To Index
  // ==========================================================================

  describe('resetToIndex', () => {
    beforeEach(() => {
      history.push('state1');
      history.push('state2');
      history.push('state3');
    });

    it('should reset to specific index', () => {
      const result = history.resetToIndex(1);

      expect(result?.data).toBe('state2');
      expect(history.getCurrent()?.data).toBe('state2');
    });

    it('should return null for invalid index', () => {
      const result = history.resetToIndex(10);

      expect(result).toBeNull();
    });

    it('should return null for negative index', () => {
      const result = history.resetToIndex(-1);

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // Get History
  // ==========================================================================

  describe('getHistory', () => {
    it('should return all history entries', () => {
      history.push('state1');
      history.push('state2');
      history.push('state3');

      const entries = history.getHistory();

      expect(entries).toHaveLength(3);
      expect(entries[0].data).toBe('state1');
      expect(entries[1].data).toBe('state2');
      expect(entries[2].data).toBe('state3');
    });

    it('should return copy of history', () => {
      history.push('state1');

      const entries = history.getHistory();
      entries.push({
        data: 'state2',
        timestamp: Date.now(),
      });

      expect(history.size()).toBe(1);
    });
  });

  // ==========================================================================
  // Get Summary
  // ==========================================================================

  describe('getSummary', () => {
    it('should return history summary', () => {
      history.push('state1');
      history.push('state2');

      const summary = history.getSummary();

      expect(summary.size).toBe(2);
      expect(summary.pointer).toBe(1);
      expect(summary.canUndo).toBe(true);
      expect(summary.canRedo).toBe(false);
      expect(summary.current?.data).toBe('state2');
    });

    it('should return empty summary for empty history', () => {
      const summary = history.getSummary();

      expect(summary.size).toBe(0);
      expect(summary.pointer).toBe(-1);
      expect(summary.canUndo).toBe(false);
      expect(summary.canRedo).toBe(false);
      expect(summary.current).toBeNull();
    });
  });

  // ==========================================================================
  // Complex Object States
  // ==========================================================================

  describe('Complex Object States', () => {
    interface ComplexState {
      text: string;
      count: number;
      items: string[];
    }

    let complexHistory: HistoryManager<ComplexState>;

    beforeEach(() => {
      complexHistory = new HistoryManager<ComplexState>();
    });

    it('should handle complex object states', () => {
      const state: ComplexState = {
        text: 'test',
        count: 5,
        items: ['a', 'b', 'c'],
      };

      complexHistory.push(state);

      const current = complexHistory.getCurrent();
      expect(current?.data).toEqual(state);
    });

    it('should preserve nested structures', () => {
      const state: ComplexState = {
        text: 'test',
        count: 5,
        items: ['a', 'b', 'c'],
      };

      complexHistory.push(state);

      const current = complexHistory.getCurrent();
      expect(current?.data.items).toEqual(['a', 'b', 'c']);
    });
  });
});

// ==========================================================================
// Utility Functions
// ==========================================================================

describe('cloneState', () => {
  it('should clone primitive values', () => {
    expect(cloneState('test')).toBe('test');
    expect(cloneState(123)).toBe(123);
    expect(cloneState(true)).toBe(true);
  });

  it('should clone objects', () => {
    const obj = { a: 1, b: 2 };
    const clone = cloneState(obj);

    expect(clone).toEqual(obj);
    expect(clone).not.toBe(obj);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, 3];
    const clone = cloneState(arr);

    expect(clone).toEqual(arr);
    expect(clone).not.toBe(arr);
  });

  it('should clone nested structures', () => {
    const nested = {
      a: 1,
      b: {
        c: 2,
        d: [3, 4],
      },
    };
    const clone = cloneState(nested);

    expect(clone).toEqual(nested);
    expect(clone.b).not.toBe(nested.b);
  });

  it('should handle null', () => {
    expect(cloneState(null)).toBeNull();
  });
});

describe('statesEqual', () => {
  it('should return true for equal primitives', () => {
    expect(statesEqual('test', 'test')).toBe(true);
    expect(statesEqual(123, 123)).toBe(true);
    expect(statesEqual(true, true)).toBe(true);
  });

  it('should return false for different primitives', () => {
    expect(statesEqual('test', 'other')).toBe(false);
    expect(statesEqual(123, 456)).toBe(false);
    expect(statesEqual(true, false)).toBe(false);
  });

  it('should return true for equal objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };

    expect(statesEqual(obj1, obj2)).toBe(true);
  });

  it('should return false for different objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };

    expect(statesEqual(obj1, obj2)).toBe(false);
  });

  it('should return true for equal arrays', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];

    expect(statesEqual(arr1, arr2)).toBe(true);
  });

  it('should return false for different arrays', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 4];

    expect(statesEqual(arr1, arr2)).toBe(false);
  });

  it('should handle nested structures', () => {
    const nested1 = { a: { b: { c: 1 } } };
    const nested2 = { a: { b: { c: 1 } } };

    expect(statesEqual(nested1, nested2)).toBe(true);
  });
});

describe('createProofreaderSnapshot', () => {
  it('should create snapshot with all fields', () => {
    const correctionStates: CorrectionState[] = [
      {
        id: '1',
        correction: {
          original: 'teh',
          suggestion: 'the',
          type: 'spelling',
          startIndex: 0,
          endIndex: 3,
        },
        state: 'pending',
        timestamp: Date.now(),
      },
    ];

    const snapshot = createProofreaderSnapshot(
      'teh test',
      correctionStates,
      'teh test',
    );

    expect(snapshot.text).toBe('teh test');
    expect(snapshot.correctionStates).toEqual(correctionStates);
    expect(snapshot.originalInput).toBe('teh test');
  });

  it('should clone all fields', () => {
    const correctionStates: CorrectionState[] = [
      {
        id: '1',
        correction: {
          original: 'teh',
          suggestion: 'the',
          type: 'spelling',
          startIndex: 0,
          endIndex: 3,
        },
        state: 'pending',
        timestamp: Date.now(),
      },
    ];

    const snapshot = createProofreaderSnapshot(
      'test',
      correctionStates,
      'test',
    );

    // Modify original
    correctionStates.push({
      id: '2',
      correction: {
        original: 'x',
        suggestion: 'y',
        type: 'spelling',
        startIndex: 0,
        endIndex: 1,
      },
      state: 'pending',
      timestamp: Date.now(),
    });

    // Snapshot should not be affected
    expect(snapshot.correctionStates).toHaveLength(1);
  });

  it('should handle null originalInput', () => {
    const snapshot = createProofreaderSnapshot('test', [], null);

    expect(snapshot.originalInput).toBeNull();
  });

  it('should handle empty correctionStates', () => {
    const snapshot = createProofreaderSnapshot('test', [], 'test');

    expect(snapshot.correctionStates).toEqual([]);
  });
});
