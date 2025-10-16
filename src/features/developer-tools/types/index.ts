/**
 * Developer Tools - Type Definitions
 * Comprehensive type system for performance monitoring, debugging, and API comparison
 */

// Performance Metrics
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

export interface CoreWebVitals {
  LCP: PerformanceMetric | null; // Largest Contentful Paint
  FID: PerformanceMetric | null; // First Input Delay
  CLS: PerformanceMetric | null; // Cumulative Layout Shift
  FCP: PerformanceMetric | null; // First Contentful Paint
  TTI: PerformanceMetric | null; // Time to Interactive
  TBT: PerformanceMetric | null; // Total Blocking Time
}

export interface APIPerformanceMetric {
  apiName: string;
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentage: number;
  timestamp: number;
}

export interface PerformanceSnapshot {
  coreWebVitals: CoreWebVitals;
  apiMetrics: APIPerformanceMetric[];
  memoryMetrics: MemoryMetrics | null;
  timestamp: number;
}

// Debug Console Types
export interface DebugLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  apiName: string;
  operation: string;
  message: string;
  data?: unknown;
  request?: {
    method?: string;
    params?: unknown;
  };
  response?: {
    status?: 'success' | 'error';
    data?: unknown;
    error?: string;
  };
  duration?: number;
}

export interface DebugFilter {
  level?: ('info' | 'warn' | 'error' | 'debug')[];
  apiName?: string[];
  searchText?: string;
  timeRange?: {
    start: number;
    end: number;
  };
}

// API Comparison Types
export interface APIFeature {
  name: string;
  supported: boolean;
  notes?: string;
}

export interface APIComparisonData {
  apiName: string;
  version: string;
  availability: 'readily' | 'after-download' | 'no';
  features: APIFeature[];
  performanceBenchmark?: {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    successRate: number;
  };
  capabilities: {
    streaming?: boolean;
    multimodal?: boolean;
    contextAware?: boolean;
    batchProcessing?: boolean;
  };
  useCases: string[];
  limitations: string[];
}

// Developer Tools State
export interface DeveloperToolsState {
  isPerformanceMonitorOpen: boolean;
  isDebugConsoleOpen: boolean;
  isAPIComparisonOpen: boolean;
  performanceData: PerformanceSnapshot | null;
  debugLogs: DebugLogEntry[];
  apiComparisons: APIComparisonData[];
}

// Export Configuration
export interface ExportConfig {
  format: 'json' | 'csv' | 'txt';
  includeMetadata: boolean;
  timeRange?: {
    start: number;
    end: number;
  };
}
