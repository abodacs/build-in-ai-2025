/**
 * Secure Input Component
 * Enterprise-grade input component with comprehensive security, validation, and UX
 */

import { useState, useCallback, useMemo, forwardRef } from 'react';
import { AlertTriangle, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateApiInput, sanitizeText, rateLimiter } from '../utils/security';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface SecureInputProps {
  value: string;
  onChange: (value: string) => void;
  apiType?: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  showSecurityStatus?: boolean;
  enableRateLimit?: boolean;
  variant?: 'default' | 'large';
}

interface ValidationState {
  isValid: boolean;
  errors: string[];
  isValidating: boolean;
  securityLevel: 'secure' | 'warning' | 'danger';
}

// ============================================================================
// Secure Input Component
// ============================================================================

export const SecureInput = forwardRef<HTMLTextAreaElement, SecureInputProps>(
  (
    {
      value,
      onChange,
      apiType = 'general',
      placeholder = 'Enter your text here...',
      className,
      maxLength = 50000,
      required = false,
      disabled = false,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      onValidationChange,
      showSecurityStatus = true,
      enableRateLimit = true,
      variant = 'default',
    },
    ref,
  ) => {
    const [validation, setValidation] = useState<ValidationState>({
      isValid: true,
      errors: [],
      isValidating: false,
      securityLevel: 'secure',
    });

    const [isFocused, setIsFocused] = useState(false);

    // ============================================================================
    // Validation Logic
    // ============================================================================

    const validateInput = useCallback(
      async (inputValue: string) => {
        setValidation((prev) => ({ ...prev, isValidating: true }));

        // Rate limiting check
        if (
          enableRateLimit &&
          !rateLimiter.isAllowed(`input-${apiType}`, 30, 60000)
        ) {
          setValidation({
            isValid: false,
            errors: ['Too many validation requests. Please slow down.'],
            isValidating: false,
            securityLevel: 'warning',
          });
          return;
        }

        // Simulate async validation (in real app, this might call an API)
        await new Promise((resolve) => setTimeout(resolve, 100));

        const result = validateApiInput(inputValue, apiType);

        let securityLevel: ValidationState['securityLevel'] = 'secure';
        if (result.errors.length > 0) {
          securityLevel = result.errors.some(
            (e) => e.includes('unsafe') || e.includes('suspicious'),
          )
            ? 'danger'
            : 'warning';
        }

        const newValidation = {
          isValid: result.isValid,
          errors: result.errors,
          isValidating: false,
          securityLevel,
        };

        setValidation(newValidation);
        onValidationChange?.(result.isValid, result.errors);
      },
      [apiType, enableRateLimit, onValidationChange],
    );

    // ============================================================================
    // Event Handlers
    // ============================================================================

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const inputValue = e.target.value;

        // Apply immediate sanitization
        const sanitizedValue = sanitizeText(inputValue);

        // Update value
        onChange(sanitizedValue);

        // Validate
        validateInput(sanitizedValue);
      },
      [onChange, validateInput],
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    // ============================================================================
    // Computed Values
    // ============================================================================

    const characterCount = useMemo(() => value.length, [value]);
    const isNearLimit = useMemo(
      () => characterCount > maxLength * 0.8,
      [characterCount, maxLength],
    );
    const isOverLimit = useMemo(
      () => characterCount > maxLength,
      [characterCount, maxLength],
    );

    const inputClasses = useMemo(() => {
      const baseClasses = [
        'w-full rounded-lg border bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all duration-200',
      ];

      // Variant classes
      if (variant === 'large') {
        baseClasses.push('min-h-[120px] text-base');
      } else {
        baseClasses.push('min-h-[80px]');
      }

      // Validation state classes
      if (!validation.isValid) {
        baseClasses.push('border-destructive focus:ring-destructive');
      } else if (validation.securityLevel === 'warning') {
        baseClasses.push('border-yellow-500 focus:ring-yellow-500');
      } else {
        baseClasses.push('border-border');
      }

      // Focus state
      if (isFocused) {
        baseClasses.push('ring-2');
      }

      return cn(baseClasses, className);
    }, [variant, validation, isFocused, className]);

    // ============================================================================
    // Security Status Component
    // ============================================================================

    const SecurityStatus = () => {
      if (!showSecurityStatus) return null;

      const getStatusIcon = () => {
        if (validation.isValidating) {
          return <Loader2 className="w-4 h-4 animate-spin" />;
        }

        switch (validation.securityLevel) {
          case 'secure':
            return <Shield className="w-4 h-4 text-green-600" />;
          case 'warning':
            return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
          case 'danger':
            return <AlertTriangle className="w-4 h-4 text-red-600" />;
          default:
            return <CheckCircle className="w-4 h-4 text-gray-400" />;
        }
      };

      const getStatusText = () => {
        if (validation.isValidating) return 'Validating...';
        if (validation.errors.length === 0) return 'Input validated';
        return `${validation.errors.length} issue${validation.errors.length > 1 ? 's' : ''}`;
      };

      return (
        <div className="flex items-center gap-2 text-xs">
          {getStatusIcon()}
          <span
            className={cn(
              'font-medium',
              validation.securityLevel === 'secure' && 'text-green-600',
              validation.securityLevel === 'warning' && 'text-yellow-600',
              validation.securityLevel === 'danger' && 'text-red-600',
            )}
          >
            {getStatusText()}
          </span>
        </div>
      );
    };

    // ============================================================================
    // Character Counter Component
    // ============================================================================

    const CharacterCounter = () => (
      <div
        className={cn(
          'text-xs font-medium',
          isOverLimit && 'text-red-600',
          isNearLimit && !isOverLimit && 'text-yellow-600',
          !isNearLimit && 'text-muted-foreground',
        )}
      >
        {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
      </div>
    );

    // ============================================================================
    // Error Display Component
    // ============================================================================

    const ErrorDisplay = () => {
      if (validation.errors.length === 0) return null;

      return (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs text-red-600"
              role="alert"
            >
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      );
    };

    // ============================================================================
    // Render
    // ============================================================================

    return (
      <div className="space-y-2">
        {/* Main Input */}
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={inputClasses}
            maxLength={maxLength + 100} // Allow some buffer for validation
            required={required}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-invalid={!validation.isValid}
            spellCheck="true"
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
          />

          {/* Security indicator overlay */}
          {showSecurityStatus && (
            <div className="absolute top-2 right-2 opacity-70">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  validation.securityLevel === 'secure' && 'bg-green-500',
                  validation.securityLevel === 'warning' && 'bg-yellow-500',
                  validation.securityLevel === 'danger' && 'bg-red-500',
                )}
              />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <SecurityStatus />
          <CharacterCounter />
        </div>

        {/* Error Messages */}
        <ErrorDisplay />
      </div>
    );
  },
);

SecureInput.displayName = 'SecureInput';

// ============================================================================
// Quick Input Component (for shorter inputs)
// ============================================================================

export const SecureQuickInput = forwardRef<
  HTMLInputElement,
  Omit<SecureInputProps, 'variant'> & {
    type?: 'text' | 'email' | 'url';
  }
>(({ value, onChange, type = 'text', className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={(e) => onChange(sanitizeText(e.target.value))}
      className={cn(
        'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

SecureQuickInput.displayName = 'SecureQuickInput';
