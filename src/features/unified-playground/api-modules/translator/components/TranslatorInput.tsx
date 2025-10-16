/**
 * TranslatorInput Component
 * Text input area with language detection and validation
 */

import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertCircle, Command } from 'lucide-react';
import { type TranslatorInputProps, SUPPORTED_LANGUAGES } from '../types';
import { FieldError } from '../../shared/components';

/**
 * TranslatorInput Component
 *
 * Provides text input with:
 * - Auto-resizing textarea
 * - Character/word counting
 * - Language detection display
 * - Input validation
 * - Character limit (50,000)
 */
export function TranslatorInput({
  value,
  onChange,
  detectedLanguage,
  detectionConfidence,
  maxLength = 50000,
  placeholder = 'Paste or type text to translate...',
  onDetectLanguage,
  disabled = false,
  error,
  errorHelpText,
}: TranslatorInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  /**
   * Auto-resize textarea to fit content
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight (minimum 4 rows)
      const minHeight = 4 * 24; // 4 rows * 24px line height
      textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
    }
  }, [value]);

  /**
   * Update counts when value changes
   */
  useEffect(() => {
    const chars = value.length;
    const words = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;

    setCharCount(chars);
    setWordCount(words);

    // Show warning at 45,000 characters (90% of limit)
    setShowWarning(chars >= maxLength * 0.9);
  }, [value, maxLength]);

  /**
   * Handle text change with sanitization
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Sanitize input to prevent XSS
    const sanitized = DOMPurify.sanitize(newValue, { ALLOWED_TAGS: [] });

    // Don't allow input beyond maxLength
    if (sanitized.length <= maxLength) {
      onChange(sanitized);
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter triggers translation
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // Trigger custom event that parent can listen for
      const translateEvent = new CustomEvent('translator-translate', {
        bubbles: true,
        detail: { text: value },
      });
      e.currentTarget.dispatchEvent(translateEvent);
    }
  };

  /**
   * Get character count color based on usage
   */
  const getCharCountColor = () => {
    const percentage = (charCount / maxLength) * 100;
    if (percentage >= 100) return 'text-destructive';
    if (percentage >= 90) return 'text-orange-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  /**
   * Format detected language display
   */
  const getDetectedLanguageDisplay = () => {
    if (!detectedLanguage) return null;

    const langInfo = SUPPORTED_LANGUAGES[detectedLanguage];
    if (!langInfo) return null;

    const confidence = detectionConfidence
      ? `${Math.round(detectionConfidence)}%`
      : '';

    return {
      flag: langInfo.flag,
      name: langInfo.name,
      confidence,
    };
  };

  const detectedLangDisplay = getDetectedLanguageDisplay();

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📝 Input Text</h3>
        <div className="flex items-center gap-2">
          {/* Character/Word Count */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              Words: <span className="font-medium">{wordCount}</span>
            </span>
            <span className={getCharCountColor()}>
              Characters:{' '}
              <span className="font-medium">
                {charCount.toLocaleString()}/{maxLength.toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Character Limit Warning */}
      {showWarning && charCount < maxLength && (
        <Alert
          variant="default"
          className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20"
        >
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            Approaching character limit. {maxLength - charCount} characters
            remaining.
          </AlertDescription>
        </Alert>
      )}

      {/* Max Length Error */}
      {charCount >= maxLength && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Maximum character limit reached ({maxLength.toLocaleString()}{' '}
            characters).
          </AlertDescription>
        </Alert>
      )}

      {/* Textarea */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error ? 'translator-input-error input-stats' : 'input-stats'
          }
          className={`min-h-[120px] resize-none font-mono text-sm ${error ? 'border-red-400 dark:border-red-500' : ''}`}
          data-testid="translator-input"
          maxLength={maxLength}
          aria-label="Text to translate"
        />
        {/* Keyboard Shortcut Hint */}
        {!disabled && value.length > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-muted-foreground/60 pointer-events-none">
            <Command className="w-3 h-3" />
            <span>+Enter to translate</span>
          </div>
        )}
      </div>

      {/* Inline error message */}
      {error && (
        <FieldError
          id="translator-input-error"
          message={error}
          helpText={errorHelpText}
          severity="error"
        />
      )}

      {/* Footer Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Language Detection */}
        {detectedLangDisplay ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Search className="h-3 w-3" />
              Detected: {detectedLangDisplay.flag} {detectedLangDisplay.name}
              {detectedLangDisplay.confidence && (
                <span className="ml-1 opacity-70">
                  ({detectedLangDisplay.confidence} confidence)
                </span>
              )}
            </Badge>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {value.length > 10 && onDetectLanguage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDetectLanguage}
                className="h-7 gap-1 px-2"
                data-testid="detect-language-btn"
              >
                <Search className="h-3 w-3" />
                Detect Language
              </Button>
            )}
          </div>
        )}

        {/* Input Stats (for screen readers) */}
        <div id="input-stats" className="sr-only">
          {wordCount} words, {charCount} of {maxLength} characters
        </div>
      </div>

      {/* Help Text */}
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Paste or type text to translate. Supports up to{' '}
          {maxLength.toLocaleString()} characters.
        </p>
      )}
    </div>
  );
}
