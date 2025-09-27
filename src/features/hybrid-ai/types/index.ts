/**
 * Hybrid AI Types
 * Types for demonstrating hybrid on-device + cloud fallback patterns
 */

export type ProcessingMode = 'on-device' | 'cloud-fallback';
export type HybridStatus = 'idle' | 'processing' | 'success' | 'error';

export interface HybridAiState {
  mode: ProcessingMode | null;
  status: HybridStatus;
  result: string | null;
  error: string | null;
  latency: number | null;
  isDemo: boolean;
}

export interface CloudFallbackResponse {
  status: 'success' | 'error';
  data: string;
  provider: string;
  model: string;
  latency: number;
  timestamp: string;
  metadata: {
    processingLocation: 'cloud';
    fallbackReason: string;
    cost: number;
    confidence: number;
  };
  educational_note: string;
}

export interface HybridExecutionStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  description: string;
  duration?: number;
  error?: string;
}

export interface HybridAiOptions {
  input: string;
  forceCloudFallback?: boolean; // For demonstration purposes
  simulateOnDeviceFailure?: boolean; // Educational flag
  mockLatency?: number;
}