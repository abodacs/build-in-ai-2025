/**
 * useHybridAi Hook Unit Tests
 * Tests for Epic 5: Hybrid AI Strategy Hook functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHybridAi } from '@/hooks/useHybridAi';
import { useAppStore } from '@/stores/appStore';
import {
  setupChromeAIMocks,
  cleanupChromeAIMocks
} from '../utils/chromeAiMocks';
import {
  mockHybridResults,
  educationalScenarios,
  createMockHybridAiService,
  mockCloudEndpoints,
  performanceComparisons
} from '../utils/hybridAiMocks';
import { mockConsole, waitFor, retryUntil } from '../utils/testHelpers';

describe('useHybridAi Hook - Epic 5 (Educational Pattern)', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    cleanupChromeAIMocks();
    mockCloudEndpoints.setupMockEndpoints();
    useAppStore.getState().reset();
  });

  afterEach(() => {
    consoleMock.restore();
    cleanupChromeAIMocks();
    mockCloudEndpoints.cleanupMockEndpoints();
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useHybridAi());

      expect(result.current.mode).toBe('hybrid');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.results).toEqual([]);
      expect(result.current.currentResult).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.performanceMetrics).toEqual({});
      expect(result.current.educationalContent).toBeTruthy();

      // Check available methods
      expect(typeof result.current.executePrompt).toBe('function');
      expect(typeof result.current.setMode).toBe('function');
      expect(typeof result.current.clearResults).toBe('function');
      expect(typeof result.current.getStrategyRecommendation).toBe('function');
    });

    it('should provide educational content by default', () => {
      const { result } = renderHook(() => useHybridAi());

      expect(result.current.educationalContent.explanation).toBeTruthy();
      expect(result.current.educationalContent.explanation).toMatch(/educational|demonstration|pattern/i);
      expect(result.current.educationalContent.chromeAiContext).toBeTruthy();
      expect(result.current.educationalContent.chromeAiContext).toMatch(/on-device|local/i);
    });

    it('should sync with Chrome AI availability', () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      expect(result.current.capabilities.onDevice).toBe(true);

      cleanupChromeAIMocks();
      const { result: result2 } = renderHook(() => useHybridAi());

      expect(result2.current.capabilities.onDevice).toBe(false);
    });
  });

  describe('Strategy Mode Management', () => {
    describe('setMode Function', () => {
      it('should update strategy mode correctly', () => {
        const { result } = renderHook(() => useHybridAi());

        act(() => {
          result.current.setMode('on-device');
        });

        expect(result.current.mode).toBe('on-device');

        act(() => {
          result.current.setMode('cloud-fallback');
        });

        expect(result.current.mode).toBe('cloud-fallback');

        act(() => {
          result.current.setMode('hybrid');
        });

        expect(result.current.mode).toBe('hybrid');
      });

      it('should provide educational explanations for each mode', () => {
        const { result } = renderHook(() => useHybridAi());

        act(() => {
          result.current.setMode('on-device');
        });

        expect(result.current.educationalContent.currentModeExplanation).toMatch(/on-device|local|privacy/i);

        act(() => {
          result.current.setMode('cloud-fallback');
        });

        expect(result.current.educationalContent.currentModeExplanation).toMatch(/cloud|educational|demonstration/i);

        act(() => {
          result.current.setMode('hybrid');
        });

        expect(result.current.educationalContent.currentModeExplanation).toMatch(/hybrid|automatic|educational/i);
      });

      it('should clear previous results when mode changes', () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        // Execute a prompt first
        act(() => {
          result.current.executePrompt('Test prompt');
        });

        // Wait for completion and verify results
        expect(result.current.results.length).toBeGreaterThan(0);

        // Change mode
        act(() => {
          result.current.setMode('cloud-fallback');
        });

        // Results should be cleared
        expect(result.current.results).toEqual([]);
        expect(result.current.currentResult).toBeNull();
      });

      it('should update educational content when mode changes', () => {
        const { result } = renderHook(() => useHybridAi());

        const initialEducation = result.current.educationalContent.currentModeExplanation;

        act(() => {
          result.current.setMode('on-device');
        });

        const onDeviceEducation = result.current.educationalContent.currentModeExplanation;

        expect(onDeviceEducation).not.toBe(initialEducation);
        expect(onDeviceEducation).toMatch(/on-device|local|device/i);
      });
    });

    describe('Strategy Recommendation', () => {
      it('should provide strategy recommendations based on prompt content', async () => {
        const { result } = renderHook(() => useHybridAi());

        await act(async () => {
          const recommendation = await result.current.getStrategyRecommendation(
            'Analyze my personal financial data'
          );

          expect(recommendation.recommended).toBe('on-device');
          expect(recommendation.reason).toMatch(/privacy|personal|confidential/i);
          expect(recommendation.confidence).toBeGreaterThan(0.8);
        });
      });

      it('should recommend hybrid for educational complex scenarios', async () => {
        const { result } = renderHook(() => useHybridAi());

        await act(async () => {
          const recommendation = await result.current.getStrategyRecommendation(
            'Perform complex multi-step analysis requiring advanced reasoning'
          );

          expect(['hybrid', 'on-device']).toContain(recommendation.recommended);
          expect(recommendation.educational).toBeTruthy();
          expect(recommendation.educational).toMatch(/educational|demonstration/i);
        });
      });

      it('should prefer on-device for typical Chrome AI tasks', async () => {
        const { result } = renderHook(() => useHybridAi());

        const typicalTasks = [
          'Summarize this article',
          'Translate this text',
          'Check grammar'
        ];

        for (const task of typicalTasks) {
          await act(async () => {
            const recommendation = await result.current.getStrategyRecommendation(task);
            expect(recommendation.recommended).toBe('on-device');
            expect(recommendation.reason).toMatch(/Chrome AI|efficient|fast/i);
          });
        }
      });
    });
  });

  describe('Prompt Execution', () => {
    describe('executePrompt Function', () => {
      it('should execute prompts with hybrid strategy', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        expect(result.current.isProcessing).toBe(false);

        await act(async () => {
          await result.current.executePrompt('Create a simple function');
        });

        expect(result.current.isProcessing).toBe(false);
        expect(result.current.currentResult).toBeTruthy();
        expect(result.current.currentResult!.data).toBeTruthy();
        expect(result.current.results).toHaveLength(1);
        expect(result.current.error).toBeNull();
      });

      it('should set processing state during execution', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        let processingStates: boolean[] = [];

        const executePromise = act(async () => {
          return result.current.executePrompt('Test prompt');
        });

        // Check processing state immediately
        expect(result.current.isProcessing).toBe(true);
        processingStates.push(result.current.isProcessing);

        await executePromise;

        // Should be false after completion
        expect(result.current.isProcessing).toBe(false);
        processingStates.push(result.current.isProcessing);

        expect(processingStates).toContain(true);
        expect(processingStates[processingStates.length - 1]).toBe(false);
      });

      it('should handle execution errors gracefully', async () => {
        cleanupChromeAIMocks(); // No APIs available
        const { result } = renderHook(() => useHybridAi());

        await act(async () => {
          await result.current.executePrompt('Test prompt');
        });

        expect(result.current.isProcessing).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.currentResult).toBeNull();
        expect(result.current.educationalContent.errorExplanation).toBeTruthy();
      });

      it('should respect mode settings during execution', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        // Set to on-device mode
        act(() => {
          result.current.setMode('on-device');
        });

        await act(async () => {
          await result.current.executePrompt('Test prompt');
        });

        expect(result.current.currentResult?.actualStrategy).toBe('on-device');
        expect(result.current.currentResult?.privacy).toBe('full');
        expect(result.current.currentResult?.cost).toBe(0);
      });

      it('should track performance metrics during execution', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        await act(async () => {
          await result.current.executePrompt('Performance test');
        });

        expect(result.current.performanceMetrics.totalExecutions).toBeGreaterThan(0);
        expect(result.current.performanceMetrics.averageLatency).toBeGreaterThan(0);
        expect(result.current.performanceMetrics.successRate).toBeGreaterThan(0);
        expect(result.current.performanceMetrics.strategyDistribution).toBeDefined();
      });

      it('should integrate with app store', async () => {
        setupChromeAIMocks(['Writer']);
        const { result: hookResult } = renderHook(() => useHybridAi());
        const { result: storeResult } = renderHook(() => useAppStore());

        await act(async () => {
          await hookResult.current.executePrompt('Integration test');
        });

        // Store should be updated
        expect(storeResult.current.lastInputText).toBe('Integration test');
        expect(storeResult.current.apiResult).toBeTruthy();
        expect(storeResult.current.isLoading).toBe(false);
      });
    });

    describe('Educational Content During Execution', () => {
      it('should provide educational explanations for strategy decisions', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        await act(async () => {
          await result.current.executePrompt('Educational test prompt');
        });

        expect(result.current.currentResult?.explanation).toBeTruthy();
        expect(result.current.currentResult?.explanation).toMatch(/educational|demonstration|pattern/i);
        expect(result.current.educationalContent.lastDecisionExplanation).toBeTruthy();
      });

      it('should maintain Chrome AI context accuracy', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        await act(async () => {
          await result.current.executePrompt('Chrome AI test');
        });

        const explanation = result.current.currentResult?.explanation || '';
        expect(explanation).not.toContain('Chrome AI uses cloud');
        expect(explanation).not.toContain('Chrome AI needs fallback');
        expect(result.current.educationalContent.chromeAiContext).toMatch(/on-device|local/i);
      });

      it('should explain fallback scenarios educationally', async () => {
        setupChromeAIMocks(['Writer'], false); // Will trigger fallback
        const { result } = renderHook(() => useHybridAi());

        await act(async () => {
          await result.current.executePrompt('Fallback test');
        });

        expect(result.current.currentResult?.actualStrategy).toBe('cloud-fallback');
        expect(result.current.currentResult?.explanation).toMatch(/educational|demonstration|fallback/i);
        expect(result.current.educationalContent.fallbackExplanation).toBeTruthy();
      });
    });
  });

  describe('Results Management', () => {
    describe('Results History', () => {
      it('should maintain execution history', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        expect(result.current.results).toHaveLength(0);

        await act(async () => {
          await result.current.executePrompt('First prompt');
        });

        expect(result.current.results).toHaveLength(1);

        await act(async () => {
          await result.current.executePrompt('Second prompt');
        });

        expect(result.current.results).toHaveLength(2);

        // Check history order
        expect(result.current.results[0].prompt).toBe('First prompt');
        expect(result.current.results[1].prompt).toBe('Second prompt');
      });

      it('should limit history size to prevent memory issues', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        // Execute many prompts
        for (let i = 0; i < 15; i++) {
          await act(async () => {
            await result.current.executePrompt(`Prompt ${i}`);
          });
        }

        // Should limit history (assuming max 10)
        expect(result.current.results.length).toBeLessThanOrEqual(10);
      });

      it('should include metadata in history', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        await act(async () => {
          await result.current.executePrompt('Metadata test');
        });

        const historyItem = result.current.results[0];
        expect(historyItem.prompt).toBe('Metadata test');
        expect(historyItem.timestamp).toBeTruthy();
        expect(historyItem.actualStrategy).toBeDefined();
        expect(historyItem.latency).toBeGreaterThan(0);
        expect(historyItem.mode).toBe('hybrid');
      });
    });

    describe('clearResults Function', () => {
      it('should clear all results and reset state', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        // Execute prompts first
        await act(async () => {
          await result.current.executePrompt('Test 1');
        });

        await act(async () => {
          await result.current.executePrompt('Test 2');
        });

        expect(result.current.results).toHaveLength(2);
        expect(result.current.currentResult).toBeTruthy();

        // Clear results
        act(() => {
          result.current.clearResults();
        });

        expect(result.current.results).toHaveLength(0);
        expect(result.current.currentResult).toBeNull();
        expect(result.current.error).toBeNull();
      });

      it('should not affect mode or capabilities', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        // Set specific mode
        act(() => {
          result.current.setMode('on-device');
        });

        const modeBefore = result.current.mode;
        const capabilitiesBefore = result.current.capabilities;

        // Execute and clear
        await act(async () => {
          await result.current.executePrompt('Test');
        });

        act(() => {
          result.current.clearResults();
        });

        expect(result.current.mode).toBe(modeBefore);
        expect(result.current.capabilities).toEqual(capabilitiesBefore);
      });
    });
  });

  describe('Performance Metrics Tracking', () => {
    it('should track strategy distribution accurately', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Execute with different modes
      act(() => {
        result.current.setMode('on-device');
      });

      await act(async () => {
        await result.current.executePrompt('On-device test');
      });

      act(() => {
        result.current.setMode('cloud-fallback');
      });

      await act(async () => {
        await result.current.executePrompt('Cloud test');
      });

      const metrics = result.current.performanceMetrics;
      expect(metrics.strategyDistribution['on-device']).toBeGreaterThan(0);
      expect(metrics.strategyDistribution['cloud-fallback']).toBeGreaterThan(0);
    });

    it('should calculate performance statistics correctly', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Execute multiple prompts
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.executePrompt(`Performance test ${i}`);
        });
      }

      const metrics = result.current.performanceMetrics;
      expect(metrics.totalExecutions).toBe(5);
      expect(metrics.averageLatency).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
    });

    it('should provide comparative performance insights', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Execute with different strategies
      act(() => {
        result.current.setMode('on-device');
      });

      await act(async () => {
        await result.current.executePrompt('Speed test');
      });

      const metrics = result.current.performanceMetrics;
      expect(metrics.performanceComparison).toBeDefined();
      expect(metrics.performanceComparison.onDevice).toBeDefined();
      expect(metrics.performanceComparison.cloud).toBeDefined();
    });
  });

  describe('Educational Content Management', () => {
    it('should update educational content based on execution results', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      const initialEducation = result.current.educationalContent.lastDecisionExplanation;

      await act(async () => {
        await result.current.executePrompt('Educational update test');
      });

      const updatedEducation = result.current.educationalContent.lastDecisionExplanation;
      expect(updatedEducation).not.toBe(initialEducation);
      expect(updatedEducation).toBeTruthy();
    });

    it('should provide context-aware educational content', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Test privacy-sensitive prompt
      await act(async () => {
        await result.current.executePrompt('Process my personal data');
      });

      expect(result.current.educationalContent.privacyExplanation).toBeTruthy();
      expect(result.current.educationalContent.privacyExplanation).toMatch(/privacy|personal|on-device/i);
    });

    it('should maintain educational accuracy throughout', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Execute various prompts
      const prompts = [
        'Simple task',
        'Complex analysis',
        'Privacy-sensitive data'
      ];

      for (const prompt of prompts) {
        await act(async () => {
          await result.current.executePrompt(prompt);
        });

        const education = result.current.educationalContent;
        expect(education.chromeAiContext).toMatch(/on-device|local/i);
        expect(education.chromeAiContext).not.toMatch(/cloud|server|internet/i);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle Chrome AI unavailability gracefully', async () => {
      cleanupChromeAIMocks();
      const { result } = renderHook(() => useHybridAi());

      await act(async () => {
        await result.current.executePrompt('Unavailable test');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.educationalContent.errorExplanation).toBeTruthy();
      expect(result.current.educationalContent.errorExplanation).toMatch(/not available|unavailable/i);
    });

    it('should recover from errors on subsequent executions', async () => {
      // Start with failing service
      cleanupChromeAIMocks();
      const { result } = renderHook(() => useHybridAi());

      await act(async () => {
        await result.current.executePrompt('Failing test');
      });

      expect(result.current.error).toBeTruthy();

      // Fix service
      setupChromeAIMocks(['Writer']);

      await act(async () => {
        await result.current.executePrompt('Recovery test');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.currentResult?.data).toBeTruthy();
    });

    it('should provide educational value during error states', async () => {
      cleanupChromeAIMocks();
      const { result } = renderHook(() => useHybridAi());

      await act(async () => {
        await result.current.executePrompt('Error education test');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.educationalContent.errorExplanation).toBeTruthy();
      expect(result.current.educationalContent.errorExplanation).toMatch(/educational|learn|understand/i);
    });

    it('should handle network errors for cloud fallback mode', async () => {
      mockCloudEndpoints.simulateNetworkError('offline');
      const { result } = renderHook(() => useHybridAi());

      act(() => {
        result.current.setMode('cloud-fallback');
      });

      await act(async () => {
        await result.current.executePrompt('Network error test');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.educationalContent.networkExplanation).toBeTruthy();
    });
  });

  describe('Integration with App State', () => {
    it('should sync with global loading state', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useHybridAi());
      const { result: storeResult } = renderHook(() => useAppStore());

      const executePromise = act(async () => {
        return hookResult.current.executePrompt('Loading sync test');
      });

      // Both should show loading
      expect(hookResult.current.isProcessing).toBe(true);
      expect(storeResult.current.isLoading).toBe(true);

      await executePromise;

      // Both should stop loading
      expect(hookResult.current.isProcessing).toBe(false);
      expect(storeResult.current.isLoading).toBe(false);
    });

    it('should respect global theme settings for educational content', () => {
      const { result: hookResult } = renderHook(() => useHybridAi());
      const { result: storeResult } = renderHook(() => useAppStore());

      act(() => {
        storeResult.current.setTheme('dark');
      });

      expect(hookResult.current.educationalContent.theme).toBe('dark');
    });

    it('should persist educational preferences', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Set preferences
      act(() => {
        result.current.setEducationalLevel('advanced');
        result.current.setMode('on-device');
      });

      await act(async () => {
        await result.current.executePrompt('Preference test');
      });

      expect(result.current.educationalLevel).toBe('advanced');
      expect(result.current.mode).toBe('on-device');
    });
  });

  describe('Concurrent Operations and Performance', () => {
    it('should handle rapid mode switches correctly', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Rapid mode changes
      act(() => {
        result.current.setMode('on-device');
        result.current.setMode('cloud-fallback');
        result.current.setMode('hybrid');
        result.current.setMode('on-device');
      });

      expect(result.current.mode).toBe('on-device');
      expect(result.current.educationalContent.currentModeExplanation).toMatch(/on-device/i);
    });

    it('should handle concurrent executions gracefully', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Start multiple executions
      const promises = [
        act(async () => { await result.current.executePrompt('Concurrent 1'); }),
        act(async () => { await result.current.executePrompt('Concurrent 2'); }),
        act(async () => { await result.current.executePrompt('Concurrent 3'); })
      ];

      await Promise.all(promises);

      // Should handle gracefully
      expect(result.current.results.length).toBeGreaterThan(0);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should maintain performance under extended use', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Extended usage simulation
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          await result.current.executePrompt(`Extended test ${i}`);
        });
      }

      // Should still function correctly
      expect(result.current.performanceMetrics.totalExecutions).toBe(20);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.educationalContent.explanation).toBeTruthy();
    });
  });
});