/**
 * AI Output Validation Utilities
 * OWASP LLM01:2025 Compliant - Output Validation
 *
 * Validates AI-generated outputs to detect potential security issues
 * including reflected injection attempts, system prompt leakage,
 * and suspicious content patterns.
 *
 * @module outputValidation
 */

import {
  detectInjection,
  containsSuspiciousKeywords,
} from './promptInjectionDetection';
import { sanitizeHtml } from './security';
import { DELIMITERS } from './promptConstruction';

export interface OutputValidationResult {
  safe: boolean;
  reason?: string;
  sanitized: string;
  warnings: string[];
  issues?: string[]; // Array of specific validation issues detected
  requiresReview: boolean;
  confidence: number; // 0-1, how confident we are in the safety assessment
}

/**
 * System prompt leakage patterns
 * These patterns indicate the model may be revealing internal instructions
 */
const SYSTEM_PROMPT_LEAK_PATTERNS: RegExp[] = [
  /my\s+(system\s+)?instructions?(\s+are|\s+tell|\s+say)/i,
  /I('m|\s+am)\s+(programmed|instructed|told)\s+to/i,
  /as\s+an?\s+AI(\s+language)?\s+model,?\s+I('m|\s+am)\s+(programmed|designed|configured)/i,
  /my\s+(training|programming|configuration)\s+(data|instructions?|tells)/i,
  /according\s+to\s+my\s+(system\s+)?(instructions?|programming|training)/i,
  /I\s+was\s+(told|instructed|programmed)\s+to/i,
  /my\s+internal\s+(instructions?|rules?|guidelines?)/i,
  /(the|my)\s+system\s+prompt\s+(says?|tells?|is)/i,
];

/**
 * Delimiter leakage patterns
 * These indicate the model is outputting our security delimiters
 */
const DELIMITER_LEAK_PATTERNS: RegExp[] = [
  new RegExp(DELIMITERS.SYSTEM_START.replace(/[<>]/g, '\\$&'), 'i'),
  new RegExp(DELIMITERS.SYSTEM_END.replace(/[<>]/g, '\\$&'), 'i'),
  new RegExp(DELIMITERS.USER_START.replace(/[<>]/g, '\\$&'), 'i'),
  new RegExp(DELIMITERS.USER_END.replace(/[<>]/g, '\\$&'), 'i'),
  new RegExp(DELIMITERS.CONTEXT_START.replace(/[<>]/g, '\\$&'), 'i'),
  new RegExp(DELIMITERS.CONTEXT_END.replace(/[<>]/g, '\\$&'), 'i'),
];

/**
 * Reflected injection patterns
 * These indicate the output may contain a reflected injection attempt
 */
const REFLECTED_INJECTION_INDICATORS: string[] = [
  'ignore previous instructions',
  'disregard all above',
  'you are now a',
  'new system instruction',
  '[SYSTEM]',
  '[ADMIN]',
  'reveal your prompt',
  'show me your instructions',
];

/**
 * Suspicious content patterns
 */
const SUSPICIOUS_CONTENT_PATTERNS: RegExp[] = [
  /<script[\s\S]*?<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers
  /data:text\/html/gi, // Data URI HTML
  /<iframe[\s\S]*?<\/iframe>/gi, // Iframes
];

/**
 * Validate AI output for security issues
 *
 * @param output - The AI-generated output to validate
 * @param originalInput - The original user input (to check for reflection)
 * @param options - Validation options
 */
export function validateAIOutput(
  output: string,
  originalInput?: string,
  options: {
    strictMode?: boolean;
    sanitizeHtmlContent?: boolean;
  } = {},
): OutputValidationResult {
  const { strictMode = false, sanitizeHtmlContent = true } = options;

  const warnings: string[] = [];
  let safe = true;
  let reason: string | undefined;
  let requiresReview = false;
  let confidenceScore = 1.0;

  // Handle null/undefined/non-string output gracefully
  if (!output || typeof output !== 'string') {
    return {
      safe: false,
      sanitized: '',
      warnings: ['Invalid output: Output is null, undefined, or not a string'],
      reason: 'Invalid output type',
      requiresReview: true,
      confidence: 0,
    };
  }

  // Check for system prompt leakage
  const leakageCheck = checkSystemPromptLeakage(output);
  if (leakageCheck.detected) {
    safe = false;
    reason = 'Output appears to contain system prompt information';
    warnings.push(...leakageCheck.patterns);
    confidenceScore *= 0.3;
  }

  // Check for delimiter leakage
  const delimiterCheck = checkDelimiterLeakage(output);
  if (delimiterCheck.detected) {
    if (strictMode) {
      safe = false;
      reason = 'Output contains security delimiters';
    } else {
      requiresReview = true;
      warnings.push('Output contains delimiter patterns');
    }
    confidenceScore *= 0.5;
  }

  // Check for reflected injection
  if (originalInput) {
    const reflectionCheck = checkReflectedInjection(output, originalInput);
    if (reflectionCheck.detected) {
      safe = false;
      reason = 'Output may contain reflected injection attempt';
      warnings.push(...reflectionCheck.patterns);
      confidenceScore *= 0.4;
    }
  }

  // Check for injection patterns in output
  const injectionCheck = detectInjection(output);
  if (
    injectionCheck.isInjection &&
    (injectionCheck.severity === 'critical' ||
      injectionCheck.severity === 'high')
  ) {
    if (strictMode || injectionCheck.confidence > 0.8) {
      safe = false;
      reason = `Output contains ${injectionCheck.category} patterns`;
    } else {
      requiresReview = true;
      warnings.push(
        `Suspicious ${injectionCheck.category} patterns detected in output`,
      );
    }
    confidenceScore *= 1 - injectionCheck.confidence * 0.5;
  }

  // Check for suspicious content
  const suspiciousCheck = checkSuspiciousContent(output);
  if (suspiciousCheck.detected) {
    if (strictMode) {
      safe = false;
      reason = 'Output contains potentially malicious content';
    } else {
      requiresReview = true;
      warnings.push('Output contains suspicious patterns');
    }
    confidenceScore *= 0.6;
  }

  // Sanitize output
  let sanitized = output;
  if (sanitizeHtmlContent) {
    sanitized = sanitizeHtml(output);
  }

  // Remove any delimiter leakage
  sanitized = removeDelimiters(sanitized);

  return {
    safe,
    reason,
    sanitized,
    warnings,
    requiresReview,
    confidence: Math.max(0, Math.min(1, confidenceScore)),
  };
}

/**
 * Check for system prompt leakage
 */
function checkSystemPromptLeakage(output: string): {
  detected: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];

  for (const pattern of SYSTEM_PROMPT_LEAK_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      patterns.push(`System prompt leak pattern: "${match[0]}"`);
    }
  }

  return {
    detected: patterns.length > 0,
    patterns,
  };
}

/**
 * Check for delimiter leakage
 */
function checkDelimiterLeakage(output: string): {
  detected: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];

  for (const pattern of DELIMITER_LEAK_PATTERNS) {
    if (pattern.test(output)) {
      patterns.push(`Delimiter found in output: ${pattern.source}`);
    }
  }

  return {
    detected: patterns.length > 0,
    patterns,
  };
}

/**
 * Check for reflected injection attempts
 */
function checkReflectedInjection(
  output: string,
  input: string,
): {
  detected: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];
  const lowerOutput = output.toLowerCase();
  const lowerInput = input.toLowerCase();

  // Check if input contained injection keywords and they appear in output
  for (const indicator of REFLECTED_INJECTION_INDICATORS) {
    if (lowerInput.includes(indicator) && lowerOutput.includes(indicator)) {
      patterns.push(`Reflected injection keyword: "${indicator}"`);
    }
  }

  // Check if output contains suspicious keywords from input
  if (containsSuspiciousKeywords(input) && containsSuspiciousKeywords(output)) {
    const inputInjection = detectInjection(input);
    const outputInjection = detectInjection(output);

    if (
      inputInjection.isInjection &&
      outputInjection.isInjection &&
      inputInjection.category === outputInjection.category
    ) {
      patterns.push(`Reflected ${inputInjection.category} attempt`);
    }
  }

  return {
    detected: patterns.length > 0,
    patterns,
  };
}

/**
 * Check for suspicious content
 */
function checkSuspiciousContent(output: string): {
  detected: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];

  for (const pattern of SUSPICIOUS_CONTENT_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      patterns.push(`Suspicious pattern: ${match[0].substring(0, 50)}`);
    }
  }

  return {
    detected: patterns.length > 0,
    patterns,
  };
}

/**
 * Remove delimiter patterns from output
 */
function removeDelimiters(output: string): string {
  let cleaned = output;

  // Remove all delimiter patterns
  for (const [, delimiter] of Object.entries(DELIMITERS)) {
    cleaned = cleaned.replace(new RegExp(delimiter, 'g'), '');
  }

  return cleaned;
}

/**
 * Validate that output doesn't exceed length limits
 */
export function validateOutputLength(
  output: string,
  maxLength: number = 100000,
): {
  valid: boolean;
  truncated: string;
  exceeded: boolean;
} {
  const exceeded = output.length > maxLength;

  return {
    valid: !exceeded,
    truncated: exceeded ? output.substring(0, maxLength) + '...' : output,
    exceeded,
  };
}

/**
 * Check if output appears to be attempting data exfiltration
 */
export function checkDataExfiltration(output: string): {
  detected: boolean;
  reason?: string;
} {
  const exfiltrationPatterns = [
    /send\s+(?:this|the|data|information)?\s*(?:data|information)?\s+to\s+[\w-]+\.[\w]+/i, // "send [this/data] to domain.com"
    /email\s+(?:this|the|data|information)?\s*(?:data|information)?\s+to\s+[\w@.-]+/i, // "email [this] to user@domain"
    /post\s+(?:this|the|data)?\s*(?:data|information)?\s+to\s+https?:\/\/[\w.\-/]+/i, // "post [this] to http://..."
    /submit\s+(data|information)\s+to/i, // "submit data to..."
    /exfiltrate/i,
  ];

  for (const pattern of exfiltrationPatterns) {
    if (pattern.test(output)) {
      return {
        detected: true,
        reason: `Potential data exfiltration pattern detected: ${pattern.source}`,
      };
    }
  }

  return { detected: false };
}

/**
 * Quick validation for simple use cases
 */
export function isOutputSafe(output: string, originalInput?: string): boolean {
  const result = validateAIOutput(output, originalInput, { strictMode: true });
  return result.safe;
}

/**
 * Sanitize and validate output in one step
 */
export function sanitizeAndValidateOutput(
  output: string,
  originalInput?: string,
): string {
  const result = validateAIOutput(output, originalInput, {
    strictMode: false,
    sanitizeHtmlContent: true,
  });

  if (!result.safe) {
    throw new Error(
      result.reason || 'Output validation failed for security reasons',
    );
  }

  return result.sanitized;
}
