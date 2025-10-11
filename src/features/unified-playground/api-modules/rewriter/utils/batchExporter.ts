/**
 * Batch Exporter Utility
 *
 * Utilities for exporting batch results to various formats (CSV, JSON, TXT).
 * Handles data serialization and file generation.
 *
 * @module rewriter/utils/batchExporter
 */

import type {
  BatchRewriteItem,
  BatchExportOptions,
  BatchOutputFormat,
} from '../types/batch.types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_EXPORT_OPTIONS: BatchExportOptions = {
  format: 'csv',
  includeOriginal: true,
  includeMetadata: false,
  includeMetrics: true,
  onlySuccessful: false,
  fileName: 'batch-results',
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate export options
 */
function validateExportOptions(
  options: Partial<BatchExportOptions>,
): BatchExportOptions {
  return {
    ...DEFAULT_EXPORT_OPTIONS,
    ...options,
  };
}

/**
 * Filter items based on export options
 */
function filterItems(
  items: BatchRewriteItem[],
  options: BatchExportOptions,
): BatchRewriteItem[] {
  if (options.onlySuccessful) {
    return items.filter(
      (item) => item.status === 'completed' && item.rewrittenText,
    );
  }
  return items;
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Escape CSV field
 */
function escapeCSVField(field: string | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  const str = String(field);

  // Escape if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Export to CSV format
 */
function exportToCSV(
  items: BatchRewriteItem[],
  options: BatchExportOptions,
): string {
  const rows: string[] = [];

  // Build header
  const headers: string[] = ['index', 'status'];

  if (options.includeOriginal) {
    headers.push('original_text', 'original_length');
  }

  headers.push('rewritten_text', 'rewritten_length');

  if (options.includeMetrics) {
    headers.push('duration_ms', 'words', 'characters', 'tokens_per_second');
  }

  if (options.includeMetadata) {
    headers.push('context', 'error_message');
  }

  rows.push(headers.map(escapeCSVField).join(','));

  // Build data rows
  items.forEach((item, index) => {
    const row: string[] = [String(index + 1), item.status];

    if (options.includeOriginal) {
      row.push(
        escapeCSVField(item.originalText),
        String(item.originalText.length),
      );
    }

    row.push(
      escapeCSVField(item.rewrittenText || ''),
      String(item.rewrittenText?.length || 0),
    );

    if (options.includeMetrics) {
      row.push(
        String(item.metrics?.duration || ''),
        String(item.metrics?.words || ''),
        String(item.metrics?.characters || ''),
        String(item.metrics?.tokensPerSecond?.toFixed(2) || ''),
      );
    }

    if (options.includeMetadata) {
      row.push(
        escapeCSVField(item.context || ''),
        escapeCSVField(item.error?.message || ''),
      );
    }

    rows.push(row.map(escapeCSVField).join(','));
  });

  return rows.join('\n');
}

// ============================================================================
// JSON Export
// ============================================================================

/**
 * Export to JSON format
 */
function exportToJSON(
  items: BatchRewriteItem[],
  options: BatchExportOptions,
): string {
  const exportItems = items.map((item, index) => {
    const exportItem: Record<string, unknown> = {
      index: index + 1,
      status: item.status,
    };

    if (options.includeOriginal) {
      exportItem.originalText = item.originalText;
      exportItem.originalLength = item.originalText.length;
    }

    exportItem.rewrittenText = item.rewrittenText || null;
    exportItem.rewrittenLength = item.rewrittenText?.length || 0;

    if (options.includeMetrics && item.metrics) {
      exportItem.metrics = {
        duration: item.metrics.duration,
        words: item.metrics.words || null,
        characters: item.metrics.characters || null,
        tokensPerSecond: item.metrics.tokensPerSecond || null,
        firstChunkLatency: item.metrics.firstChunkLatency || null,
      };
    }

    if (options.includeMetadata) {
      exportItem.context = item.context || null;
      if (item.error) {
        exportItem.error = {
          message: item.error.message,
          name: item.error.name,
        };
      }
    }

    return exportItem;
  });

  return JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      totalItems: items.length,
      items: exportItems,
    },
    null,
    2,
  );
}

// ============================================================================
// TXT Export
// ============================================================================

/**
 * Export to TXT format
 */
function exportToTXT(
  items: BatchRewriteItem[],
  options: BatchExportOptions,
): string {
  const lines: string[] = [];

  lines.push('BATCH REWRITE RESULTS');
  lines.push('='.repeat(50));
  lines.push(`Total Items: ${items.length}`);
  lines.push(`Export Date: ${new Date().toISOString()}`);
  lines.push('');

  items.forEach((item, index) => {
    lines.push(`Item ${index + 1}`);
    lines.push('-'.repeat(50));

    if (options.includeOriginal) {
      lines.push('Original Text:');
      lines.push(item.originalText);
      lines.push('');
    }

    lines.push('Rewritten Text:');
    lines.push(item.rewrittenText || '[Not available]');
    lines.push('');

    lines.push(`Status: ${item.status}`);

    if (options.includeMetrics && item.metrics) {
      lines.push('Metrics:');
      lines.push(`  Duration: ${item.metrics.duration}ms`);
      if (item.metrics.words) {
        lines.push(`  Words: ${item.metrics.words}`);
      }
      if (item.metrics.characters) {
        lines.push(`  Characters: ${item.metrics.characters}`);
      }
      if (item.metrics.tokensPerSecond) {
        lines.push(
          `  Speed: ${item.metrics.tokensPerSecond.toFixed(2)} tokens/s`,
        );
      }
    }

    if (options.includeMetadata) {
      if (item.context) {
        lines.push(`Context: ${item.context}`);
      }
      if (item.error) {
        lines.push(`Error: ${item.error.message}`);
      }
    }

    lines.push('');
  });

  return lines.join('\n');
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export batch results to file
 *
 * @param items - Batch items to export
 * @param options - Export options
 * @returns Exported content as string
 *
 * @example
 * ```ts
 * const csvContent = exportBatchResults(items, {
 *   format: 'csv',
 *   includeOriginal: true,
 *   includeMetrics: true,
 * });
 * ```
 */
export function exportBatchResults(
  items: BatchRewriteItem[],
  options: Partial<BatchExportOptions> = {},
): string {
  if (!items || items.length === 0) {
    throw new Error('No items to export');
  }

  // Validate and merge options
  const validatedOptions = validateExportOptions(options);

  // Filter items
  const filteredItems = filterItems(items, validatedOptions);

  if (filteredItems.length === 0) {
    throw new Error('No items match export criteria');
  }

  // Export based on format
  switch (validatedOptions.format) {
    case 'csv':
      return exportToCSV(filteredItems, validatedOptions);

    case 'json':
      return exportToJSON(filteredItems, validatedOptions);

    case 'txt':
      return exportToTXT(filteredItems, validatedOptions);

    default:
      throw new Error(
        `Unsupported format: ${validatedOptions.format}. Supported formats: csv, json, txt`,
      );
  }
}

// ============================================================================
// Download Helper
// ============================================================================

/**
 * Download exported content as file
 *
 * @param content - Content to download
 * @param fileName - File name (without extension)
 * @param format - File format
 *
 * @example
 * ```ts
 * const content = exportBatchResults(items, { format: 'csv' });
 * downloadBatchResults(content, 'my-batch-results', 'csv');
 * ```
 */
export function downloadBatchResults(
  content: string,
  fileName: string,
  format: BatchOutputFormat,
): void {
  // Create blob
  const blob = new Blob([content], {
    type: getMimeType(format),
  });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.${format}`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get MIME type for format
 */
function getMimeType(format: BatchOutputFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv;charset=utf-8;';
    case 'json':
      return 'application/json;charset=utf-8;';
    case 'txt':
      return 'text/plain;charset=utf-8;';
    default:
      return 'text/plain;charset=utf-8;';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get file extension for format
 */
export function getFileExtension(format: BatchOutputFormat): string {
  return format;
}

/**
 * Generate default file name
 */
export function generateFileName(format: BatchOutputFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `batch-results-${timestamp}.${format}`;
}

/**
 * Get format description
 */
export function getFormatDescription(format: BatchOutputFormat): string {
  switch (format) {
    case 'csv':
      return 'CSV - Import into Excel, Google Sheets, or other spreadsheet apps';
    case 'json':
      return 'JSON - Structured data format for developers';
    case 'txt':
      return 'TXT - Simple plain text format';
  }
}

// ============================================================================
// Export
// ============================================================================

export default exportBatchResults;
