/**
 * Debug Store
 *
 * Zustand store for managing developer tools state
 *
 * @module dev-tools/stores/debugStore
 */

import { create } from 'zustand';
import type {
  PerformanceMetric,
  DebugLogEntry,
  ComparisonReport,
  DebugFilters,
  DevToolsState,
} from '../types';

// ============================================================================
// Store Interface
// ============================================================================

interface DebugStore extends DevToolsState {
  // Actions
  togglePanel: () => void;
  setActiveTab: (tab: 'performance' | 'debug' | 'comparison') => void;

  // Performance actions
  addMetric: (metric: PerformanceMetric) => void;
  clearMetrics: () => void;

  // Debug actions
  addLog: (log: DebugLogEntry) => void;
  clearLogs: () => void;

  // Comparison actions
  addReport: (report: ComparisonReport) => void;
  clearReports: () => void;

  // Filter actions
  setFilters: (filters: Partial<DebugFilters>) => void;
  clearFilters: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useDebugStore = create<DebugStore>((set) => ({
  // Initial state
  isOpen: false,
  activeTab: 'performance',
  metrics: [],
  logs: [],
  reports: [],
  filters: {
    status: 'all',
    search: '',
  },

  // Panel actions
  togglePanel: () =>
    set((state) => ({
      isOpen: !state.isOpen,
    })),

  setActiveTab: (tab) =>
    set({
      activeTab: tab,
    }),

  // Performance actions
  addMetric: (metric) =>
    set((state) => ({
      metrics: [...state.metrics, metric].slice(-100), // Keep last 100
    })),

  clearMetrics: () =>
    set({
      metrics: [],
    }),

  // Debug actions
  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log].slice(-100), // Keep last 100
    })),

  clearLogs: () =>
    set({
      logs: [],
    }),

  // Comparison actions
  addReport: (report) =>
    set((state) => ({
      reports: [...state.reports, report].slice(-20), // Keep last 20
    })),

  clearReports: () =>
    set({
      reports: [],
    }),

  // Filter actions
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),

  clearFilters: () =>
    set({
      filters: {
        status: 'all',
        search: '',
      },
    }),
}));

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Record an API call for debugging
 */
export function recordAPICall(
  api: string,
  method: string,
  request: unknown,
  response: unknown,
  duration: number,
  error?: Error,
): void {
  const store = useDebugStore.getState();

  // Add performance metric
  const metric: PerformanceMetric = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    api,
    method,
    startTime: Date.now() - duration,
    endTime: Date.now(),
    duration,
    requestSize: JSON.stringify(request).length,
    responseSize: JSON.stringify(response).length,
    status: error ? 'error' : 'success',
    error: error?.message,
  };
  store.addMetric(metric);

  // Add debug log
  const log: DebugLogEntry = {
    id: metric.id,
    timestamp: Date.now(),
    api,
    method,
    request,
    response,
    duration,
    status: error ? 'error' : 'success',
    error: error
      ? {
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  };
  store.addLog(log);
}

/**
 * Get filtered logs based on current filters
 */
export function getFilteredLogs(
  logs: DebugLogEntry[],
  filters: DebugFilters,
): DebugLogEntry[] {
  let filtered = [...logs];

  // Filter by API
  if (filters.api) {
    filtered = filtered.filter((log) => log.api === filters.api);
  }

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter((log) => log.status === filters.status);
  }

  // Filter by search query
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.api.toLowerCase().includes(search) ||
        log.method.toLowerCase().includes(search) ||
        JSON.stringify(log.request).toLowerCase().includes(search) ||
        JSON.stringify(log.response).toLowerCase().includes(search),
    );
  }

  // Filter by time range
  if (filters.timeRange) {
    filtered = filtered.filter(
      (log) =>
        log.timestamp >= filters.timeRange!.start &&
        log.timestamp <= filters.timeRange!.end,
    );
  }

  return filtered;
}
