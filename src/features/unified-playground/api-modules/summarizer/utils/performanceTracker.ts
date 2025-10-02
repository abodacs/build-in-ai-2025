/**
 * Performance Tracker Utility
 *
 * Tracks and analyzes performance metrics for summarization operations
 * Provides insights and recommendations
 *
 * @module performanceTracker
 */

import type { OperationHistory, PerformanceReport } from '../types/api.types';

// ============================================================================
// Performance Tracker Class
// ============================================================================

export class PerformanceTracker {
  private history: OperationHistory[] = [];
  private maxHistorySize: number = 100;

  // ============================================================================
  // Operation Tracking
  // ============================================================================

  /**
   * Record a summarization operation
   *
   * @param {object} operation - Operation details
   */
  recordOperation(operation: {
    type: 'summarize' | 'summarize-streaming' | 'url-extract';
    inputSize: number;
    outputSize: number;
    processingTime: number;
    success: boolean;
    error?: string;
  }) {
    const entry: OperationHistory = {
      id: this.generateId(),
      timestamp: new Date(),
      ...operation,
    };

    this.history.push(entry);

    // Maintain max history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Get operation history
   *
   * @param {number} limit - Maximum number of entries to return
   * @returns {OperationHistory[]} Operation history
   */
  getHistory(limit?: number): OperationHistory[] {
    if (limit) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  /**
   * Clear operation history
   */
  clearHistory() {
    this.history = [];
    console.log('[PerformanceTracker] History cleared');
  }

  // ============================================================================
  // Performance Analysis
  // ============================================================================

  /**
   * Generate performance report
   *
   * @param {Date} startDate - Report start date (optional)
   * @param {Date} endDate - Report end date (optional)
   * @returns {PerformanceReport} Performance report
   */
  generateReport(startDate?: Date, endDate?: Date): PerformanceReport {
    // Filter history by date range if provided
    let filteredHistory = this.history;

    if (startDate || endDate) {
      filteredHistory = this.history.filter((entry) => {
        const timestamp = entry.timestamp.getTime();
        if (startDate && timestamp < startDate.getTime()) return false;
        if (endDate && timestamp > endDate.getTime()) return false;
        return true;
      });
    }

    // Calculate metrics
    const totalOperations = filteredHistory.length;
    const successfulOps = filteredHistory.filter((op) => op.success);
    const successRate =
      totalOperations > 0 ? successfulOps.length / totalOperations : 0;

    const processingTimes = successfulOps.map((op) => op.processingTime);
    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length
        : 0;

    const totalDataProcessed = filteredHistory.reduce(
      (sum, op) => sum + op.inputSize,
      0,
    );

    // Count operations by type
    const operationsByType: Record<string, number> = {};
    filteredHistory.forEach((op) => {
      operationsByType[op.type] = (operationsByType[op.type] || 0) + 1;
    });

    // Performance over time
    const performanceOverTime = successfulOps.map((op) => ({
      timestamp: op.timestamp,
      processingTime: op.processingTime,
    }));

    return {
      period: {
        start: startDate || (filteredHistory[0]?.timestamp ?? new Date()),
        end:
          endDate ||
          (filteredHistory[filteredHistory.length - 1]?.timestamp ??
            new Date()),
      },
      totalOperations,
      successRate,
      averageProcessingTime,
      totalDataProcessed,
      operationsByType,
      performanceOverTime,
    };
  }

  /**
   * Get performance insights and recommendations
   *
   * @returns {object} Insights and recommendations
   */
  getInsights() {
    const report = this.generateReport();

    const insights = {
      totalOperations: report.totalOperations,
      successRate: `${(report.successRate * 100).toFixed(1)}%`,
      averageTime: `${report.averageProcessingTime.toFixed(0)}ms`,
      totalData: this.formatBytes(report.totalDataProcessed),
      recommendations: this.generateRecommendations(report),
    };

    return insights;
  }

  /**
   * Generate recommendations based on performance data
   *
   * @param {PerformanceReport} report - Performance report
   * @returns {string[]} Recommendations
   */
  private generateRecommendations(report: PerformanceReport): string[] {
    const recommendations: string[] = [];

    // Success rate recommendations
    if (report.successRate < 0.9 && report.totalOperations > 5) {
      recommendations.push(
        'Low success rate detected. Check input validation and error handling.',
      );
    }

    // Performance recommendations
    if (report.averageProcessingTime > 5000) {
      recommendations.push(
        'High average processing time. Consider using chunking for large documents.',
      );
    }

    // Streaming recommendations
    const streamingOps = report.operationsByType['summarize-streaming'] || 0;
    const regularOps = report.operationsByType['summarize'] || 0;

    if (regularOps > streamingOps * 2 && regularOps > 10) {
      recommendations.push(
        'Most operations are non-streaming. Consider using streaming for better UX.',
      );
    }

    // Data volume recommendations
    if (report.totalDataProcessed > 10 * 1024 * 1024) {
      // > 10MB
      recommendations.push(
        'High data volume processed. Ensure chunking strategies are optimized.',
      );
    }

    // No issues found
    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! No issues detected.');
    }

    return recommendations;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get detailed statistics
   *
   * @returns {object} Detailed statistics
   */
  getStatistics() {
    const successfulOps = this.history.filter((op) => op.success);
    const failedOps = this.history.filter((op) => !op.success);

    const processingTimes = successfulOps.map((op) => op.processingTime);
    const inputSizes = successfulOps.map((op) => op.inputSize);
    const outputSizes = successfulOps.map((op) => op.outputSize);

    return {
      total: {
        operations: this.history.length,
        successful: successfulOps.length,
        failed: failedOps.length,
        successRate:
          this.history.length > 0
            ? successfulOps.length / this.history.length
            : 0,
      },
      processingTime: {
        average: this.calculateAverage(processingTimes),
        median: this.calculateMedian(processingTimes),
        min: Math.min(...processingTimes, Infinity),
        max: Math.max(...processingTimes, -Infinity),
        p95: this.calculatePercentile(processingTimes, 95),
      },
      inputSize: {
        average: this.calculateAverage(inputSizes),
        median: this.calculateMedian(inputSizes),
        min: Math.min(...inputSizes, Infinity),
        max: Math.max(...inputSizes, -Infinity),
        total: inputSizes.reduce((sum, size) => sum + size, 0),
      },
      outputSize: {
        average: this.calculateAverage(outputSizes),
        median: this.calculateMedian(outputSizes),
        min: Math.min(...outputSizes, Infinity),
        max: Math.max(...outputSizes, -Infinity),
        total: outputSizes.reduce((sum, size) => sum + size, 0),
      },
      compressionRatio: {
        average: this.calculateAverageCompressionRatio(successfulOps),
      },
    };
  }

  /**
   * Get failure analysis
   *
   * @returns {object} Failure analysis
   */
  getFailureAnalysis() {
    const failedOps = this.history.filter((op) => !op.success);

    const errorCounts: Record<string, number> = {};
    failedOps.forEach((op) => {
      const error = op.error || 'Unknown error';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    // Sort by frequency
    const sortedErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([error, count]) => ({ error, count }));

    return {
      totalFailures: failedOps.length,
      failureRate:
        this.history.length > 0 ? failedOps.length / this.history.length : 0,
      errorBreakdown: sortedErrors,
      recentFailures: failedOps.slice(-5),
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Calculate average of an array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate median of an array
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    return sorted[mid];
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate average compression ratio
   */
  private calculateAverageCompressionRatio(
    operations: OperationHistory[],
  ): number {
    if (operations.length === 0) return 0;

    const ratios = operations
      .filter((op) => op.inputSize > 0 && op.outputSize > 0)
      .map((op) => op.inputSize / op.outputSize);

    return this.calculateAverage(ratios);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // ============================================================================
  // Export Data
  // ============================================================================

  /**
   * Export history as JSON
   *
   * @returns {string} JSON string of history
   */
  exportAsJSON(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Export history as CSV
   *
   * @returns {string} CSV string of history
   */
  exportAsCSV(): string {
    if (this.history.length === 0) {
      return 'No data to export';
    }

    // CSV header
    const headers = [
      'ID',
      'Timestamp',
      'Type',
      'Input Size',
      'Output Size',
      'Processing Time',
      'Success',
      'Error',
    ];
    const csvRows = [headers.join(',')];

    // CSV data
    this.history.forEach((op) => {
      const row = [
        op.id,
        op.timestamp.toISOString(),
        op.type,
        op.inputSize.toString(),
        op.outputSize.toString(),
        op.processingTime.toString(),
        op.success.toString(),
        op.error || '',
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Import history from JSON
   *
   * @param {string} jsonData - JSON string
   */
  importFromJSON(jsonData: string) {
    try {
      const imported = JSON.parse(jsonData);

      if (!Array.isArray(imported)) {
        throw new Error('Invalid data format');
      }

      // Validate and convert timestamps
      this.history = imported.map((op) => ({
        ...op,
        timestamp: new Date(op.timestamp),
      }));

      console.log(
        `[PerformanceTracker] Imported ${this.history.length} operations`,
      );
    } catch (error) {
      console.error('[PerformanceTracker] Failed to import data:', error);
      throw error;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let trackerInstance: PerformanceTracker | null = null;

/**
 * Get singleton performance tracker instance
 *
 * @returns {PerformanceTracker} Tracker instance
 */
export function getPerformanceTracker(): PerformanceTracker {
  if (!trackerInstance) {
    trackerInstance = new PerformanceTracker();
  }
  return trackerInstance;
}

/**
 * Reset performance tracker instance
 */
export function resetPerformanceTracker() {
  trackerInstance = null;
}

export default PerformanceTracker;
