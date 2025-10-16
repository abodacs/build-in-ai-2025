/**
 * Performance Tracker Utility
 * Tracks API performance, Core Web Vitals, and memory usage
 */

import type {
  PerformanceMetric,
  CoreWebVitals,
  APIPerformanceMetric,
  MemoryMetrics,
  PerformanceSnapshot,
} from '../types';

class PerformanceTracker {
  private apiMetrics: APIPerformanceMetric[] = [];
  private maxMetricsHistory = 100;
  private observers: Map<string, PerformanceObserver> = new Map();

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (typeof window === 'undefined') return;

    // Observe paint timing for FCP, LCP
    this.setupObserver('paint', ['paint', 'largest-contentful-paint']);

    // Observe layout shifts for CLS
    this.setupObserver('layout-shift', ['layout-shift']);

    // Observe long tasks for TBT
    this.setupObserver('longtask', ['longtask']);
  }

  /**
   * Setup a performance observer
   */
  private setupObserver(name: string, entryTypes: string[]): void {
    try {
      const observer = new PerformanceObserver((_list) => {
        // Observer callback - metrics are collected on-demand
        console.debug(`[PerformanceTracker] Observed ${entryTypes.join(', ')}`);
      });

      observer.observe({ entryTypes, buffered: true });
      this.observers.set(name, observer);
    } catch (error) {
      console.warn(
        `[PerformanceTracker] Failed to setup ${name} observer:`,
        error,
      );
    }
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): CoreWebVitals {
    const vitals: CoreWebVitals = {
      LCP: this.getLCP(),
      FID: null, // FID requires real user interaction
      CLS: this.getCLS(),
      FCP: this.getFCP(),
      TTI: this.getTTI(),
      TBT: this.getTBT(),
    };

    return vitals;
  }

  /**
   * Get Largest Contentful Paint
   */
  private getLCP(): PerformanceMetric | null {
    const entries = performance.getEntriesByType(
      'largest-contentful-paint',
    ) as PerformanceEntry[];

    if (entries.length === 0) return null;

    const lcp = entries[entries.length - 1] as PerformanceEntry & {
      renderTime: number;
      loadTime: number;
    };
    const value = lcp.renderTime || lcp.loadTime || 0;

    return {
      name: 'LCP',
      value,
      timestamp: Date.now(),
      rating: this.rateLCP(value),
    };
  }

  /**
   * Get First Contentful Paint
   */
  private getFCP(): PerformanceMetric | null {
    const entries = performance.getEntriesByType('paint') as PerformanceEntry[];
    const fcp = entries.find(
      (entry) => entry.name === 'first-contentful-paint',
    );

    if (!fcp) return null;

    const value = fcp.startTime;

    return {
      name: 'FCP',
      value,
      timestamp: Date.now(),
      rating: this.rateFCP(value),
    };
  }

  /**
   * Get Cumulative Layout Shift
   */
  private getCLS(): PerformanceMetric | null {
    const entries = performance.getEntriesByType('layout-shift') as Array<
      PerformanceEntry & { value: number; hadRecentInput: boolean }
    >;

    const cls = entries
      .filter((entry) => !entry.hadRecentInput)
      .reduce((sum, entry) => sum + entry.value, 0);

    return {
      name: 'CLS',
      value: cls,
      timestamp: Date.now(),
      rating: this.rateCLS(cls),
    };
  }

  /**
   * Get Time to Interactive (estimated)
   */
  private getTTI(): PerformanceMetric | null {
    const navTiming = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming;

    if (!navTiming) return null;

    // Estimate TTI as domInteractive
    const value = navTiming.domInteractive;

    return {
      name: 'TTI',
      value,
      timestamp: Date.now(),
      rating: this.rateTTI(value),
    };
  }

  /**
   * Get Total Blocking Time
   */
  private getTBT(): PerformanceMetric | null {
    const longTasks = performance.getEntriesByType('longtask') as Array<
      PerformanceEntry & { duration: number }
    >;

    const tbt = longTasks.reduce((sum, task) => {
      const blockingTime = Math.max(0, task.duration - 50);
      return sum + blockingTime;
    }, 0);

    return {
      name: 'TBT',
      value: tbt,
      timestamp: Date.now(),
      rating: this.rateTBT(tbt),
    };
  }

  /**
   * Rating functions based on Core Web Vitals thresholds
   */
  private rateLCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private rateFCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private rateCLS(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private rateTTI(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 3800) return 'good';
    if (value <= 7300) return 'needs-improvement';
    return 'poor';
  }

  private rateTBT(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 200) return 'good';
    if (value <= 600) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Track API performance
   */
  trackAPICall(
    apiName: string,
    operation: string,
    duration: number,
    success: boolean,
    error?: string,
  ): void {
    const metric: APIPerformanceMetric = {
      apiName,
      operation,
      duration,
      timestamp: Date.now(),
      success,
      error,
    };

    this.apiMetrics.push(metric);

    // Limit history size
    if (this.apiMetrics.length > this.maxMetricsHistory) {
      this.apiMetrics.shift();
    }
  }

  /**
   * Get API metrics
   */
  getAPIMetrics(apiName?: string): APIPerformanceMetric[] {
    if (apiName) {
      return this.apiMetrics.filter((m) => m.apiName === apiName);
    }
    return [...this.apiMetrics];
  }

  /**
   * Get memory metrics
   */
  getMemoryMetrics(): MemoryMetrics | null {
    // @ts-expect-error - memory API is not standard
    const memory = performance.memory;

    if (!memory) return null;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      timestamp: Date.now(),
    };
  }

  /**
   * Get full performance snapshot
   */
  getSnapshot(): PerformanceSnapshot {
    return {
      coreWebVitals: this.getCoreWebVitals(),
      apiMetrics: this.getAPIMetrics(),
      memoryMetrics: this.getMemoryMetrics(),
      timestamp: Date.now(),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.apiMetrics = [];
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.clear();
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

// Auto-initialize
if (typeof window !== 'undefined') {
  performanceTracker.initialize();
}
