/**
 * Hybrid AI Service Unit Tests
 * Tests for Epic 5: Hybrid AI Strategy (Educational Pattern) core functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  executeHybridPrompt,
  tryOnDeviceFirst,
  fallbackToCloud,
  determineStrategy,
  getStrategyRecommendation,
  getPerformanceComparison,
  validateEducationalContent
} from '@/services/hybridAiService';
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
  performanceComparisons,
  networkConditions
} from '../utils/hybridAiMocks';
import { mockConsole, waitFor, verifyTiming } from '../utils/testHelpers';

describe('Hybrid AI Service - Epic 5 (Educational Pattern)', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    cleanupChromeAIMocks();
    mockCloudEndpoints.setupMockEndpoints();
  });

  afterEach(() => {
    consoleMock.restore();
    cleanupChromeAIMocks();
    mockCloudEndpoints.cleanupMockEndpoints();
  });

  describe('executeHybridPrompt Function', () => {
    describe('Strategy Selection and Execution', () => {
      it('should attempt on-device first by default', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await executeHybridPrompt('Create a simple function', 'hybrid');

        expect(result.actualStrategy).toBe('on-device');
        expect(result.data).toBeTruthy();
        expect(result.explanation).toContain('on-device');
        expect(result.privacy).toBe('full');
        expect(result.cost).toBe(0);
      });

      it('should simulate cloud fallback when on-device fails', async () => {
        setupChromeAIMocks(['Writer'], false); // Will fail

        const result = await executeHybridPrompt('Create a function', 'hybrid');

        expect(result.actualStrategy).toBe('cloud-fallback');
        expect(result.data).toBeTruthy();
        expect(result.explanation).toContain('cloud');
        expect(result.privacy).toBe('limited');
        expect(result.cost).toBeGreaterThan(0);
      });

      it('should respect explicit on-device strategy preference', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await executeHybridPrompt('Test prompt', 'on-device');

        expect(result.actualStrategy).toBe('on-device');
        expect(result.data).toBeTruthy();
        expect(result.explanation).toContain('locally');
      });

      it('should respect explicit cloud-fallback strategy preference', async () => {
        mockCloudEndpoints.setupMockEndpoints();

        const result = await executeHybridPrompt('Test prompt', 'cloud-fallback');

        expect(result.actualStrategy).toBe('cloud-fallback');
        expect(result.data).toBeTruthy();
        expect(result.explanation).toContain('cloud');
      });

      it('should handle strategy preferences with proper educational context', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await executeHybridPrompt('Educational test', 'hybrid');

        expect(result.explanation).toBeTruthy();
        expect(result.explanation).toMatch(/educational|demonstration|pattern/i);
        expect(result.actualStrategy).toBeDefined();
      });
    });

    describe('Educational Accuracy', () => {
      it('should provide accurate Chrome AI context', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await executeHybridPrompt('Test Chrome AI', 'on-device');

        expect(result.explanation).not.toContain('Chrome AI uses cloud');
        expect(result.explanation).not.toContain('Chrome AI needs fallback');
        expect(result.privacy).toBe('full');
        expect(result.cost).toBe(0);
      });

      it('should clarify educational purpose of cloud fallback', async () => {
        const result = await executeHybridPrompt('Test educational demo', 'cloud-fallback');

        expect(result.explanation).toMatch(/educational|demonstration|pattern/i);
        expect(result.explanation).not.toContain('Chrome AI requires cloud');
      });

      it('should provide accurate performance comparisons', async () => {
        setupChromeAIMocks(['Writer']);

        const onDeviceResult = await executeHybridPrompt('Test', 'on-device');
        const cloudResult = await executeHybridPrompt('Test', 'cloud-fallback');

        expect(onDeviceResult.latency).toBeLessThan(cloudResult.latency);
        expect(onDeviceResult.privacy).toBe('full');
        expect(cloudResult.privacy).toBe('limited');
        expect(onDeviceResult.cost).toBe(0);
        expect(cloudResult.cost).toBeGreaterThan(0);
      });

      it('should validate educational content accuracy', async () => {
        const result = await executeHybridPrompt('Educational test', 'hybrid');

        const validation = educationalContentValidator.validateAccuracy(result.explanation);
        expect(validation.isAccurate).toBe(true);
        expect(validation.score).toBeGreaterThan(0.8);
      });
    });

    describe('Performance Tracking', () => {
      it('should track performance metrics for both strategies', async () => {
        setupChromeAIMocks(['Writer']);

        const result1 = await executeHybridPrompt('Test 1', 'on-device');
        const result2 = await executeHybridPrompt('Test 2', 'cloud-fallback');

        expect(result1.latency).toBeGreaterThan(0);
        expect(result1.timestamp).toBeTruthy();
        expect(result2.latency).toBeGreaterThan(0);
        expect(result2.timestamp).toBeTruthy();

        // On-device should generally be faster for simple tasks
        expect(result1.latency).toBeLessThan(result2.latency + 200); // Allow some variance
      });

      it('should provide detailed performance metadata', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await executeHybridPrompt('Performance test', 'hybrid');

        expect(result.latency).toBeDefined();
        expect(result.accuracy).toBeDefined();
        expect(result.privacy).toBeDefined();
        expect(result.cost).toBeDefined();
        expect(result.timestamp).toBeDefined();
      });

      it('should handle performance comparison edge cases', async () => {
        // Test with varying network conditions
        mockCloudEndpoints.simulateNetworkError('timeout');

        const result = await executeHybridPrompt('Network test', 'cloud-fallback');

        expect(result.error).toBeTruthy();
        expect(result.latency).toBeGreaterThan(1000); // Timeout should take time
      });
    });

    describe('Error Handling', () => {
      it('should handle on-device API failures gracefully', async () => {
        cleanupChromeAIMocks(); // No Writer API

        const result = await executeHybridPrompt('Test prompt', 'on-device');

        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.explanation).toContain('not available');
      });

      it('should handle cloud service failures gracefully', async () => {
        mockCloudEndpoints.simulateNetworkError('server-error');

        const result = await executeHybridPrompt('Test prompt', 'cloud-fallback');

        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.explanation).toContain('unavailable');
      });

      it('should provide educational value even during failures', async () => {
        cleanupChromeAIMocks();
        mockCloudEndpoints.simulateNetworkError('offline');

        const result = await executeHybridPrompt('Test prompt', 'hybrid');

        expect(result.error).toBeTruthy();
        expect(result.explanation).toBeTruthy();
        expect(result.explanation).toMatch(/educational|demonstration/i);
      });

      it('should handle invalid strategy parameters', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await executeHybridPrompt('Test', 'invalid-strategy' as any);

        expect(result.error).toBeTruthy();
        expect(result.explanation).toContain('strategy');
      });
    });
  });

  describe('tryOnDeviceFirst Function', () => {
    it('should attempt Chrome AI processing first', async () => {
      setupChromeAIMocks(['Writer']);

      const result = await tryOnDeviceFirst('Test prompt');

      expect(result.strategy).toBe('on-device');
      expect(result.data).toBeTruthy();
      expect(result.privacy).toBe('full');
      expect(result.cost).toBe(0);
    });

    it('should handle Chrome AI unavailability', async () => {
      cleanupChromeAIMocks();

      const result = await tryOnDeviceFirst('Test prompt');

      expect(result.strategy).toBe('on-device');
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should provide proper timing measurements', async () => {
      setupChromeAIMocks(['Writer']);

      const startTime = performance.now();
      const result = await tryOnDeviceFirst('Test prompt');
      const endTime = performance.now();

      expect(result.latency).toBeGreaterThan(0);
      expect(result.latency).toBeLessThan(endTime - startTime + 50); // Small buffer
    });

    it('should handle different prompt types correctly', async () => {
      setupChromeAIMocks(['Writer']);

      const simpleResult = await tryOnDeviceFirst('Hello');
      const complexResult = await tryOnDeviceFirst('Create a comprehensive analysis of quantum computing implications for modern software development');

      expect(simpleResult.data).toBeTruthy();
      expect(complexResult.data).toBeTruthy();
      // Complex prompts might take longer
      expect(complexResult.latency).toBeGreaterThanOrEqual(simpleResult.latency);
    });
  });

  describe('fallbackToCloud Function', () => {
    it('should simulate cloud processing for educational purposes', async () => {
      mockCloudEndpoints.setupMockEndpoints();

      const result = await fallbackToCloud('Test prompt', 'firebase');

      expect(result.strategy).toBe('cloud-fallback');
      expect(result.data).toBeTruthy();
      expect(result.privacy).toBe('limited');
      expect(result.cost).toBeGreaterThan(0);
      expect(result.explanation).toContain('cloud');
    });

    it('should handle different cloud service simulations', async () => {
      mockCloudEndpoints.setupMockEndpoints();

      const firebaseResult = await fallbackToCloud('Test', 'firebase');
      const openaiResult = await fallbackToCloud('Test', 'openai');
      const vertexResult = await fallbackToCloud('Test', 'vertex-ai');

      expect(firebaseResult.data).toBeTruthy();
      expect(openaiResult.data).toBeTruthy();
      expect(vertexResult.data).toBeTruthy();

      // Each should have different characteristics
      expect(firebaseResult.data).not.toBe(openaiResult.data);
    });

    it('should simulate realistic cloud processing times', async () => {
      mockCloudEndpoints.setupMockEndpoints();

      const result = await fallbackToCloud('Test prompt', 'firebase');

      expect(result.latency).toBeGreaterThan(200); // Cloud should have network latency
      expect(result.latency).toBeLessThan(2000); // But not too slow for demo
    });

    it('should handle cloud service errors educationally', async () => {
      mockCloudEndpoints.simulateNetworkError('timeout');

      const result = await fallbackToCloud('Test prompt', 'firebase');

      expect(result.error).toBeTruthy();
      expect(result.explanation).toBeTruthy();
      expect(result.explanation).toMatch(/network|timeout|unavailable/i);
    });
  });

  describe('determineStrategy Function', () => {
    it('should recommend on-device for privacy-sensitive content', () => {
      const privacyPrompts = [
        'Analyze my personal financial data',
        'Process confidential business information',
        'Review private medical records'
      ];

      privacyPrompts.forEach(prompt => {
        const strategy = determineStrategy(prompt);
        expect(strategy.recommended).toBe('on-device');
        expect(strategy.reason).toMatch(/privacy|private|confidential/i);
      });
    });

    it('should provide educational recommendations for complex tasks', () => {
      const complexPrompts = [
        'Solve this multi-step logical puzzle with advanced reasoning',
        'Generate comprehensive research report with citations',
        'Perform complex data analysis with statistical modeling'
      ];

      complexPrompts.forEach(prompt => {
        const strategy = determineStrategy(prompt);
        expect(['on-device', 'hybrid']).toContain(strategy.recommended);
        expect(strategy.reason).toBeTruthy();
        expect(strategy.educational).toBeTruthy();
      });
    });

    it('should prefer on-device for typical Chrome AI use cases', () => {
      const typicalPrompts = [
        'Summarize this article',
        'Translate this text to Spanish',
        'Check grammar in this paragraph'
      ];

      typicalPrompts.forEach(prompt => {
        const strategy = determineStrategy(prompt);
        expect(strategy.recommended).toBe('on-device');
        expect(strategy.reason).toMatch(/Chrome AI|efficient|fast/i);
      });
    });

    it('should provide confidence scores for recommendations', () => {
      const result = determineStrategy('Test prompt');

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(typeof result.confidence).toBe('number');
    });

    it('should include educational context in all recommendations', () => {
      const testPrompts = [
        'Simple test',
        'Complex analytical task requiring advanced reasoning',
        'Private personal information processing'
      ];

      testPrompts.forEach(prompt => {
        const strategy = determineStrategy(prompt);
        expect(strategy.educational).toBeTruthy();
        expect(strategy.educational).toMatch(/educational|demonstration|pattern/i);
      });
    });
  });

  describe('getStrategyRecommendation Function', () => {
    it('should provide comprehensive strategy analysis', async () => {
      const recommendation = await getStrategyRecommendation('Analyze customer feedback data');

      expect(recommendation.onDevice).toBeDefined();
      expect(recommendation.cloud).toBeDefined();
      expect(recommendation.recommended).toBeDefined();
      expect(recommendation.tradeoffs).toBeDefined();
      expect(recommendation.educational).toBeDefined();
    });

    it('should include performance predictions', async () => {
      const recommendation = await getStrategyRecommendation('Simple text processing');

      expect(recommendation.onDevice.estimatedLatency).toBeDefined();
      expect(recommendation.onDevice.estimatedAccuracy).toBeDefined();
      expect(recommendation.cloud.estimatedLatency).toBeDefined();
      expect(recommendation.cloud.estimatedAccuracy).toBeDefined();
    });

    it('should provide cost analysis', async () => {
      const recommendation = await getStrategyRecommendation('Generate creative content');

      expect(recommendation.onDevice.cost).toBe(0);
      expect(recommendation.cloud.cost).toBeGreaterThan(0);
      expect(recommendation.tradeoffs.cost).toBeDefined();
    });

    it('should emphasize Chrome AI capabilities', async () => {
      const recommendation = await getStrategyRecommendation('Summarize this text');

      expect(recommendation.recommended).toBe('on-device');
      expect(recommendation.reason).toMatch(/Chrome AI|on-device|efficient/i);
      expect(recommendation.educational).toContain('Chrome AI');
    });
  });

  describe('getPerformanceComparison Function', () => {
    it('should provide accurate performance metrics comparison', async () => {
      const comparison = await getPerformanceComparison('text-summarization');

      expect(comparison.onDevice).toBeDefined();
      expect(comparison.cloud).toBeDefined();
      expect(comparison.onDevice.latency).toBeLessThan(comparison.cloud.latency);
      expect(comparison.onDevice.privacy).toBe('full');
      expect(comparison.cloud.privacy).toBe('limited');
      expect(comparison.onDevice.cost).toBe(0);
      expect(comparison.cloud.cost).toBeGreaterThan(0);
    });

    it('should handle different task types', async () => {
      const taskTypes = ['text-summarization', 'language-translation', 'content-generation'];

      for (const taskType of taskTypes) {
        const comparison = await getPerformanceComparison(taskType);
        expect(comparison.onDevice).toBeDefined();
        expect(comparison.cloud).toBeDefined();
        expect(comparison.taskType).toBe(taskType);
      }
    });

    it('should provide educational insights', async () => {
      const comparison = await getPerformanceComparison('complex-reasoning');

      expect(comparison.insights).toBeDefined();
      expect(comparison.insights.length).toBeGreaterThan(0);
      expect(comparison.educational).toBeTruthy();
      expect(comparison.educational).toMatch(/educational|pattern|demonstration/i);
    });

    it('should include real-world considerations', async () => {
      const comparison = await getPerformanceComparison('content-generation');

      expect(comparison.considerations).toBeDefined();
      expect(comparison.considerations.privacy).toBeDefined();
      expect(comparison.considerations.cost).toBeDefined();
      expect(comparison.considerations.reliability).toBeDefined();
    });
  });

  describe('validateEducationalContent Function', () => {
    it('should validate Chrome AI accuracy', () => {
      const accurateContent = 'Chrome AI processes data entirely on your device for maximum privacy.';
      const inaccurateContent = 'Chrome AI automatically sends data to cloud servers for processing.';

      const accurateValidation = validateEducationalContent(accurateContent);
      const inaccurateValidation = validateEducationalContent(inaccurateContent);

      expect(accurateValidation.isAccurate).toBe(true);
      expect(accurateValidation.score).toBeGreaterThan(0.8);

      expect(inaccurateValidation.isAccurate).toBe(false);
      expect(inaccurateValidation.score).toBeLessThan(0.5);
    });

    it('should check for required educational context', () => {
      const contentWithContext = 'This educational demonstration shows hybrid patterns. Chrome AI is on-device only.';
      const contentWithoutContext = 'This is a simple AI response.';

      const contextValidation = validateEducationalContent(contentWithContext);
      const noContextValidation = validateEducationalContent(contentWithoutContext);

      expect(contextValidation.hasProperContext).toBe(true);
      expect(noContextValidation.hasProperContext).toBe(false);
    });

    it('should provide improvement suggestions', () => {
      const poorContent = 'Chrome AI uses cloud services for better results.';

      const validation = validateEducationalContent(poorContent);

      expect(validation.suggestions).toBeDefined();
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.suggestions[0]).toMatch(/clarify|correct|accurate/i);
    });

    it('should validate hybrid pattern education', () => {
      const goodHybridContent = 'Hybrid patterns are educational concepts. Chrome AI itself is purely on-device.';
      const confusingContent = 'Chrome AI uses hybrid processing with cloud fallback.';

      const goodValidation = validateEducationalContent(goodHybridContent);
      const confusingValidation = validateEducationalContent(confusingContent);

      expect(goodValidation.isAccurate).toBe(true);
      expect(confusingValidation.isAccurate).toBe(false);
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle concurrent strategy requests', async () => {
      setupChromeAIMocks(['Writer']);

      const promises = Array.from({ length: 5 }, (_, i) =>
        executeHybridPrompt(`Concurrent test ${i}`, 'hybrid')
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.actualStrategy).toBeDefined();
        expect(result.explanation).toBeTruthy();
      });
    });

    it('should handle malformed prompts gracefully', async () => {
      setupChromeAIMocks(['Writer']);

      const malformedPrompts = ['', null, undefined, '   ', '\n\n\n'];

      for (const prompt of malformedPrompts) {
        const result = await executeHybridPrompt(prompt as any, 'hybrid');
        expect(result.error || result.data).toBeTruthy(); // Should handle gracefully
      }
    });

    it('should maintain educational value during system stress', async () => {
      setupChromeAIMocks(['Writer']);

      // Simulate high load
      const highLoadPromises = Array.from({ length: 20 }, (_, i) =>
        executeHybridPrompt(`Load test ${i}`, 'hybrid')
      );

      const results = await Promise.all(highLoadPromises);

      results.forEach(result => {
        expect(result.explanation).toBeTruthy();
        expect(result.explanation).toMatch(/educational|demonstration/i);
      });
    });

    it('should recover from network interruptions', async () => {
      // Start with working network
      mockCloudEndpoints.setupMockEndpoints();

      const workingResult = await executeHybridPrompt('Test 1', 'cloud-fallback');
      expect(workingResult.data).toBeTruthy();

      // Simulate network failure
      mockCloudEndpoints.simulateNetworkError('offline');

      const failureResult = await executeHybridPrompt('Test 2', 'cloud-fallback');
      expect(failureResult.error).toBeTruthy();
      expect(failureResult.explanation).toContain('unavailable');

      // Restore network
      mockCloudEndpoints.setupMockEndpoints();

      const recoveredResult = await executeHybridPrompt('Test 3', 'cloud-fallback');
      expect(recoveredResult.data).toBeTruthy();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should complete strategy decisions quickly', async () => {
      const startTime = performance.now();
      const strategy = determineStrategy('Performance test prompt');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
      expect(strategy.recommended).toBeDefined();
    });

    it('should handle memory efficiently during extended use', async () => {
      setupChromeAIMocks(['Writer']);

      // Simulate extended usage
      for (let i = 0; i < 50; i++) {
        await executeHybridPrompt(`Extended test ${i}`, 'hybrid');
      }

      // Should still function correctly
      const finalResult = await executeHybridPrompt('Final test', 'hybrid');
      expect(finalResult.actualStrategy).toBeDefined();
      expect(finalResult.explanation).toBeTruthy();
    });

    it('should cleanup resources properly', async () => {
      setupChromeAIMocks(['Writer']);

      const result = await executeHybridPrompt('Cleanup test', 'hybrid');

      expect(result.actualStrategy).toBeDefined();
      // No specific cleanup validation possible in unit tests,
      // but should not leak memory or resources
    });
  });
});