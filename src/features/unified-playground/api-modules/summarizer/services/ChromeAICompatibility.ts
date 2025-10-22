/**
 * Chrome AI Compatibility Layer
 *
 * Handles differences between window.Summarizer and self.Summarizer APIs
 * Provides unified interface regardless of which API version is available
 *
 * @module ChromeAICompatibility
 */

import type {
  SummarizerAPI,
  SummarizerAvailability,
  PlaygroundAvailability,
  APIVersion,
  BrowserCapabilities,
  SummarizerCreateOptions,
  SummarizeOptions,
} from '../types/summarizer.types';

// ============================================================================
// Chrome AI Compatibility Service
// ============================================================================

export class ChromeAICompatibility {
  private static cachedAPIVersion: APIVersion | null = null;
  private static cachedCapabilities: BrowserCapabilities | null = null;

  // ============================================================================
  // API Version Detection
  // ============================================================================

  /**
   * Detect which version of the Summarizer API is available
   *
   * @returns {APIVersion} 'self', 'window', or 'none'
   */
  static detectAPIVersion(): APIVersion {
    if (this.cachedAPIVersion) {
      return this.cachedAPIVersion;
    }

    // Check for self.Summarizer (official Chrome AI)
    if ('Summarizer' in self) {
      this.cachedAPIVersion = 'self';
      return 'self';
    }

    // Check for window.Summarizer (playground/polyfill)
    if (typeof window !== 'undefined' && 'Summarizer' in window) {
      this.cachedAPIVersion = 'window';
      return 'window';
    }

    this.cachedAPIVersion = 'none';
    return 'none';
  }

  /**
   * Get the appropriate Summarizer API based on availability
   *
   * @returns {SummarizerAPI | null} API instance or null if not available
   */
  static getSummarizerAPI(): SummarizerAPI | null {
    const version = this.detectAPIVersion();

    switch (version) {
      case 'self':
        return 'Summarizer' in self ? (self.Summarizer as SummarizerAPI) : null;

      case 'window':
        return typeof window !== 'undefined' && 'Summarizer' in window
          ? (window.Summarizer as SummarizerAPI)
          : null;

      case 'none':
      default:
        return null;
    }
  }

  /**
   * Check if API is supported
   *
   * @returns {boolean} True if any API version is available
   */
  static isSupported(): boolean {
    return this.detectAPIVersion() !== 'none';
  }

  // ============================================================================
  // Availability Checking with Normalization
  // ============================================================================

  /**
   * Check availability and normalize response across API versions
   * Handles differences between window.Summarizer and self.Summarizer
   *
   * @returns {Promise<SummarizerAvailability>} Normalized availability status
   */
  static async checkAvailability(): Promise<SummarizerAvailability> {
    const api = this.getSummarizerAPI();

    if (!api || !api.availability) {
      return 'no';
    }

    try {
      const rawAvailability = await api.availability();
      return this.normalizeAvailability(rawAvailability);
    } catch (error) {
      console.error('Failed to check Chrome AI availability:', error);
      return 'no';
    }
  }

  /**
   * Normalize availability responses from different API versions
   *
   * @param {unknown} rawAvailability - Raw availability response
   * @returns {SummarizerAvailability} Normalized availability
   */
  private static normalizeAvailability(
    rawAvailability: unknown,
  ): SummarizerAvailability {
    // Official API returns: 'no', 'after-download', 'available'
    if (
      rawAvailability === 'no' ||
      rawAvailability === 'after-download' ||
      rawAvailability === 'available'
    ) {
      return rawAvailability as SummarizerAvailability;
    }

    // Playground API might return: 'not-available', 'downloadable', 'available'
    const playgroundAvailability = rawAvailability as PlaygroundAvailability;

    switch (playgroundAvailability) {
      case 'available':
        return 'available';

      case 'downloadable':
        return 'after-download';

      case 'downloading':
        // Model is currently being downloaded
        return 'after-download';

      case 'not-available':
        return 'no';

      default:
        console.warn('Unknown availability status:', rawAvailability);
        return 'no';
    }
  }

  // ============================================================================
  // Capability Detection
  // ============================================================================

  /**
   * Detect browser capabilities for Chrome AI features
   *
   * @returns {Promise<BrowserCapabilities>} Detailed capability information
   */
  static async detectCapabilities(): Promise<BrowserCapabilities> {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    const version = this.detectAPIVersion();
    const supported = version !== 'none';

    if (!supported) {
      this.cachedCapabilities = {
        supported: false,
        version: 'none',
        availability: 'no',
        capabilities: {
          streaming: false,
          downloadProgress: false,
          contexts: false,
        },
      };
      return this.cachedCapabilities;
    }

    const availability = await this.checkAvailability();
    const api = this.getSummarizerAPI();

    // Only check capabilities if model is ready
    // Skip if model needs download to avoid "user activation required" errors
    const canCheckCapabilities = availability === 'available';

    // Check if streaming is supported (only if model is ready)
    const streamingSupported = canCheckCapabilities
      ? await this.checkStreamingSupport(api)
      : true; // Assume true, will be checked later when model is ready

    // Check if download progress monitoring is supported
    const downloadProgressSupported =
      await this.checkDownloadProgressSupport(api);

    // Check if contexts are supported
    const contextsSupported = await this.checkContextSupport(api);

    this.cachedCapabilities = {
      supported: true,
      version,
      availability,
      capabilities: {
        streaming: streamingSupported,
        downloadProgress: downloadProgressSupported,
        contexts: contextsSupported,
      },
    };

    return this.cachedCapabilities;
  }

  /**
   * Check if streaming summarization is supported
   *
   * @param {SummarizerAPI | null} api - API instance
   * @returns {Promise<boolean>} True if streaming is supported
   */
  private static async checkStreamingSupport(
    api: SummarizerAPI | null,
  ): Promise<boolean> {
    if (!api) return false;

    try {
      // Try to create a summarizer and check for summarizeStreaming method
      const summarizer = await api.create({
        type: 'tldr',
        format: 'plain-text',
        length: 'medium',
        sharedContext: '',
        outputLanguage: 'en',
      });

      if (!summarizer) return false;

      const hasStreaming = 'summarizeStreaming' in summarizer;

      // Clean up
      if ('destroy' in summarizer && typeof summarizer.destroy === 'function') {
        summarizer.destroy();
      }

      return hasStreaming;
    } catch (error) {
      console.warn('Could not check streaming support:', error);
      return false;
    }
  }

  /**
   * Check if download progress monitoring is supported
   *
   * @param {SummarizerAPI | null} api - API instance
   * @returns {Promise<boolean>} True if download progress is supported
   */
  private static async checkDownloadProgressSupport(
    api: SummarizerAPI | null,
  ): Promise<boolean> {
    if (!api) return false;

    // Check if create accepts monitor option
    // We can't actually test this without triggering a download
    // So we assume it's supported if the API is available
    return true;
  }

  /**
   * Check if context (sharedContext, context) is supported
   *
   * @param {SummarizerAPI | null} api - API instance
   * @returns {Promise<boolean>} True if contexts are supported
   */
  private static async checkContextSupport(
    api: SummarizerAPI | null,
  ): Promise<boolean> {
    if (!api) return false;

    // Context support is part of the official spec
    // Assume it's available if the API is available
    return true;
  }

  // ============================================================================
  // Option Normalization
  // ============================================================================

  /**
   * Normalize create options across API versions
   * Ensures options are compatible with both window and self APIs
   *
   * @param {SummarizerCreateOptions} options - Options to normalize
   * @returns {SummarizerCreateOptions} Normalized options
   */
  static normalizeCreateOptions(
    options: SummarizerCreateOptions,
  ): SummarizerCreateOptions {
    const normalized: SummarizerCreateOptions = { ...options };

    // Ensure valid type
    if (
      normalized.type &&
      !['key-points', 'tldr', 'teaser', 'headline'].includes(normalized.type)
    ) {
      console.warn(
        `Invalid summary type: ${normalized.type}, defaulting to 'tldr'`,
      );
      normalized.type = 'tldr';
    }

    // Ensure valid format
    if (
      normalized.format &&
      !['markdown', 'plain-text'].includes(normalized.format)
    ) {
      console.warn(
        `Invalid format: ${normalized.format}, defaulting to 'plain-text'`,
      );
      normalized.format = 'plain-text';
    }

    // Ensure valid length
    if (
      normalized.length &&
      !['short', 'medium', 'long'].includes(normalized.length)
    ) {
      console.warn(
        `Invalid length: ${normalized.length}, defaulting to 'medium'`,
      );
      normalized.length = 'medium';
    }

    // Ensure outputLanguage is specified (required for optimal quality and safety)
    if (!normalized.outputLanguage) {
      normalized.outputLanguage = 'en'; // Default to English
    } else if (!['en', 'es', 'ja'].includes(normalized.outputLanguage)) {
      console.warn(
        `Invalid outputLanguage: ${normalized.outputLanguage}, defaulting to 'en'`,
      );
      normalized.outputLanguage = 'en';
    }

    return normalized;
  }

  /**
   * Normalize summarize options (options passed to summarize() call)
   * Ensures outputLanguage is specified for optimal quality and safety
   *
   * @param {SummarizeOptions} options - Options to normalize
   * @returns {SummarizeOptions} Normalized options
   */
  static normalizeSummarizeOptions(
    options: SummarizeOptions,
  ): SummarizeOptions {
    const normalized: SummarizeOptions = { ...options };

    // Ensure outputLanguage is specified (required for optimal quality and safety)
    if (!normalized.outputLanguage) {
      normalized.outputLanguage = 'en'; // Default to English
    } else if (!['en', 'es', 'ja'].includes(normalized.outputLanguage)) {
      console.warn(
        `Invalid outputLanguage: ${normalized.outputLanguage}, defaulting to 'en'`,
      );
      normalized.outputLanguage = 'en';
    }

    return normalized;
  }

  // ============================================================================
  // Version-Specific Helpers
  // ============================================================================

  /**
   * Check if using official Chrome AI (self.Summarizer)
   *
   * @returns {boolean} True if using self.Summarizer
   */
  static isOfficialAPI(): boolean {
    return this.detectAPIVersion() === 'self';
  }

  /**
   * Check if using playground/polyfill (window.Summarizer)
   *
   * @returns {boolean} True if using window.Summarizer
   */
  static isPlaygroundAPI(): boolean {
    return this.detectAPIVersion() === 'window';
  }

  /**
   * Get API version string for display
   *
   * @returns {string} Human-readable API version
   */
  static getAPIVersionString(): string {
    const version = this.detectAPIVersion();

    switch (version) {
      case 'self':
        return 'Chrome AI (Official)';

      case 'window':
        return 'Chrome AI (Playground)';

      case 'none':
      default:
        return 'Not Supported';
    }
  }

  /**
   * Get detailed API information for debugging
   *
   * @returns {object} Detailed API information
   */
  static getAPIInfo() {
    const version = this.detectAPIVersion();
    const api = this.getSummarizerAPI();

    return {
      version,
      versionString: this.getAPIVersionString(),
      supported: this.isSupported(),
      apiAvailable: api !== null,
      isOfficial: this.isOfficialAPI(),
      isPlayground: this.isPlaygroundAPI(),
    };
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Clear cached detection results
   * Useful when testing or when API availability might change
   */
  static clearCache() {
    this.cachedAPIVersion = null;
    this.cachedCapabilities = null;
    console.log('[ChromeAICompatibility] Cache cleared');
  }

  /**
   * Force re-detection of API and capabilities
   *
   * @returns {Promise<BrowserCapabilities>} Fresh capability information
   */
  static async refresh(): Promise<BrowserCapabilities> {
    this.clearCache();
    return this.detectCapabilities();
  }

  // ============================================================================
  // Migration Helpers
  // ============================================================================

  /**
   * Check if migration from window to self API is needed
   * Useful for showing migration messages to users
   *
   * @returns {boolean} True if migration recommended
   */
  static shouldMigrate(): boolean {
    const version = this.detectAPIVersion();

    // If using playground but self API is also available, recommend migration
    if (version === 'window' && 'Summarizer' in self) {
      return true;
    }

    return false;
  }

  /**
   * Get migration recommendation message
   *
   * @returns {string | null} Migration message or null if not needed
   */
  static getMigrationMessage(): string | null {
    if (!this.shouldMigrate()) {
      return null;
    }

    return 'Chrome AI Official API is available. Consider updating your code to use self.Summarizer for better performance and stability.';
  }
}

export default ChromeAICompatibility;
