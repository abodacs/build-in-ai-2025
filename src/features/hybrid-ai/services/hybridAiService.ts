/**
 * Hybrid AI Service
 * Demonstrates the pattern of on-device first, cloud fallback architecture
 */

import { generatePrompt } from '@/services/aiService';
import type { HybridAiOptions, CloudFallbackResponse, ProcessingMode } from '../types';

export class HybridAiService {
  private static instance: HybridAiService;

  public static getInstance(): HybridAiService {
    if (!HybridAiService.instance) {
      HybridAiService.instance = new HybridAiService();
    }
    return HybridAiService.instance;
  }

  /**
   * Execute hybrid AI prompt with fallback demonstration
   * This is educational - Chrome AI is always on-device only
   */
  async executeHybridPrompt(options: HybridAiOptions) {
    const steps: Array<{ step: number; name: string; status: string; description: string; duration?: number; error?: string }> = [];

    try {
      // Step 1: Try on-device processing (Chrome AI)
      steps.push({
        step: 1,
        name: 'On-Device Processing',
        status: 'running',
        description: 'Attempting to process with Chrome AI (on-device)'
      });

      // Simulate on-device failure if requested (for educational purposes)
      if (options.simulateOnDeviceFailure) {
        steps[0].status = 'error';
        steps[0].error = 'Simulated on-device failure (for demonstration)';
        steps[0].duration = 100;

        // Step 2: Fallback to mock cloud service
        return await this.executeMockCloudFallback(options, steps);
      }

      // Force cloud fallback if requested (for educational purposes)
      if (options.forceCloudFallback) {
        steps[0].status = 'success';
        steps[0].description = 'Skipping on-device processing (demonstration mode)';
        steps[0].duration = 50;

        return await this.executeMockCloudFallback(options, steps);
      }

      // Normal Chrome AI execution
      const startTime = performance.now();
      const response = await generatePrompt({
        input: options.input,
        context: 'Hybrid AI demonstration - processing on-device'
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      if (response.error) {
        steps[0].status = 'error';
        steps[0].error = response.error;
        steps[0].duration = duration;

        // Fallback to mock cloud service
        return await this.executeMockCloudFallback(options, steps);
      }

      // Success with on-device processing
      steps[0].status = 'success';
      steps[0].duration = duration;

      return {
        mode: 'on-device' as ProcessingMode,
        result: response.data,
        latency: response.latency,
        steps,
        isDemo: false
      };

    } catch (error) {
      steps[0].status = 'error';
      steps[0].error = error instanceof Error ? error.message : 'Unknown error';

      // Fallback to mock cloud service
      return await this.executeMockCloudFallback(options, steps);
    }
  }

  /**
   * Execute mock cloud fallback (educational demonstration)
   */
  private async executeMockCloudFallback(options: HybridAiOptions, steps: any[]) {
    steps.push({
      step: 2,
      name: 'Cloud Fallback',
      status: 'running',
      description: 'Falling back to mock cloud AI service (demonstration)'
    });

    try {
      const startTime = performance.now();

      // Simulate network latency
      const mockLatency = options.mockLatency || (200 + Math.random() * 400);
      await new Promise(resolve => setTimeout(resolve, mockLatency));

      // Fetch mock cloud response
      const response = await fetch('/mock-endpoints/firebase-ai-response.json');
      if (!response.ok) {
        throw new Error('Mock cloud service unavailable');
      }

      const cloudResponse: CloudFallbackResponse = await response.json();
      const endTime = performance.now();
      const totalDuration = Math.round(endTime - startTime);

      steps[steps.length - 1].status = 'success';
      steps[steps.length - 1].duration = totalDuration;

      return {
        mode: 'cloud-fallback' as ProcessingMode,
        result: cloudResponse.data,
        latency: cloudResponse.latency,
        steps,
        isDemo: true,
        cloudMetadata: cloudResponse.metadata
      };

    } catch (error) {
      steps[steps.length - 1].status = 'error';
      steps[steps.length - 1].error = error instanceof Error ? error.message : 'Cloud fallback failed';

      return {
        mode: null,
        result: null,
        latency: null,
        steps,
        isDemo: true,
        error: 'Both on-device and cloud processing failed'
      };
    }
  }

  /**
   * Check Chrome AI availability (educational helper)
   */
  async checkOnDeviceAvailability(): Promise<{
    available: boolean;
    apis: Record<string, boolean>;
    recommendation: string;
  }> {
    const apis = {
      summarizer: typeof (globalThis as any).Summarizer !== 'undefined',
      translator: typeof (globalThis as any).Translator !== 'undefined',
      writer: typeof (globalThis as any).Writer !== 'undefined',
      rewriter: typeof (globalThis as any).Rewriter !== 'undefined',
      languageModel: typeof (globalThis as any).LanguageModel !== 'undefined',
      languageDetector: typeof (globalThis as any).LanguageDetector !== 'undefined'
    };

    const available = Object.values(apis).some(Boolean);

    let recommendation = '';
    if (!available) {
      recommendation = 'Chrome AI APIs not available. In a production app, you would fallback to cloud AI services.';
    } else {
      const availableCount = Object.values(apis).filter(Boolean).length;
      recommendation = `${availableCount}/6 Chrome AI APIs available. On-device processing ready!`;
    }

    return {
      available,
      apis,
      recommendation
    };
  }
}

export const hybridAiService = HybridAiService.getInstance();