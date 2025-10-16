/**
 * usePerformanceMonitor Hook
 * Provides real-time performance monitoring with Core Web Vitals
 */

import { useState, useEffect, useCallback } from 'react';
import { performanceTracker } from '../utils/performanceTracker';
import type { PerformanceSnapshot } from '../types';

export function usePerformanceMonitor(refreshInterval = 1000) {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const refresh = useCallback(() => {
    const newSnapshot = performanceTracker.getSnapshot();
    setSnapshot(newSnapshot);
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    refresh();
  }, [refresh]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const clearMetrics = useCallback(() => {
    performanceTracker.clear();
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(refresh, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval, refresh]);

  return {
    snapshot,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refresh,
    clearMetrics,
  };
}
