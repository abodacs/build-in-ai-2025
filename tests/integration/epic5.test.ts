/**
 * Epic 5 Integration Tests
 * Tests for Hybrid AI Strategy (Educational Pattern) integration across components and services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useHybridAi } from '@/hooks/useHybridAi';
import { useAppStore } from '@/stores/appStore';
import { executeHybridPrompt, getPerformanceComparison } from '@/services/hybridAiService';
import { HybridAiModule } from '@/components/hybrid-ai/HybridAiModule';
import {
  setupChromeAIMocks,
  cleanupChromeAIMocks
} from '../utils/chromeAiMocks';
import {
  mockHybridResults,
  educationalScenarios,
  createMockHybridAiService,
  mockCloudEndpoints,
  educationalContentValidator,
  hybridTestDataGenerators
} from '../utils/hybridAiMocks';
import { mockConsole, waitFor as utilWaitFor, retryUntil } from '../utils/testHelpers';

describe('Epic 5 Integration Tests - Hybrid AI Strategy (Educational Pattern)', () => {
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

  describe('End-to-End Hybrid Strategy Flow', () => {
    it('should complete full hybrid execution cycle with educational context', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useHybridAi());
      const { result: storeResult } = renderHook(() => useAppStore());

      // Initial state
      expect(hookResult.current.isProcessing).toBe(false);
      expect(hookResult.current.currentResult).toBeNull();
      expect(storeResult.current.isLoading).toBe(false);

      // Execute hybrid prompt
      await act(async () => {
        await hookResult.current.executePrompt('Create an educational function to demonstrate hybrid patterns');
      });

      // Verify complete flow
      expect(hookResult.current.isProcessing).toBe(false);
      expect(hookResult.current.currentResult).toBeTruthy();
      expect(hookResult.current.currentResult!.data).toBeTruthy();
      expect(hookResult.current.currentResult!.explanation).toMatch(/educational|demonstration|pattern/i);

      // Store should be updated
      expect(storeResult.current.lastInputText).toContain('educational function');
      expect(storeResult.current.apiResult?.data).toBe(hookResult.current.currentResult!.data);
      expect(storeResult.current.isLoading).toBe(false);

      // Educational content should be accurate
      const validation = educationalContentValidator.validateAccuracy(
        hookResult.current.currentResult!.explanation
      );
      expect(validation.isAccurate).toBe(true);
      expect(validation.score).toBeGreaterThan(0.8);
    });

    it('should handle strategy switching with educational explanations', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useHybridAi());

      // Start with hybrid mode
      expect(hookResult.current.mode).toBe('hybrid');

      // Execute prompt
      await act(async () => {
        await hookResult.current.executePrompt('Educational strategy demonstration');
      });

      const hybridResult = hookResult.current.currentResult;
      expect(hybridResult?.actualStrategy).toBe('on-device');

      // Switch to cloud-fallback mode
      act(() => {
        hookResult.current.setMode('cloud-fallback');
      });

      // Execute same prompt with different strategy
      await act(async () => {
        await hookResult.current.executePrompt('Educational strategy demonstration');
      });

      const cloudResult = hookResult.current.currentResult;
      expect(cloudResult?.actualStrategy).toBe('cloud-fallback');

      // Both should have educational explanations
      expect(hybridResult?.explanation).toMatch(/educational|on-device/i);
      expect(cloudResult?.explanation).toMatch(/educational|cloud|demonstration/i);

      // Performance characteristics should differ
      expect(hybridResult?.privacy).toBe('full');
      expect(cloudResult?.privacy).toBe('limited');
      expect(hybridResult?.cost).toBe(0);
      expect(cloudResult?.cost).toBeGreaterThan(0);
    });

    it('should maintain educational accuracy across error scenarios', async () => {
      // Start with failing on-device
      setupChromeAIMocks(['Writer'], false);
      const { result } = renderHook(() => useHybridAi());

      await act(async () => {
        await result.current.executePrompt('Educational error handling test');
      });

      // Should fallback to cloud with educational explanation
      expect(result.current.currentResult?.actualStrategy).toBe('cloud-fallback');
      expect(result.current.currentResult?.explanation).toMatch(/educational|fallback|demonstration/i);

      // Error explanation should be educational
      expect(result.current.educationalContent.fallbackExplanation).toBeTruthy();
      expect(result.current.educationalContent.fallbackExplanation).toMatch(/educational|learn/i);
    });
  });

  describe('Component Integration', () => {
    describe('HybridAiModule Component Integration', () => {
      it('should integrate with hybrid AI hook seamlessly', async () => {
        setupChromeAIMocks(['Writer']);

        render(<HybridAiModule />);

        // Should show strategy selection
        expect(screen.getByText(/strategy/i)).toBeInTheDocument();
        expect(screen.getByText(/on-device/i)).toBeInTheDocument();
        expect(screen.getByText(/cloud/i)).toBeInTheDocument();

        // Should show educational content
        expect(screen.getByText(/educational/i)).toBeInTheDocument();
        expect(screen.getByText(/demonstration/i)).toBeInTheDocument();

        // Test strategy switching
        const onDeviceButton = screen.getByRole('button', { name: /on-device/i });
        fireEvent.click(onDeviceButton);

        await waitFor(() => {
          expect(screen.getByText(/locally/i)).toBeInTheDocument();
        });
      });

      it('should display performance comparisons accurately', async () => {
        setupChromeAIMocks(['Writer']);

        render(<HybridAiModule />);

        // Execute a prompt to generate metrics
        const input = screen.getByRole('textbox', { name: /prompt/i });
        const executeButton = screen.getByRole('button', { name: /execute/i });

        fireEvent.change(input, { target: { value: 'Test performance tracking' } });
        fireEvent.click(executeButton);

        await waitFor(() => {
          expect(screen.getByText(/latency/i)).toBeInTheDocument();
          expect(screen.getByText(/privacy/i)).toBeInTheDocument();
          expect(screen.getByText(/cost/i)).toBeInTheDocument();
        });

        // Should show accurate metrics
        expect(screen.getByText(/full privacy/i)).toBeInTheDocument();
        expect(screen.getByText(/\$0/i)).toBeInTheDocument(); // On-device cost
      });

      it('should handle educational content updates in real-time', async () => {
        setupChromeAIMocks(['Writer']);

        render(<HybridAiModule />);

        // Initial educational content
        expect(screen.getByText(/Chrome AI.*on-device/i)).toBeInTheDocument();

        // Switch strategy and check updated content
        const cloudButton = screen.getByRole('button', { name: /cloud/i });
        fireEvent.click(cloudButton);

        await waitFor(() => {
          expect(screen.getByText(/educational.*cloud/i)).toBeInTheDocument();
        });

        // Chrome AI context should remain accurate
        expect(screen.getByText(/Chrome AI.*on-device/i)).toBeInTheDocument();
      });

      it('should validate educational content accessibility', async () => {
        setupChromeAIMocks(['Writer']);

        render(<HybridAiModule />);

        // Check ARIA labels and roles
        expect(screen.getByRole('region', { name: /hybrid.*strategy/i })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: /strategy.*selection/i })).toBeInTheDocument();

        // Check educational content is properly labeled
        const educationalSection = screen.getByRole('region', { name: /educational/i });
        expect(educationalSection).toBeInTheDocument();
        expect(educationalSection).toHaveAttribute('aria-live', 'polite');
      });
    });

    describe('Performance Comparison Integration', () => {
      it('should display accurate performance metrics from service layer', async () => {
        setupChromeAIMocks(['Writer']);

        const comparison = await getPerformanceComparison('text-summarization');

        render(<HybridAiModule initialComparison={comparison} />);

        // Should display service-provided metrics
        expect(screen.getByText(comparison.onDevice.latency.toString())).toBeInTheDocument();
        expect(screen.getByText(comparison.cloud.latency.toString())).toBeInTheDocument();

        // Should show educational insights
        expect(screen.getByText(/Chrome AI.*faster/i)).toBeInTheDocument();
        expect(screen.getByText(/privacy.*on-device/i)).toBeInTheDocument();
      });

      it('should update metrics based on actual execution results', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useHybridAi());

        render(<HybridAiModule />);

        // Execute prompts to generate real metrics
        await act(async () => {
          await result.current.executePrompt('Metrics test 1');
        });

        await act(async () => {
          await result.current.executePrompt('Metrics test 2');
        });

        // Metrics should reflect actual execution data
        await waitFor(() => {
          expect(screen.getByText(/2.*executions/i)).toBeInTheDocument();
          expect(screen.getByText(/100%.*success/i)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Educational Content Validation Integration', () => {
    it('should validate all educational content for accuracy', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Execute various prompts to generate educational content
      const testPrompts = [
        'Privacy-sensitive personal data analysis',
        'Complex multi-step reasoning task',
        'Simple text summarization'
      ];

      for (const prompt of testPrompts) {
        await act(async () => {
          await result.current.executePrompt(prompt);
        });

        const explanation = result.current.currentResult?.explanation || '';
        const validation = educationalContentValidator.validateAccuracy(explanation);

        expect(validation.isAccurate).toBe(true);
        expect(validation.score).toBeGreaterThan(0.7);

        // Chrome AI context should be accurate
        const contextValidation = educationalContentValidator.validateChromeAiContext(explanation);
        expect(contextValidation.hasProperContext).toBe(true);
      }
    });

    it('should maintain educational consistency across components', async () => {
      setupChromeAIMocks(['Writer']);

      render(<HybridAiModule />);

      // Check educational consistency in UI
      const educationalTexts = screen.getAllByText(/educational|demonstration|pattern/i);
      expect(educationalTexts.length).toBeGreaterThan(0);

      // All educational content should be consistent
      educationalTexts.forEach(element => {
        const text = element.textContent || '';
        const validation = educationalContentValidator.validateAccuracy(text);
        if (text.length > 20) { // Only validate substantial content
          expect(validation.score).toBeGreaterThan(0.5);
        }
      });
    });

    it('should provide contextually appropriate educational content', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Test different educational scenarios
      for (const scenario of Object.values(educationalScenarios)) {
        await act(async () => {
          await result.current.executePrompt(scenario.input);
        });

        const education = result.current.educationalContent;
        expect(education.lastDecisionExplanation).toBeTruthy();

        if (scenario.input.includes('personal') || scenario.input.includes('private')) {
          expect(education.privacyExplanation).toBeTruthy();
          expect(education.privacyExplanation).toMatch(/privacy|personal|on-device/i);
        }

        if (scenario.input.includes('complex') || scenario.input.includes('advanced')) {
          expect(education.complexityExplanation).toBeTruthy();
          expect(education.complexityExplanation).toMatch(/complex|advanced|consideration/i);
        }
      }
    });
  });

  describe('Cross-Strategy Performance Integration', () => {
    it('should accurately compare performance across strategies', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Execute with different strategies
      const strategies = ['on-device', 'cloud-fallback', 'hybrid'] as const;
      const results: any[] = [];

      for (const strategy of strategies) {
        act(() => {
          result.current.setMode(strategy);
        });

        await act(async () => {
          await result.current.executePrompt(`Performance test for ${strategy}`);
        });

        results.push({
          strategy,
          result: result.current.currentResult,
          metrics: result.current.performanceMetrics
        });
      }

      // Validate performance characteristics
      const onDeviceResult = results.find(r => r.strategy === 'on-device');
      const cloudResult = results.find(r => r.strategy === 'cloud-fallback');

      expect(onDeviceResult.result.privacy).toBe('full');
      expect(cloudResult.result.privacy).toBe('limited');
      expect(onDeviceResult.result.cost).toBe(0);
      expect(cloudResult.result.cost).toBeGreaterThan(0);

      // Latency comparison should be educational
      expect(onDeviceResult.result.latency).toBeLessThan(cloudResult.result.latency + 200);
    });

    it('should handle mixed success/failure scenarios educationally', async () => {
      const { result } = renderHook(() => useHybridAi());

      // Test on-device success, cloud failure
      setupChromeAIMocks(['Writer'], true);
      mockCloudEndpoints.simulateNetworkError('offline');

      await act(async () => {
        await result.current.executePrompt('Mixed scenario test');
      });

      // Should succeed with on-device
      expect(result.current.currentResult?.actualStrategy).toBe('on-device');
      expect(result.current.currentResult?.data).toBeTruthy();

      // Educational content should explain the scenario
      expect(result.current.educationalContent.networkExplanation).toBeTruthy();
      expect(result.current.educationalContent.reliabilityExplanation).toBeTruthy();
    });

    it('should demonstrate cost-benefit analysis accurately', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Execute to generate cost comparison data
      await act(async () => {
        await result.current.executePrompt('Cost analysis demonstration');
      });

      const costAnalysis = result.current.performanceMetrics.costAnalysis;
      expect(costAnalysis).toBeDefined();
      expect(costAnalysis.onDeviceCost).toBe(0);
      expect(costAnalysis.cloudCost).toBeGreaterThan(0);
      expect(costAnalysis.recommendations).toBeDefined();
      expect(costAnalysis.recommendations).toContain('Chrome AI is free');
    });
  });

  describe('Real-World Educational Scenarios', () => {
    it('should handle user learning journey progression', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Simulate beginner user learning progression
      const learningJourney = [
        { prompt: 'What is hybrid AI?', level: 'beginner' },
        { prompt: 'How does Chrome AI maintain privacy?', level: 'intermediate' },
        { prompt: 'Compare on-device vs cloud processing trade-offs', level: 'advanced' }
      ];

      for (const step of learningJourney) {
        act(() => {
          result.current.setEducationalLevel(step.level as any);
        });

        await act(async () => {
          await result.current.executePrompt(step.prompt);
        });

        const education = result.current.educationalContent;
        expect(education.explanation).toBeTruthy();

        // Advanced level should have more detailed explanations
        if (step.level === 'advanced') {
          expect(education.explanation.length).toBeGreaterThan(200);
          expect(education.technicalDetails).toBeTruthy();
        } else if (step.level === 'beginner') {
          expect(education.explanation).toMatch(/simple|easy|basic/i);
        }
      }
    });

    it('should demonstrate enterprise vs consumer use cases', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Enterprise scenario - privacy critical
      await act(async () => {
        await result.current.executePrompt('Process confidential business documents for enterprise compliance analysis');
      });

      const enterpriseResult = result.current.currentResult;
      expect(enterpriseResult?.actualStrategy).toBe('on-device');
      expect(result.current.educationalContent.enterpriseConsiderations).toBeTruthy();
      expect(result.current.educationalContent.enterpriseConsiderations).toMatch(/compliance|privacy|security/i);

      // Consumer scenario - convenience focused
      await act(async () => {
        await result.current.executePrompt('Summarize this news article for personal reading');
      });

      const consumerResult = result.current.currentResult;
      expect(consumerResult?.actualStrategy).toBe('on-device');
      expect(result.current.educationalContent.consumerBenefits).toBeTruthy();
      expect(result.current.educationalContent.consumerBenefits).toMatch(/fast|convenient|free/i);
    });

    it('should handle developer education scenarios', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Developer learning about implementation
      await act(async () => {
        await result.current.executePrompt('Show me how to implement Chrome AI in my application');
      });

      const developerEducation = result.current.educationalContent.developerGuidance;
      expect(developerEducation).toBeTruthy();
      expect(developerEducation).toMatch(/implementation|API|code|integration/i);

      // Should provide accurate technical guidance
      expect(developerEducation).toContain('on-device');
      expect(developerEducation).not.toContain('cloud integration');
    });
  });

  describe('System Resilience and Recovery', () => {
    it('should maintain educational value during system stress', async () => {
      setupChromeAIMocks(['Writer']);

      // Create multiple hook instances to simulate load
      const hooks = Array.from({ length: 5 }, () => renderHook(() => useHybridAi()));

      // Execute concurrent operations
      const promises = hooks.map((hook, index) =>
        act(async () => {
          await hook.result.current.executePrompt(`Stress test ${index}`);
        })
      );

      await Promise.all(promises);

      // All should maintain educational accuracy
      hooks.forEach(hook => {
        const education = hook.result.current.educationalContent;
        expect(education.explanation).toBeTruthy();
        expect(education.chromeAiContext).toMatch(/on-device|local/i);

        const validation = educationalContentValidator.validateAccuracy(education.explanation);
        expect(validation.isAccurate).toBe(true);
      });
    });

    it('should recover gracefully from service interruptions', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Normal operation
      await act(async () => {
        await result.current.executePrompt('Normal operation test');
      });

      expect(result.current.currentResult?.data).toBeTruthy();

      // Simulate service interruption
      cleanupChromeAIMocks();
      mockCloudEndpoints.simulateNetworkError('offline');

      await act(async () => {
        await result.current.executePrompt('Service interruption test');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.educationalContent.errorExplanation).toBeTruthy();

      // Restore services
      setupChromeAIMocks(['Writer']);
      mockCloudEndpoints.setupMockEndpoints();

      await act(async () => {
        await result.current.executePrompt('Recovery test');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.currentResult?.data).toBeTruthy();
    });

    it('should maintain data integrity across strategy switches', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Build up execution history
      const strategies = ['on-device', 'cloud-fallback', 'hybrid'] as const;

      for (const strategy of strategies) {
        act(() => {
          result.current.setMode(strategy);
        });

        await act(async () => {
          await result.current.executePrompt(`Data integrity test with ${strategy}`);
        });
      }

      // Verify data integrity
      expect(result.current.results).toHaveLength(3);
      expect(result.current.performanceMetrics.totalExecutions).toBe(3);

      const strategies_used = result.current.results.map(r => r.actualStrategy);
      expect(strategies_used).toContain('on-device');
      expect(strategies_used).toContain('cloud-fallback');

      // Educational content should reflect all experiences
      expect(result.current.educationalContent.experienceSummary).toBeTruthy();
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should provide accurate real-time performance insights', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      render(<HybridAiModule />);

      // Execute multiple prompts to generate meaningful metrics
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.executePrompt(`Performance insight test ${i}`);
        });
      }

      // Check real-time metrics display
      await waitFor(() => {
        expect(screen.getByText(/5.*executions/i)).toBeInTheDocument();
        expect(screen.getByText(/100%.*success/i)).toBeInTheDocument();
      });

      // Performance recommendations should be present
      expect(screen.getByText(/Chrome AI.*recommended/i)).toBeInTheDocument();
    });

    it('should track and display performance trends', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useHybridAi());

      // Simulate performance variation
      const mockService = createMockHybridAiService('slow', 'medium');

      // Execute with varying conditions
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.executePrompt(`Trend test ${i}`);
        });
      }

      const trends = result.current.performanceMetrics.trends;
      expect(trends).toBeDefined();
      expect(trends.latencyTrend).toBeDefined();
      expect(trends.successRateTrend).toBeDefined();
      expect(trends.educationalInsights).toBeTruthy();
    });
  });
});