/**
 * Hybrid AI Module Component
 * Educational demonstration of hybrid on-device + cloud fallback patterns
 */

import React, { useState, useCallback } from 'react';
import { Play, RotateCcw, Cpu, Cloud, CheckCircle, XCircle, Clock, AlertTriangle, Info } from 'lucide-react';
import { hybridAiService } from '../services/hybridAiService';
import { useAppStore } from '@/stores/appStore';
import type { HybridAiState, HybridAiOptions, ProcessingMode } from '../types';

interface HybridAiModuleProps {
  className?: string;
}

export function HybridAiModule({ className = '' }: HybridAiModuleProps) {
  const { setApiResult, setLoading } = useAppStore();

  const [hybridState, setHybridState] = useState<HybridAiState>({
    mode: null,
    status: 'idle',
    result: null,
    error: null,
    latency: null,
    isDemo: false
  });

  const [inputText, setInputText] = useState('Explain the benefits of hybrid AI architectures in modern applications.');
  const [executionSteps, setExecutionSteps] = useState<any[]>([]);
  const [availabilityCheck, setAvailabilityCheck] = useState<any>(null);
  const [demoOptions, setDemoOptions] = useState({
    forceCloudFallback: false,
    simulateOnDeviceFailure: false
  });

  // Check Chrome AI availability
  const checkAvailability = useCallback(async () => {
    const availability = await hybridAiService.checkOnDeviceAvailability();
    setAvailabilityCheck(availability);
  }, []);

  // Execute hybrid prompt
  const executeHybridPrompt = useCallback(async () => {
    if (!inputText.trim()) return;

    setHybridState(prev => ({ ...prev, status: 'processing' }));
    setLoading(true);
    setExecutionSteps([]);

    try {
      const options: HybridAiOptions = {
        input: inputText,
        forceCloudFallback: demoOptions.forceCloudFallback,
        simulateOnDeviceFailure: demoOptions.simulateOnDeviceFailure
      };

      const response = await hybridAiService.executeHybridPrompt(options);

      setHybridState({
        mode: response.mode,
        status: response.result ? 'success' : 'error',
        result: response.result,
        error: response.error || null,
        latency: response.latency,
        isDemo: response.isDemo
      });

      setExecutionSteps(response.steps);

      // Update app store
      setApiResult({
        data: response.result,
        error: response.error || null,
        latency: response.latency || 0
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Hybrid execution failed';
      setHybridState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
    } finally {
      setLoading(false);
    }
  }, [inputText, demoOptions, setApiResult, setLoading]);

  // Reset state
  const resetState = useCallback(() => {
    setHybridState({
      mode: null,
      status: 'idle',
      result: null,
      error: null,
      latency: null,
      isDemo: false
    });
    setExecutionSteps([]);
    setApiResult(null);
  }, [setApiResult]);

  // Load availability on mount
  React.useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Get mode badge
  const getModebadge = (mode: ProcessingMode | null) => {
    if (!mode) return null;

    if (mode === 'on-device') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
          <Cpu className="w-4 h-4" />
          Processed On-Device
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
        <Cloud className="w-4 h-4" />
        Processed via Cloud Fallback (Demo)
      </div>
    );
  };

  // Get step icon
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 border-2 border-muted rounded-full" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Hybrid AI Strategy Demo</h2>
        <p className="text-muted-foreground">
          Educational demonstration of resilient AI architecture patterns with graceful fallback strategies.
        </p>
      </div>

      {/* Educational Notice */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-medium text-amber-900 dark:text-amber-100">Educational Demo</h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Chrome AI APIs run 100% on-device and don't require cloud fallback. This demo teaches architectural patterns
              for building resilient AI applications that gracefully handle service unavailability.
            </p>
          </div>
        </div>
      </div>

      {/* Availability Check */}
      {availabilityCheck && (
        <div className="p-4 border border-border rounded-lg">
          <h3 className="font-medium mb-3">Chrome AI Availability Status</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(availabilityCheck.apis).map(([api, available]) => (
                <div key={api} className="flex items-center gap-2">
                  {available ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-600" />
                  )}
                  <span className="capitalize">{api}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {availabilityCheck.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* Demo Options */}
      <div className="p-4 border border-border rounded-lg bg-muted/50">
        <h3 className="font-medium mb-3">Demo Options (Educational)</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={demoOptions.forceCloudFallback}
              onChange={(e) => setDemoOptions(prev => ({
                ...prev,
                forceCloudFallback: e.target.checked
              }))}
              className="rounded"
            />
            Force cloud fallback (skip on-device processing)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={demoOptions.simulateOnDeviceFailure}
              onChange={(e) => setDemoOptions(prev => ({
                ...prev,
                simulateOnDeviceFailure: e.target.checked
              }))}
              className="rounded"
            />
            Simulate on-device failure
          </label>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Input Prompt</h3>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your prompt here..."
          className="w-full h-24 px-3 py-2 text-sm border border-border rounded-md bg-background resize-y"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={executeHybridPrompt}
          disabled={hybridState.status === 'processing' || !inputText.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-4 h-4" />
          {hybridState.status === 'processing' ? 'Processing...' : 'Execute Hybrid Prompt'}
        </button>

        <button
          onClick={resetState}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <button
          onClick={checkAvailability}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
        >
          <Cpu className="w-4 h-4" />
          Check Availability
        </button>
      </div>

      {/* Execution Steps */}
      {executionSteps.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Execution Flow</h3>
          <div className="space-y-3">
            {executionSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                <div className="mt-0.5">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">
                      Step {step.step}: {step.name}
                    </h4>
                    {step.duration && (
                      <span className="text-xs text-muted-foreground">
                        {step.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {step.error && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Error: {step.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {hybridState.status === 'success' && hybridState.result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Result</h3>
            <div className="flex items-center gap-3">
              {getModebadge(hybridState.mode)}
              {hybridState.latency && (
                <span className="text-sm text-muted-foreground">
                  {hybridState.latency}ms
                </span>
              )}
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg bg-background">
            <p className="whitespace-pre-wrap text-sm">{hybridState.result}</p>
          </div>

          {hybridState.isDemo && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 This response came from the mock cloud endpoint to demonstrate the fallback pattern.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {hybridState.status === 'error' && hybridState.error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm text-red-800 dark:text-red-200">{hybridState.error}</p>
            <p className="text-xs text-red-600 dark:text-red-400">
              This demonstrates how your application should handle complete AI service failures.
            </p>
          </div>
        </div>
      )}

      {/* Architecture Information */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Hybrid AI Architecture Benefits
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Resilience</strong>: Graceful degradation when primary AI service fails</li>
          <li>• <strong>Performance</strong>: On-device processing for speed and privacy</li>
          <li>• <strong>Scalability</strong>: Cloud fallback for complex or unsupported tasks</li>
          <li>• <strong>User Experience</strong>: Transparent failover maintains service availability</li>
          <li>• <strong>Cost Optimization</strong>: Use expensive cloud AI only when necessary</li>
        </ul>
      </div>
    </div>
  );
}