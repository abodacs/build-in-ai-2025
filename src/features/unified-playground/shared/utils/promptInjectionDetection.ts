/**
 * Prompt Injection Detection Engine
 * OWASP LLM01:2025 Compliant
 *
 * Detects potential prompt injection attempts using pattern matching,
 * confidence scoring, and multi-category classification.
 *
 * @module promptInjectionDetection
 */

export type InjectionCategory =
  | 'instruction_override'
  | 'role_playing'
  | 'data_exfiltration'
  | 'delimiter_attack'
  | 'encoding_attack'
  | 'context_manipulation'
  | 'system_prompt_leak'
  | 'jailbreak_attempt';

export interface InjectionDetectionResult {
  isInjection: boolean;
  confidence: number; // 0-1 scale
  category?: InjectionCategory;
  matchedPatterns: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

/**
 * Instruction Override Patterns
 * Attempts to override or ignore system instructions
 */
const INSTRUCTION_OVERRIDE_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|prompts?|commands?|rules?)/i,
  /ignore\s+(all\s+)?(instructions?|prompts?|commands?|rules?)/i, // Simpler pattern without "previous"
  /ignore\s+(previous|prior|above)\s+\w+/i, // Weak pattern for "ignore previous [anything]"
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|content)/i,
  /forget\s+(all\s+)?(previous|above|your)\s+(instructions?|training|prompts?)/i,
  /override\s+(system|previous|all)\s+(instructions?|prompts?|settings?)/i,
  /new\s+(instruction|prompt|rule|command)s?:/i,
  /from\s+now\s+on,?\s+(ignore|disregard|forget)/i,
  /instead,?\s+(ignore|disregard|do\s+this)/i,
  /delete\s+(all\s+)?previous\s+(instructions?|rules?)/i,
  /clear\s+(all\s+)?previous\s+(instructions?|context)/i,
  /replace\s+(all\s+)?instructions?\s+with/i,
];

/**
 * Role-Playing Patterns
 * Attempts to make the AI assume a different role
 */
const ROLE_PLAYING_PATTERNS: RegExp[] = [
  /you\s+are\s+now\s+(a|an)?\s*[a-z\s]+/i, // Made "a|an" optional for patterns like "you are now admin"
  /act\s+as\s+(a|an)?\s*[a-z\s]+/i, // Made "a|an" optional for patterns like "act as tutor"
  /pretend\s+(you\s+are|to\s+be)\s+(a|an)?\s*[a-z\s]+/i, // Made "a|an" optional
  /simulate\s+(a|an)?\s*[a-z\s]+/i, // Made "a|an" optional
  /roleplay\s+as\s+(a|an)?\s*[a-z\s]+/i, // Made "a|an" optional
  /you('re|\s+are)\s+(now\s+)?in\s+[a-z\s]+\s+mode/i,
  /enable\s+[a-z\s]+\s+mode/i,
  /activate\s+[a-z\s]+\s+(mode|personality)/i,
  /switch\s+to\s+[a-z\s]+\s+(mode|persona)/i,
  /DAN\s+mode/i, // Do Anything Now
  /developer\s+mode/i,
  /admin\s+mode/i,
  /god\s+mode/i,
  /unrestricted\s+mode/i,
];

/**
 * Data Exfiltration Patterns
 * Attempts to extract system prompts or training data
 */
const DATA_EXFILTRATION_PATTERNS: RegExp[] = [
  /reveal\s+your\s+(system\s+|internal\s+)?(prompt|instructions?|training|rules?)/i,
  /reveal\s+(system\s+|internal\s+)?(prompt|instructions?)/i, // Simpler pattern without "your"
  /show\s+me\s+your\s+(system\s+|internal\s+)?(prompt|instructions?|source|code)/i,
  /what\s+(is|are)\s+your\s+(system\s+|internal\s+)?(instructions?|prompts?|rules?)/i,
  /tell\s+me\s+your\s+(system\s+|internal\s+)?(prompt|instructions?|training|configuration)/i,
  /output\s+your\s+(system\s+|internal\s+)?(prompt|instructions?|configuration|training\s+data)/i,
  /print\s+your\s+(system\s+|internal\s+|initial\s+)?(prompt|instructions?|settings?)/i,
  /display\s+your\s+(system\s+|internal\s+)?(instructions?|prompts?|rules?)/i,
  /repeat\s+(back\s+)?your\s+(system\s+|internal\s+)?(prompt|instructions?)/i,
  /what\s+are\s+you\s+programmed\s+to/i,
  /what\s+did\s+the\s+developer\s+(tell|say|instruct)/i, // Added pattern for developer instructions
  /show\s+initial\s+(instructions?|prompts?)/i,
  /reveal\s+hidden\s+(instructions?|context)/i,
  // Phase 2C: Add missing indirect query patterns
  /what\s+are\s+your\s+(internal\s+)?rules/i,
  /tell\s+me\s+your\s+(system\s+)?configuration/i,
  /what\s+are\s+your\s+(system\s+)?instructions/i,
  /describe\s+your\s+(system\s+)?settings/i,
  /what\s+were\s+you\s+told\s+to\s+do/i,
];

/**
 * Delimiter Attack Patterns
 * Attempts to use delimiters to inject instructions
 */
const DELIMITER_ATTACK_PATTERNS: RegExp[] = [
  /\[SYSTEM\]/i,
  /\[ADMIN\]/i,
  /\[USER\]/i,
  /\[INST\]/i, // Instruction marker
  /\[\/INST\]/i,
  /<<<[A-Z_]+>>>/,
  /###\s*(SYSTEM|ADMIN|USER|END|START)/i,
  /---\s*(END|START)\s+(OF\s+)?(SYSTEM|USER|DOCUMENT|INPUT|CONTEXT)/i,
  /<\|system\|>/i,
  /<\|user\|>/i,
  /<\|assistant\|>/i,
  /\{SYSTEM\}/i,
  /\{END\}/i,
];

/**
 * Encoding Attack Patterns
 * Attempts to use encoding to bypass detection
 */
const ENCODING_ATTACK_PATTERNS: RegExp[] = [
  /[A-Za-z0-9+/]{30,}={0,2}/, // Potential Base64 (30+ chars to catch common encodings)
  /(?:%[0-9A-F]{2}){8,}/i, // URL encoding chains (8+ consecutive encoded chars)
  /(?:\\u[0-9A-F]{4}){4,}/i, // Unicode escape sequences (4+ consecutive)
  /(?:\\x[0-9A-F]{2}){4,}/i, // Hex escape sequences (4+ consecutive)
  /(?:&#\d{2,4};){4,}/, // HTML entities (4+ consecutive)
  /rot13|base64|atob|btoa|decode|unescape/i,
];

/**
 * Context Manipulation Patterns
 * Attempts to manipulate conversation context
 */
const CONTEXT_MANIPULATION_PATTERNS: RegExp[] = [
  /previous\s+conversation\s+(was|is)\s+(fake|false|test)/i,
  /everything\s+before\s+this\s+(was|is)\s+(fake|test|wrong)/i,
  /ignore\s+context/i,
  /reset\s+context/i,
  /clear\s+history/i,
  /new\s+conversation/i,
  /start\s+over/i,
  /cancel\s+previous\s+(request|instruction)/i,
];

/**
 * System Prompt Leak Patterns
 * Attempts to leak system configuration
 */
const SYSTEM_PROMPT_LEAK_PATTERNS: RegExp[] = [
  /what\s+was\s+your\s+first\s+(instruction|prompt|message)/i,
  /what\s+did\s+the\s+(developer|admin|system)\s+tell\s+you/i,
  /read\s+your\s+(initial|first|system)\s+(prompt|instructions?)/i,
  /configuration\s+(file|settings?|parameters?)/i,
  /system\s+(configuration|settings?|parameters?)/i,
];

/**
 * Jailbreak Attempt Patterns
 * Attempts to bypass safety guidelines
 */
const JAILBREAK_ATTEMPT_PATTERNS: RegExp[] = [
  /bypass\s+(safety|ethical|content)\s+(guidelines?|rules?|filters?)/i,
  /ignore\s+(safety|ethical|moral)\s+(guidelines?|rules?|constraints?)/i,
  /without\s+(safety|ethical|moral)\s+(guidelines?|constraints?|limits?)/i,
  /unrestricted\s+(access|mode|version)/i,
  /jailbreak/i,
  /uncensored/i,
  /no\s+(restrictions?|limits?|rules?|filters?)/i,
  /do\s+anything\s+now/i, // DAN
];

/**
 * Pattern Categories Mapping
 * Order matters: delimiter attacks are checked first to avoid false categorization
 */
const PATTERN_CATEGORIES: Record<InjectionCategory, RegExp[]> = {
  delimiter_attack: DELIMITER_ATTACK_PATTERNS, // Check delimiter attacks first
  instruction_override: INSTRUCTION_OVERRIDE_PATTERNS,
  role_playing: ROLE_PLAYING_PATTERNS,
  data_exfiltration: DATA_EXFILTRATION_PATTERNS,
  encoding_attack: ENCODING_ATTACK_PATTERNS,
  context_manipulation: CONTEXT_MANIPULATION_PATTERNS,
  system_prompt_leak: SYSTEM_PROMPT_LEAK_PATTERNS,
  jailbreak_attempt: JAILBREAK_ATTEMPT_PATTERNS,
};

/**
 * Category Severity Mapping
 */
const CATEGORY_SEVERITY: Record<
  InjectionCategory,
  'low' | 'medium' | 'high' | 'critical'
> = {
  instruction_override: 'critical',
  role_playing: 'high',
  data_exfiltration: 'critical',
  delimiter_attack: 'high',
  encoding_attack: 'medium',
  context_manipulation: 'medium',
  system_prompt_leak: 'critical',
  jailbreak_attempt: 'critical',
};

/**
 * Advanced Injection Detector Class
 */
export class InjectionDetector {
  private customPatterns: Map<string, RegExp[]> = new Map();
  private sensitivityThreshold: number = 0.5; // 0-1 scale

  constructor(threshold: number = 0.5) {
    this.sensitivityThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Add custom detection patterns
   */
  addCustomPattern(category: string, pattern: RegExp): void {
    if (!this.customPatterns.has(category)) {
      this.customPatterns.set(category, []);
    }
    this.customPatterns.get(category)!.push(pattern);
  }

  /**
   * Main detection method
   */
  detect(text: string): InjectionDetectionResult {
    if (!text || text.trim().length === 0) {
      return {
        isInjection: false,
        confidence: 0,
        matchedPatterns: [],
        severity: 'low',
        recommendation: 'Input is empty',
      };
    }

    // Phase 2A: Input size validation to prevent DoS (CRITICAL FIX)
    const MAX_INPUT_SIZE = 100000; // 100KB limit
    if (text.length > MAX_INPUT_SIZE) {
      return {
        isInjection: true,
        confidence: 1.0,
        category: 'context_manipulation',
        matchedPatterns: [
          `Input exceeds maximum size limit (${MAX_INPUT_SIZE} characters)`,
        ],
        severity: 'critical',
        recommendation: `Input size (${text.length} chars) exceeds safety limit. Reduce input size to prevent resource exhaustion.`,
      };
    }

    const results: {
      category: InjectionCategory;
      matches: string[];
      score: number;
    }[] = [];

    // Check each category
    for (const [category, patterns] of Object.entries(PATTERN_CATEGORIES)) {
      const matches: string[] = [];
      let score = 0;

      for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (match) {
          matches.push(match[0]);
          score += 1;
        }
      }

      if (matches.length > 0) {
        results.push({
          category: category as InjectionCategory,
          matches,
          score,
        });
      }
    }

    // Check custom patterns
    this.customPatterns.forEach((patterns, category) => {
      const matches: string[] = [];
      let score = 0;

      patterns.forEach((pattern) => {
        const match = pattern.exec(text);
        if (match) {
          matches.push(match[0]);
          score += 1;
        }
      });

      if (matches.length > 0) {
        results.push({
          category: category as InjectionCategory,
          matches,
          score,
        });
      }
    });

    // No matches found
    if (results.length === 0) {
      return {
        isInjection: false,
        confidence: 0,
        matchedPatterns: [],
        severity: 'low',
        recommendation: 'No injection patterns detected',
      };
    }

    // Phase 2E: Prioritize delimiter_attack over other categories
    // Apply priority multiplier for delimiter attacks
    const prioritizedResults = results.map((result) => ({
      ...result,
      priorityScore:
        result.category === 'delimiter_attack'
          ? result.score * 2 // Double priority for delimiter attacks
          : result.score,
    }));

    // Sort by priority score (delimiter attacks get higher priority)
    prioritizedResults.sort((a, b) => b.priorityScore - a.priorityScore);
    const topResult = prioritizedResults[0]!; // Safe: results.length > 0 checked above

    // Calculate confidence based on number of matches
    // Base confidence: 0.65 for any pattern match (allows distinguishing weak vs strong attacks)
    // Additional: +0.15 per extra match
    // Result: 1 match = 0.65, 2 matches = 0.8, 3+ = 0.95-1.0
    const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
    let baseConfidence = 0.65;

    // Phase 3A: Reduce false positives for legitimate role-playing (educational contexts)
    if (topResult.category === 'role_playing') {
      const lowerText = text.toLowerCase();
      const isLegitimateEducational =
        lowerText.includes('helpful') ||
        lowerText.includes('tutor') ||
        lowerText.includes('teacher') ||
        lowerText.includes('expert') ||
        lowerText.includes('guide') ||
        lowerText.includes('assistant');

      if (isLegitimateEducational) {
        baseConfidence = 0.5; // Lower confidence for legitimate contexts
      }
    }

    const matchBonus = Math.min((totalMatches - 1) * 0.15, 0.35);
    const confidence = Math.min(baseConfidence + matchBonus, 1.0);

    const isInjection = confidence >= this.sensitivityThreshold;
    const severity = CATEGORY_SEVERITY[topResult.category];

    return {
      isInjection,
      confidence,
      category: topResult.category,
      matchedPatterns: topResult.matches,
      severity,
      recommendation: this.getRecommendation(
        topResult.category,
        confidence,
        severity,
      ),
    };
  }

  /**
   * Get recommendation based on detection result
   */
  private getRecommendation(
    _category: InjectionCategory,
    confidence: number,
    severity: 'low' | 'medium' | 'high' | 'critical',
  ): string {
    if (severity === 'critical') {
      return 'Block input immediately. This appears to be a serious injection attempt.';
    }

    if (severity === 'high') {
      return 'Review and sanitize input. High risk of prompt injection.';
    }

    if (confidence > 0.7) {
      return 'Sanitize input and apply strict validation before processing.';
    }

    return 'Monitor input. Low-to-medium risk detected.';
  }

  /**
   * Batch detection for multiple inputs
   */
  detectBatch(texts: string[]): InjectionDetectionResult[] {
    return texts.map((text) => this.detect(text));
  }

  /**
   * Get detection statistics
   */
  getStats(results: InjectionDetectionResult[]): {
    totalInjections: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    averageConfidence: number;
  } {
    const stats = {
      totalInjections: 0,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      averageConfidence: 0,
    };

    let totalConfidence = 0;

    for (const result of results) {
      if (result.isInjection) {
        stats.totalInjections++;

        if (result.category) {
          stats.byCategory[result.category] =
            (stats.byCategory[result.category] || 0) + 1;
        }

        stats.bySeverity[result.severity] =
          (stats.bySeverity[result.severity] || 0) + 1;

        totalConfidence += result.confidence;
      }
    }

    stats.averageConfidence =
      stats.totalInjections > 0 ? totalConfidence / stats.totalInjections : 0;

    return stats;
  }
}

/**
 * Singleton detector instance (default sensitivity)
 */
const defaultDetector = new InjectionDetector(0.5);

/**
 * Quick detection function (uses default detector)
 */
export function detectInjection(text: string): InjectionDetectionResult {
  return defaultDetector.detect(text);
}

/**
 * Create a custom detector with specific threshold
 */
export function createDetector(threshold: number = 0.5): InjectionDetector {
  return new InjectionDetector(threshold);
}

/**
 * Check if text contains any suspicious keywords
 */
export function containsSuspiciousKeywords(text: string): boolean {
  const keywords = [
    'ignore',
    'disregard',
    'forget',
    'override',
    'bypass',
    'jailbreak',
    'unrestricted',
    'system prompt',
    'reveal',
    '[SYSTEM]',
    '[ADMIN]',
    'DAN mode',
  ];

  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Sanitize delimiter attempts
 */
export function sanitizeDelimiters(text: string): string {
  let sanitized = text;

  // Remove common delimiter patterns
  const delimiterPatterns = [
    /\[SYSTEM\]/gi,
    /\[ADMIN\]/gi,
    /\[USER\]/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<<<[A-Z_]+>>>/g,
    /###\s*(SYSTEM|ADMIN|USER|END|START)/gi,
    /---\s*(END|START)\s+(OF\s+)?(SYSTEM|USER|DOCUMENT|INPUT)/gi,
  ];

  for (const pattern of delimiterPatterns) {
    sanitized = sanitized.replace(pattern, '[REMOVED]');
  }

  return sanitized;
}

/**
 * Extract potentially malicious segments for logging
 */
export function extractMaliciousSegments(
  text: string,
  maxLength: number = 100,
): string[] {
  const result = detectInjection(text);

  if (!result.isInjection) {
    return [];
  }

  return result.matchedPatterns.map((pattern) => {
    const index = text.toLowerCase().indexOf(pattern.toLowerCase());
    if (index === -1) return pattern;

    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + pattern.length + 20);
    const segment = text.substring(start, end);

    return segment.length > maxLength
      ? segment.substring(0, maxLength) + '...'
      : segment;
  });
}

/**
 * Validate input against injection patterns with detailed result
 */
export function validateInput(input: string): {
  isValid: boolean;
  error?: string;
  sanitized: string;
  detectionResult: InjectionDetectionResult;
} {
  const detectionResult = detectInjection(input);

  if (
    detectionResult.isInjection &&
    (detectionResult.severity === 'critical' ||
      detectionResult.severity === 'high')
  ) {
    return {
      isValid: false,
      error: `Input blocked: ${detectionResult.category} detected (confidence: ${(detectionResult.confidence * 100).toFixed(0)}%)`,
      sanitized: '',
      detectionResult,
    };
  }

  // Sanitize delimiters for medium/low severity
  const sanitized = sanitizeDelimiters(input);

  return {
    isValid: true,
    sanitized,
    detectionResult,
  };
}
