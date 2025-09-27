/**
 * Security Utilities for Chrome AI DevBench
 * Comprehensive input validation, XSS protection, and security measures
 */

import { z } from 'zod'
import DOMPurify from 'dompurify'

// ============================================================================
// Input Validation Schemas
// ============================================================================

/**
 * Base text input validation - prevents XSS and validates content
 */
export const textInputSchema = z
  .string()
  .min(1, 'Input cannot be empty')
  .max(50000, 'Input exceeds maximum length (50,000 characters)')
  .refine(
    (val) => !containsSuspiciousPatterns(val),
    'Input contains potentially unsafe content'
  )
  .refine(
    (val) => !containsExcessiveWhitespace(val),
    'Input contains excessive whitespace'
  )

/**
 * Configuration value validation
 */
export const configValueSchema = z.union([
  z.string().max(1000),
  z.number().min(0).max(1000),
  z.boolean(),
  z.array(z.string().max(100)).max(10)
])

/**
 * Language code validation (for Translator API)
 */
export const languageCodeSchema = z
  .string()
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code format')
  .refine(
    (val) => SUPPORTED_LANGUAGES.includes(val),
    'Language not supported'
  )

/**
 * File name validation (for file uploads)
 */
export const fileNameSchema = z
  .string()
  .min(1, 'Filename cannot be empty')
  .max(255, 'Filename too long')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters')
  .refine(
    (val) => !DANGEROUS_EXTENSIONS.some(ext => val.toLowerCase().endsWith(ext)),
    'File type not allowed'
  )

// ============================================================================
// Security Constants
// ============================================================================

/**
 * Supported language codes (whitelist approach)
 */
const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
  'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no'
]

/**
 * Dangerous file extensions to block
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js',
  '.jar', '.app', '.deb', '.pkg', '.dmg', '.iso', '.msi'
]

/**
 * Suspicious patterns that could indicate XSS or injection attempts
 */
const SUSPICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
  /@import/gi,
  /url\s*\(/gi
]

// ============================================================================
// Input Sanitization Functions
// ============================================================================

/**
 * Sanitize HTML content using DOMPurify
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'span', 'div'],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea'],
    USE_PROFILES: { html: true }
  })
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return ''

  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .trim()
    .substring(0, 50000) // Enforce max length
}

/**
 * Sanitize configuration values
 */
export function sanitizeConfig(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeText(value)
  }

  if (typeof value === 'number') {
    return isFinite(value) ? Math.max(0, Math.min(1000, value)) : 0
  }

  if (typeof value === 'boolean') {
    return Boolean(value)
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 10) // Limit array size
      .map(item => typeof item === 'string' ? sanitizeText(item) : null)
      .filter(Boolean)
  }

  return null
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Check if text contains suspicious patterns
 */
function containsSuspiciousPatterns(text: string): boolean {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(text))
}

/**
 * Check if text contains excessive whitespace (potential DoS)
 */
function containsExcessiveWhitespace(text: string): boolean {
  const whitespaceRatio = (text.match(/\s/g) || []).length / text.length
  return whitespaceRatio > 0.5 && text.length > 1000
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: 'File size exceeds 10MB limit' }
  }

  // Validate filename
  try {
    fileNameSchema.parse(file.name)
  } catch (error) {
    return { isValid: false, error: 'Invalid filename' }
  }

  // Check MIME type whitelist
  const allowedTypes = [
    'text/plain',
    'text/markdown',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' }
  }

  return { isValid: true }
}

// ============================================================================
// Security Headers and CSP
// ============================================================================

/**
 * Generate Content Security Policy header value
 */
export function generateCSP(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Vite in dev
    "style-src 'self' 'unsafe-inline'", // Required for styled components
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ]

  return directives.join('; ')
}

/**
 * Security headers for production deployment
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSP(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
} as const

// ============================================================================
// Secure Input Component Validation
// ============================================================================

/**
 * Validate and sanitize API input
 */
export function validateApiInput(input: string, apiType: string): {
  isValid: boolean
  sanitizedInput: string
  errors: string[]
} {
  const errors: string[] = []

  try {
    // Basic validation
    textInputSchema.parse(input)

    // API-specific validation
    const sanitizedInput = sanitizeText(input)

    // Additional checks based on API type
    if (apiType === 'prompt' && sanitizedInput.length > 30000) {
      errors.push('Prompt input too long for Prompt API')
    }

    if (apiType === 'summarizer' && sanitizedInput.length < 100) {
      errors.push('Text too short for effective summarization')
    }

    return {
      isValid: errors.length === 0,
      sanitizedInput,
      errors
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => e.message))
    } else {
      errors.push('Validation failed')
    }

    return {
      isValid: false,
      sanitizedInput: sanitizeText(input),
      errors
    }
  }
}

// ============================================================================
// Rate Limiting (Client-side)
// ============================================================================

/**
 * Simple client-side rate limiting
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  /**
   * Check if request is allowed
   */
  isAllowed(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs)

    if (validRequests.length >= maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)

    return true
  }

  /**
   * Clear rate limiting data
   */
  clear(key?: string): void {
    if (key) {
      this.requests.delete(key)
    } else {
      this.requests.clear()
    }
  }
}

export const rateLimiter = new RateLimiter()

// ============================================================================
// Export All Validation Schemas
// ============================================================================

export const schemas = {
  textInput: textInputSchema,
  configValue: configValueSchema,
  languageCode: languageCodeSchema,
  fileName: fileNameSchema
} as const

export type TextInput = z.infer<typeof textInputSchema>
export type ConfigValue = z.infer<typeof configValueSchema>
export type LanguageCode = z.infer<typeof languageCodeSchema>
export type FileName = z.infer<typeof fileNameSchema>