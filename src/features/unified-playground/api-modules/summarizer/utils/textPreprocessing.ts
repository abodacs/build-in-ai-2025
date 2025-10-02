/**
 * Text Preprocessing Utilities
 *
 * Text cleaning, normalization, and preparation for summarization
 * Handles various text formats and edge cases
 *
 * @module textPreprocessing
 */

// ============================================================================
// Text Cleaning Functions
// ============================================================================

/**
 * Clean and normalize text for summarization
 * Removes excessive whitespace, normalizes line breaks, etc.
 *
 * @param {string} text - Raw text input
 * @returns {string} Cleaned text
 */
export function cleanText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleaned = text;

  // Normalize Unicode whitespace characters
  cleaned = cleaned.replace(/\u00A0/g, ' '); // Non-breaking space
  cleaned = cleaned.replace(/\u2003/g, ' '); // Em space
  cleaned = cleaned.replace(/\u2002/g, ' '); // En space
  cleaned = cleaned.replace(/\u2009/g, ' '); // Thin space

  // Normalize line endings (CRLF -> LF)
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');

  // Remove excessive blank lines (more than 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim leading/trailing whitespace from each line
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // Remove leading/trailing whitespace from entire text
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Remove HTML tags from text
 *
 * @param {string} text - Text with HTML
 * @returns {string} Text without HTML tags
 */
export function stripHTML(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove script and style tags with content
  let cleaned = text.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  );
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    '',
  );

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove all other HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  cleaned = decodeHTMLEntities(cleaned);

  return cleaned;
}

/**
 * Decode HTML entities
 *
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
export function decodeHTMLEntities(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '...',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
  };

  let decoded = text;

  // Replace named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Replace numeric entities (&#123; or &#xAB;)
  decoded = decoded.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10)),
  );
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );

  return decoded;
}

/**
 * Remove markdown formatting
 *
 * @param {string} text - Markdown text
 * @returns {string} Plain text
 */
export function stripMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleaned = text;

  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`[^`]+`/g, '');

  // Remove headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Remove bold and italic
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');

  // Remove links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove images
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // Remove horizontal rules
  cleaned = cleaned.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '');

  // Remove list markers
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');

  // Remove blockquotes
  cleaned = cleaned.replace(/^\s*>\s+/gm, '');

  return cleaned;
}

// ============================================================================
// Text Analysis Functions
// ============================================================================

/**
 * Count words in text
 *
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  const cleaned = text.trim();
  if (cleaned.length === 0) {
    return 0;
  }

  // Split by whitespace and filter empty strings
  const words = cleaned.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * Estimate reading time in minutes
 *
 * @param {string} text - Text to analyze
 * @param {number} wordsPerMinute - Reading speed (default: 200 WPM)
 * @returns {number} Estimated reading time in minutes
 */
export function estimateReadingTime(
  text: string,
  wordsPerMinute: number = 200,
): number {
  const wordCount = countWords(text);
  const minutes = wordCount / wordsPerMinute;
  return Math.ceil(minutes);
}

/**
 * Count characters (excluding whitespace)
 *
 * @param {string} text - Text to count
 * @returns {number} Character count
 */
export function countCharacters(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  return text.replace(/\s/g, '').length;
}

/**
 * Count sentences in text
 *
 * @param {string} text - Text to analyze
 * @returns {number} Sentence count
 */
export function countSentences(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // Split by sentence-ending punctuation followed by space or end of string
  const sentences = text
    .split(/[.!?]+[\s\n]+|[.!?]+$/)
    .filter((sentence) => sentence.trim().length > 0);

  return sentences.length;
}

/**
 * Detect if text is likely code
 *
 * @param {string} text - Text to analyze
 * @returns {boolean} True if text appears to be code
 */
export function isLikelyCode(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Check for common code patterns
  const codePatterns = [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /var\s+\w+\s*=/,
    /class\s+\w+/,
    /import\s+.*from/,
    /export\s+(default|const|class|function)/,
    /#include\s*</,
    /public\s+class/,
    /def\s+\w+\s*\(/,
  ];

  const matchCount = codePatterns.filter((pattern) =>
    pattern.test(text),
  ).length;

  // If 2 or more patterns match, likely code
  return matchCount >= 2;
}

/**
 * Detect if text contains markdown formatting
 *
 * @param {string} text - Text to analyze
 * @returns {boolean} True if text contains markdown
 */
export function hasMarkdownFormatting(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const markdownPatterns = [
    /^#{1,6}\s+/m,           // Headers
    /\*\*[^*]+\*\*/,          // Bold
    /\[.+\]\(.+\)/,           // Links
    /```[\s\S]*?```/,         // Code blocks
    /^\s*[-*+]\s+/m,          // Unordered lists
    /^\s*\d+\.\s+/m,          // Ordered lists
    /^\s*>\s+/m,              // Blockquotes
  ];

  const matchCount = markdownPatterns.filter((pattern) =>
    pattern.test(text),
  ).length;

  // If 2 or more patterns match, likely has markdown
  return matchCount >= 2;
}

/**
 * Suggest optimal output format based on text content
 *
 * @param {string} text - Text to analyze
 * @returns {'markdown' | 'plain-text'} Suggested format
 */
export function suggestOutputFormat(text: string): 'markdown' | 'plain-text' {
  if (!text || typeof text !== 'string') {
    return 'plain-text';
  }

  // If text has code or markdown, suggest markdown format
  if (isLikelyCode(text) || hasMarkdownFormatting(text)) {
    return 'markdown';
  }

  // Default to plain-text for regular content
  return 'plain-text';
}

/**
 * Detect primary language (simple heuristic)
 *
 * @param {string} text - Text to analyze
 * @returns {string} Language code (en, es, fr, etc.) or 'unknown'
 */
export function detectLanguage(text: string): string {
  if (!text || typeof text !== 'string' || text.length < 20) {
    return 'unknown';
  }

  // Simple detection based on common words
  const commonWords: Record<string, string[]> = {
    en: ['the', 'and', 'of', 'to', 'a', 'in', 'is', 'that', 'for', 'it'],
    es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se'],
    fr: ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je'],
    de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'],
  };

  const lowerText = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [lang, words] of Object.entries(commonWords)) {
    scores[lang] = words.filter((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      return regex.test(lowerText);
    }).length;
  }

  // Get language with highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    return 'unknown';
  }

  const detectedLang = Object.entries(scores).find(
    ([, score]) => score === maxScore,
  )?.[0];
  return detectedLang || 'unknown';
}

// ============================================================================
// Text Truncation Functions
// ============================================================================

/**
 * Truncate text to a maximum length
 * Tries to break at word boundaries
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length in characters
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...',
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  // Try to break at last word boundary before maxLength
  const truncated = text.slice(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    // If last space is reasonably close to end, use it
    return truncated.slice(0, lastSpace) + suffix;
  }

  // Otherwise, hard truncate
  return truncated + suffix;
}

/**
 * Extract first N sentences from text
 *
 * @param {string} text - Source text
 * @param {number} count - Number of sentences to extract
 * @returns {string} Extracted sentences
 */
export function extractFirstSentences(text: string, count: number): string {
  if (!text || typeof text !== 'string' || count <= 0) {
    return '';
  }

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, count).join(' ').trim();
}

// ============================================================================
// Text Validation Functions
// ============================================================================

/**
 * Check if text is valid for summarization
 *
 * @param {string} text - Text to validate
 * @param {number} minLength - Minimum length in characters (default: 100)
 * @returns {object} Validation result
 */
export function validateText(
  text: string,
  minLength: number = 100,
): { valid: boolean; reason?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, reason: 'Text is empty or not a string' };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'Text is empty' };
  }

  if (trimmed.length < minLength) {
    return {
      valid: false,
      reason: `Text is too short (${trimmed.length} characters, minimum ${minLength})`,
    };
  }

  const wordCount = countWords(trimmed);
  if (wordCount < 10) {
    return {
      valid: false,
      reason: `Text has too few words (${wordCount}, minimum 10)`,
    };
  }

  return { valid: true };
}

/**
 * Check if text contains mostly non-text characters
 *
 * @param {string} text - Text to check
 * @returns {boolean} True if text is mostly gibberish
 */
export function isGibberish(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return true;
  }

  // Count alphanumeric vs non-alphanumeric characters
  const alphanumeric = text.replace(/[^a-zA-Z0-9]/g, '').length;
  const total = text.length;

  // If less than 50% alphanumeric, likely gibberish
  return alphanumeric / total < 0.5;
}

// ============================================================================
// Export All Functions
// ============================================================================

export default {
  cleanText,
  stripHTML,
  decodeHTMLEntities,
  stripMarkdown,
  countWords,
  estimateReadingTime,
  countCharacters,
  countSentences,
  isLikelyCode,
  hasMarkdownFormatting,
  suggestOutputFormat,
  detectLanguage,
  truncateText,
  extractFirstSentences,
  validateText,
  isGibberish,
};
