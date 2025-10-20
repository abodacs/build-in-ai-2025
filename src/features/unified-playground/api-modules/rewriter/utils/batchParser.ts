/**
 * Batch Parser Utility
 *
 * Utilities for parsing batch input files (CSV, TXT, JSON).
 * Handles text extraction and validation.
 *
 * @module rewriter/utils/batchParser
 */

import type { BatchImportOptions } from '../types/batch.types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_IMPORT_OPTIONS: BatchImportOptions = {
  format: 'csv',
  textColumn: 'text',
  contextColumn: 'context',
  hasHeader: true,
  delimiter: ',',
  maxItems: 1000,
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate import options
 */
function validateImportOptions(
  options: Partial<BatchImportOptions>,
): BatchImportOptions {
  return {
    ...DEFAULT_IMPORT_OPTIONS,
    ...options,
  };
}

/**
 * Validate file size
 */
function validateFileSize(file: File, maxSizeMB: number = 10): void {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `File size exceeds ${maxSizeMB}MB limit. Please use a smaller file.`,
    );
  }
}

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Parse CSV line respecting quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Parse CSV content
 */
function parseCSV(
  content: string,
  options: BatchImportOptions,
): { texts: string[]; contexts?: string[] } {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  let headers: string[] = [];
  let dataLines = lines;

  // Parse headers if present
  if (options.hasHeader) {
    if (lines.length < 2) {
      throw new Error('CSV file must have at least one data row');
    }
    const firstLine = lines[0];
    if (!firstLine) {
      throw new Error('CSV file has no header line');
    }
    headers = parseCSVLine(firstLine, options.delimiter!);
    dataLines = lines.slice(1);
  }

  // Find column indices
  let textColumnIndex = 0;
  let contextColumnIndex = -1;

  if (options.hasHeader && headers.length > 0) {
    textColumnIndex = headers.findIndex(
      (h) => h.toLowerCase() === options.textColumn!.toLowerCase(),
    );
    if (textColumnIndex === -1) {
      textColumnIndex = 0; // Default to first column
    }

    if (options.contextColumn) {
      contextColumnIndex = headers.findIndex(
        (h) => h.toLowerCase() === options.contextColumn!.toLowerCase(),
      );
    }
  } else {
    // No headers: assume first column is text, second is context
    contextColumnIndex = 1;
  }

  // Parse data rows
  const texts: string[] = [];
  const contexts: string[] = [];

  for (const line of dataLines) {
    const fields = parseCSVLine(line, options.delimiter!);

    if (fields.length === 0) continue;

    // Extract text
    const text = fields[textColumnIndex] || fields[0] || '';
    if (text.trim().length === 0) continue;

    texts.push(text.trim());

    // Extract context if available
    const contextField = fields[contextColumnIndex];
    if (contextColumnIndex >= 0 && contextField) {
      contexts.push(contextField.trim());
    } else {
      contexts.push('');
    }

    // Check max items limit
    if (options.maxItems && texts.length >= options.maxItems) {
      break;
    }
  }

  if (texts.length === 0) {
    throw new Error('No valid text entries found in CSV file');
  }

  return {
    texts,
    contexts: contexts.some((c) => c.length > 0) ? contexts : undefined,
  };
}

// ============================================================================
// TXT Parsing
// ============================================================================

/**
 * Parse TXT content (one text per line)
 */
function parseTXT(
  content: string,
  options: BatchImportOptions,
): { texts: string[] } {
  const texts = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, options.maxItems || 1000);

  if (texts.length === 0) {
    throw new Error('TXT file is empty or contains no valid text');
  }

  return { texts };
}

// ============================================================================
// JSON Parsing
// ============================================================================

/**
 * Parse JSON content
 * Supports:
 * - Array of strings: ["text1", "text2"]
 * - Array of objects: [{"text": "text1", "context": "ctx1"}, ...]
 */
function parseJSON(
  content: string,
  options: BatchImportOptions,
): { texts: string[]; contexts?: string[] } {
  let data: unknown;

  try {
    data = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON format');
  }

  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of strings or objects');
  }

  if (data.length === 0) {
    throw new Error('JSON array is empty');
  }

  const texts: string[] = [];
  const contexts: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    // Handle string array
    if (typeof item === 'string') {
      if (item.trim().length > 0) {
        texts.push(item.trim());
        contexts.push('');
      }
    }
    // Handle object array
    else if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      const text = String(obj[options.textColumn!] || obj.text || '').trim();

      if (text.length > 0) {
        texts.push(text);

        const context = String(
          obj[options.contextColumn!] || obj.context || '',
        ).trim();
        contexts.push(context);
      }
    }

    // Check max items limit
    if (options.maxItems && texts.length >= options.maxItems) {
      break;
    }
  }

  if (texts.length === 0) {
    throw new Error('No valid text entries found in JSON file');
  }

  return {
    texts,
    contexts: contexts.some((c) => c.length > 0) ? contexts : undefined,
  };
}

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse batch input file
 *
 * @param file - File to parse
 * @param options - Import options
 * @returns Parsed texts and optional contexts
 *
 * @example
 * ```ts
 * const { texts, contexts } = await parseBatchFile(file, {
 *   format: 'csv',
 *   hasHeader: true,
 *   textColumn: 'text',
 *   contextColumn: 'context',
 * });
 * ```
 */
export async function parseBatchFile(
  file: File,
  options: Partial<BatchImportOptions> = {},
): Promise<{ texts: string[]; contexts?: string[] }> {
  // Validate file
  validateFileSize(file);

  // Validate and merge options
  const validatedOptions = validateImportOptions(options);

  // Read file content
  const content = await file.text();

  if (!content || content.trim().length === 0) {
    throw new Error('File is empty');
  }

  // Parse based on format
  switch (validatedOptions.format) {
    case 'csv':
      return parseCSV(content, validatedOptions);

    case 'txt':
      return parseTXT(content, validatedOptions);

    case 'json':
      return parseJSON(content, validatedOptions);

    default:
      throw new Error(
        `Unsupported format: ${validatedOptions.format}. Supported formats: csv, txt, json`,
      );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect file format from extension
 */
export function detectFileFormat(file: File): 'csv' | 'txt' | 'json' | null {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      return 'csv';
    case 'txt':
      return 'txt';
    case 'json':
      return 'json';
    default:
      return null;
  }
}

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
  return detectFileFormat(file) !== null;
}

/**
 * Get file format display name
 */
export function getFormatDisplayName(format: string): string {
  switch (format) {
    case 'csv':
      return 'CSV (Comma-Separated Values)';
    case 'txt':
      return 'TXT (Plain Text)';
    case 'json':
      return 'JSON (JavaScript Object Notation)';
    default:
      return format.toUpperCase();
  }
}

// ============================================================================
// Export
// ============================================================================

export default parseBatchFile;
