/**
 * SummarizerInput Component
 *
 * Text input area with smart features
 * Includes validation, word count, URL detection, and contextual help
 *
 * @module SummarizerInput
 */

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Link as LinkIcon,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  validateText,
  countWords,
  isLikelyCode,
  suggestOutputFormat,
} from '../utils/textPreprocessing';
import { isValidURL } from '../utils/urlParser';

// ============================================================================
// Types
// ============================================================================

export interface SummarizerInputProps {
  /** Input text value */
  value: string;

  /** Change handler */
  onChange: (value: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Show validation feedback */
  showValidation?: boolean;

  /** Show word count */
  showWordCount?: boolean;

  /** Show smart detection (URL, code) */
  showSmartDetection?: boolean;

  /** Minimum text length for validation */
  minLength?: number;
}

// ============================================================================
// SummarizerInput Component
// ============================================================================

/**
 * Text input component with smart features
 *
 * @example
 * ```tsx
 * <SummarizerInput
 *   value={text}
 *   onChange={setText}
 *   showValidation
 *   showWordCount
 *   showSmartDetection
 * />
 * ```
 */
export function SummarizerInput({
  value,
  onChange,
  placeholder = 'Paste text to summarize...',
  disabled = false,
  className,
  showValidation = true,
  showWordCount = true,
  showSmartDetection = true,
  minLength = 100,
}: SummarizerInputProps) {
  // State
  const [isFocused, setIsFocused] = useState(false);

  // Character limits (production-ready)
  const CHAR_LIMIT_WARNING = 15000; // Warning threshold
  const CHAR_LIMIT_MAX = 20000; // Hard limit

  /**
   * Analyze input text (computed during render, not in useEffect)
   */
  const analysis = useMemo(() => {
    if (!value) {
      return {
        wordCount: 0,
        charCount: 0,
        isValid: false,
        validationMessage: null,
        detectedURL: null,
        detectedCode: false,
        suggestedFormat: null,
      };
    }

    // Count words and characters
    const words = countWords(value);
    const chars = value.length;

    let isValid = false;
    let validationMessage: string | null = null;

    // Check character limit
    if (chars > CHAR_LIMIT_MAX) {
      isValid = false;
      validationMessage = `Text exceeds maximum limit of ${CHAR_LIMIT_MAX.toLocaleString()} characters`;
    } else if (chars > CHAR_LIMIT_WARNING) {
      isValid = true; // Still valid but show warning
      validationMessage = `Approaching character limit (${CHAR_LIMIT_MAX.toLocaleString()} max)`;
    } else {
      // Validate text normally
      const validation = validateText(value, minLength);
      isValid = validation.valid;
      validationMessage = validation.reason || null;
    }

    // Detect URL
    let detectedURL: string | null = null;
    let detectedCode = false;
    let suggestedFormat: 'markdown' | 'plain-text' | null = null;

    if (showSmartDetection) {
      const trimmed = value.trim();
      if (isValidURL(trimmed)) {
        detectedURL = trimmed;
      }

      // Detect code
      detectedCode = isLikelyCode(value);

      // Suggest output format
      suggestedFormat = suggestOutputFormat(value);
    }

    return {
      wordCount: words,
      charCount: chars,
      isValid,
      validationMessage,
      detectedURL,
      detectedCode,
      suggestedFormat,
    };
  }, [value, minLength, showSmartDetection]);

  // Destructure analysis results
  const {
    wordCount,
    charCount,
    isValid,
    validationMessage,
    detectedURL,
    detectedCode,
    suggestedFormat,
  } = analysis;

  /**
   * Get validation color
   */
  const getValidationColor = () => {
    if (!value) return 'text-slate-500';
    if (isValid) return 'text-green-600';
    if (wordCount > 0) return 'text-amber-600';
    return 'text-slate-500';
  };

  return (
    <Card className={cn('border-slate-200 shadow-sm', className)}>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <CardTitle className="text-sm font-medium">Input Text</CardTitle>
          </div>

          {/* Word count badge */}
          {showWordCount && value && (
            <Badge
              variant="outline"
              className={cn(
                'font-mono text-[10px] h-5 px-1.5',
                getValidationColor(),
              )}
            >
              {wordCount.toLocaleString()}w · {charCount.toLocaleString()}c
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Text area with empty state overlay */}
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'min-h-[180px] sm:min-h-[240px] resize-y text-sm',
              'transition-all duration-200',
              isFocused && 'ring-2 ring-purple-500 ring-offset-2',
              !isValid && value && showValidation && 'border-amber-400',
            )}
          />

          {/* Empty State Overlay */}
          {!value && !isFocused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-3 p-6">
                <Sparkles className="w-10 h-10 mx-auto text-slate-300" />
                <div className="space-y-1">
                  <p className="text-sm text-slate-600 font-medium">
                    Ready to summarize
                  </p>
                  <p className="text-xs text-slate-500">
                    Paste or type text to get started
                  </p>
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  💡 Try Quick Samples in Advanced tab
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Smart detection alerts - Compact */}
        {showSmartDetection && (
          <>
            {/* URL detected */}
            {detectedURL && (
              <Alert className="border-blue-200 bg-blue-50 py-2">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800">
                  <strong>URL detected</strong> · Try Advanced tab for URL
                  extraction
                </AlertDescription>
              </Alert>
            )}

            {/* Code/Markdown detected with format suggestion */}
            {(detectedCode || suggestedFormat === 'markdown') &&
              !detectedURL && (
                <Alert className="border-purple-200 bg-purple-50 py-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <AlertDescription className="text-xs text-purple-800">
                    <strong>
                      {detectedCode ? 'Code' : 'Markdown'} detected
                    </strong>{' '}
                    · Suggested format: <strong>Markdown</strong>
                  </AlertDescription>
                </Alert>
              )}
          </>
        )}

        {/* Validation feedback - Only show if not valid and has content */}
        {showValidation && validationMessage && value && (
          <Alert className="border-amber-200 bg-amber-50 py-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800">
              {validationMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Status indicator - Minimal */}
        {value && !isValid && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>
              Need {Math.max(0, minLength - charCount)} more characters
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default SummarizerInput;
