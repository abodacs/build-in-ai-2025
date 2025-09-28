/**
 * Performance Metrics Hook
 * Real-time performance monitoring and optimization for the unified playground
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TODO_TYPE } from '../../../../types/global';

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Custom Metrics
  apiResponseTime?: number;
  componentRenderTime?: number;
  bundleSize?: number;
  memoryUsage?: number;
  frameRate?: number;

  // User Experience
  interactionLatency?: number;
  errorRate?: number;
  timeToInteractive?: number;
}

export interface PerformanceEntry {
  timestamp: number;
  metrics: PerformanceMetrics;
  apiType?: string;
  action?: string;
}

// ============================================================================
// Performance Metrics Hook
// ============================================================================

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [history, setHistory] = useState<PerformanceEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const observerRef = useRef<PerformanceObserver | null>(null);
  const frameCountRef = useRef(0);
  const frameStartTimeRef = useRef(0);

  // ============================================================================
  // Core Web Vitals Monitoring
  // ============================================================================

  const initializeCoreWebVitals = useCallback(() => {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as TODO_TYPE;
        if (lastEntry) {
          setMetrics((prev) => ({ ...prev, lcp: lastEntry.startTime }));
        }
      });

      // CLS Observer
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!(entry as TODO_TYPE).hadRecentInput) {
            clsValue += (entry as TODO_TYPE).value;
          }
        }
        setMetrics((prev) => ({ ...prev, cls: clsValue }));
      });

      // FID Observer
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const fidValue =
            (entry as TODO_TYPE).processingStart - entry.startTime;
          setMetrics((prev) => ({ ...prev, fid: fidValue }));
        }
      });

      // Start observing
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      fidObserver.observe({ entryTypes: ['first-input'] });

      observerRef.current = lcpObserver; // Store one reference for cleanup
    } catch (error) {
      console.error('Failed to initialize Core Web Vitals monitoring:', error);
    }
  }, []);

  // ============================================================================
  // Custom Performance Monitoring
  // ============================================================================

  const measureApiPerformance = useCallback(
    async <T>(apiCall: () => Promise<T>, apiType: string): Promise<T> => {
      const startTime = performance.now();
      const startMemory =
        (performance as TODO_TYPE).memory?.usedJSHeapSize || 0;

      try {
        const result = await apiCall();
        const endTime = performance.now();
        const endMemory =
          (performance as TODO_TYPE).memory?.usedJSHeapSize || 0;

        const responseTime = endTime - startTime;
        const memoryDelta = endMemory - startMemory;

        setMetrics((prev) => ({
          ...prev,
          apiResponseTime: responseTime,
          memoryUsage: memoryDelta,
        }));

        // Add to history
        setHistory((prev) => [
          ...prev.slice(-50),
          {
            timestamp: Date.now(),
            metrics: {
              apiResponseTime: responseTime,
              memoryUsage: memoryDelta,
            },
            apiType,
            action: 'api_call',
          },
        ]);

        return result;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        setMetrics((prev) => ({
          ...prev,
          apiResponseTime: responseTime,
          errorRate: (prev.errorRate || 0) + 1,
        }));

        throw error;
      }
    },
    [],
  );

  const measureComponentRender = useCallback((componentName: string) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      setMetrics((prev) => ({
        ...prev,
        componentRenderTime: renderTime,
      }));

      setHistory((prev) => [
        ...prev.slice(-50),
        {
          timestamp: Date.now(),
          metrics: { componentRenderTime: renderTime },
          action: `render_${componentName}`,
        },
      ]);
    };
  }, []);

  const measureInteractionLatency = useCallback((interactionType: string) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const latency = endTime - startTime;

      setMetrics((prev) => ({
        ...prev,
        interactionLatency: latency,
      }));

      setHistory((prev) => [
        ...prev.slice(-50),
        {
          timestamp: Date.now(),
          metrics: { interactionLatency: latency },
          action: `interaction_${interactionType}`,
        },
      ]);
    };
  }, []);

  // ============================================================================
  // Frame Rate Monitoring
  // ============================================================================

  const startFrameRateMonitoring = useCallback(() => {
    frameStartTimeRef.current = performance.now();
    frameCountRef.current = 0;

    const countFrame = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - frameStartTimeRef.current;

      if (elapsed >= 1000) {
        // Calculate FPS every second
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        setMetrics((prev) => ({ ...prev, frameRate: fps }));

        frameStartTimeRef.current = currentTime;
        frameCountRef.current = 0;
      }

      if (isMonitoring) {
        requestAnimationFrame(countFrame);
      }
    };

    requestAnimationFrame(countFrame);
  }, [isMonitoring]);

  // ============================================================================
  // Bundle Size Detection
  // ============================================================================

  const detectBundleSize = useCallback(async () => {
    try {
      if ('navigator' in window && 'connection' in navigator) {
        const connection = (navigator as TODO_TYPE).connection;
        if (connection && connection.effectiveType) {
          // Estimate bundle size based on load time and connection
          const loadTime = metrics.fcp || 0;
          const bandwidth = connection.downlink || 1; // Mbps
          const estimatedSize =
            ((loadTime / 1000) * bandwidth * 1024 * 1024) / 8; // bytes

          setMetrics((prev) => ({ ...prev, bundleSize: estimatedSize }));
        }
      }
    } catch (error) {
      console.warn('Bundle size detection failed:', error);
    }
  }, [metrics.fcp]);

  // ============================================================================
  // Navigation Timing
  // ============================================================================

  const getNavigationMetrics = useCallback(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType(
        'navigation',
      ) as PerformanceNavigationTiming[];

      if (navEntries.length > 0) {
        const nav = navEntries[0];

        setMetrics((prev) => ({
          ...prev,
          ttfb: nav.responseStart - nav.requestStart,
          fcp: nav.loadEventEnd - nav.fetchStart,
          timeToInteractive: nav.domInteractive - nav.fetchStart,
        }));
      }
    }
  }, []);

  // ============================================================================
  // Monitoring Control
  // ============================================================================

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    initializeCoreWebVitals();
    getNavigationMetrics();
    startFrameRateMonitoring();
    detectBundleSize();
  }, [
    initializeCoreWebVitals,
    getNavigationMetrics,
    startFrameRateMonitoring,
    detectBundleSize,
  ]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  // ============================================================================
  // Performance Analysis
  // ============================================================================

  const getPerformanceScore = useCallback((): number => {
    let score = 100;

    // Penalize based on Core Web Vitals
    if (metrics.lcp && metrics.lcp > 2500) score -= 20;
    if (metrics.fid && metrics.fid > 100) score -= 20;
    if (metrics.cls && metrics.cls > 0.1) score -= 20;

    // Penalize based on custom metrics
    if (metrics.apiResponseTime && metrics.apiResponseTime > 1000) score -= 15;
    if (metrics.frameRate && metrics.frameRate < 50) score -= 15;

    return Math.max(0, score);
  }, [metrics]);

  const getOptimizationSuggestions = useCallback((): string[] => {
    const suggestions: string[] = [];

    if (metrics.lcp && metrics.lcp > 2500) {
      suggestions.push(
        'Optimize Largest Contentful Paint: Consider lazy loading or image optimization',
      );
    }

    if (metrics.fid && metrics.fid > 100) {
      suggestions.push(
        'Reduce First Input Delay: Minimize JavaScript execution time',
      );
    }

    if (metrics.cls && metrics.cls > 0.1) {
      suggestions.push(
        'Improve Cumulative Layout Shift: Set dimensions for images and ads',
      );
    }

    if (metrics.apiResponseTime && metrics.apiResponseTime > 1000) {
      suggestions.push(
        'Optimize API calls: Consider caching or request debouncing',
      );
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 50 * 1024 * 1024) {
      suggestions.push(
        'Reduce memory usage: Check for memory leaks or large object retention',
      );
    }

    if (metrics.frameRate && metrics.frameRate < 50) {
      suggestions.push(
        'Improve frame rate: Optimize animations and reduce DOM manipulation',
      );
    }

    return suggestions;
  }, [metrics]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    // Auto-start monitoring
    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // ============================================================================
  // Return Values
  // ============================================================================

  return {
    // Current metrics
    metrics,
    history,
    isMonitoring,

    // Measurement functions
    measureApiPerformance,
    measureComponentRender,
    measureInteractionLatency,

    // Control functions
    startMonitoring,
    stopMonitoring,

    // Analysis functions
    getPerformanceScore,
    getOptimizationSuggestions,

    // Computed values
    performanceScore: getPerformanceScore(),
    optimizationSuggestions: getOptimizationSuggestions(),
    isHealthy: getPerformanceScore() > 80,
    needsOptimization: getPerformanceScore() < 60,
  };
}

// ============================================================================
// Performance Context for Component Tree
// ============================================================================

export function usePerformanceContext() {
  const performanceMetrics = usePerformanceMetrics();

  const withPerformanceTracking = useCallback(
    <T extends TODO_TYPE[], R>(fn: (...args: T) => R, label: string) => {
      return (...args: T): R => {
        const stopMeasuring =
          performanceMetrics.measureInteractionLatency(label);

        try {
          const result = fn(...args);

          // Handle promises
          if (result instanceof Promise) {
            return result.finally(stopMeasuring) as R;
          }

          stopMeasuring();
          return result;
        } catch (error) {
          stopMeasuring();
          throw error;
        }
      };
    },
    [performanceMetrics],
  );

  return {
    ...performanceMetrics,
    withPerformanceTracking,
  };
}
