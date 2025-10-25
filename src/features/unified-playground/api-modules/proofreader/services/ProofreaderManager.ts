/**
 * Proofreader Manager
 *
 * High-level manager for Chrome AI Proofreader API.
 * Extends BaseWritingManager with Proofreader-specific operations.
 *
 * Features:
 * - Instance lifecycle management
 * - Configuration caching
 * - Correction application logic
 * - Error handling
 * - Performance tracking integration
 *
 * @module proofreader/services/ProofreaderManager
 */

import { BaseWritingManager } from '../../shared/services/BaseWritingManager';
import { ChromeAIProofreaderService } from './ChromeAIService';
import type {
  Proofreader,
  ProofreaderCreateOptions,
  ProofreaderConfig,
  ProofreadResult,
  ProofreadCorrection,
} from '../types';
import type { AvailabilityStatus } from '../../shared/types';

// ============================================================================
// Manager
// ============================================================================

/**
 * Proofreader Manager
 *
 * Manages Proofreader instance lifecycle and provides high-level operations.
 * Extends BaseWritingManager for 60% code reuse.
 */
export class ProofreaderManager extends BaseWritingManager<
  Proofreader,
  ProofreaderCreateOptions,
  ProofreaderConfig
> {
  // ==========================================================================
  // Abstract Method Implementations
  // ==========================================================================

  /**
   * Get API name for error messages
   */
  getAPIName(): string {
    return 'Proofreader';
  }

  /**
   * Create Proofreader instance
   */
  async createInstance(
    options: ProofreaderCreateOptions,
  ): Promise<Proofreader> {
    // Validate options
    ChromeAIProofreaderService.validateOptions(options);

    // Create instance
    return await ChromeAIProofreaderService.createInstance(options);
  }

  /**
   * Check Proofreader availability
   */
  async checkAvailability(): Promise<AvailabilityStatus> {
    return await ChromeAIProofreaderService.checkAvailability();
  }

  /**
   * Convert configuration to API options
   *
   * Passes all options supported by the Proofreader API based on the official type definitions.
   */
  protected configToOptions(
    config: ProofreaderConfig,
  ): ProofreaderCreateOptions {
    return {
      // expectedInputLanguages: config.expectedInputLanguages,
      // includeCorrectionTypes: config.includeCorrectionTypes,
      // includeCorrectionExplanations: config.includeCorrectionExplanations,
      correctionExplanationLanguage: config.correctionExplanationLanguage,
    };
  }

  /**
   * Check if configuration matches current instance
   */
  protected configMatches(config: ProofreaderConfig): boolean {
    if (!this.config) {
      return false;
    }

    // Compare expected languages
    const currentLangs = this.config.expectedInputLanguages;
    const newLangs = config.expectedInputLanguages;

    if (currentLangs.length !== newLangs.length) {
      return false;
    }

    // Check if all languages match (order doesn't matter)
    const currentSet = new Set(currentLangs);
    return newLangs.every((lang) => currentSet.has(lang));
  }

  /**
   * Destroy Proofreader instance
   */
  protected destroyInstance(instance: Proofreader): void {
    ChromeAIProofreaderService.destroy(instance);
  }

  // ==========================================================================
  // Proofreader Operations
  // ==========================================================================

  /**
   * Proofread text and return corrections
   *
   * @param input - Input text to proofread
   * @param context - Optional per-operation context
   * @param signal - Optional abort signal
   * @returns Proofread result with corrections
   */
  async proofread(
    input: string,
    context?: string,
    signal?: AbortSignal,
  ): Promise<ProofreadResult> {
    console.log('📝 ProofreaderManager.proofread called');
    console.log('  → Input length:', input.length, 'chars');
    console.log('  → Context:', context ? `${context.length} chars` : 'none');
    console.log('  → Signal provided:', !!signal);

    if (!this.config) {
      console.error('❌ No configuration set');
      throw new Error('Configuration not set. Call getInstance() first.');
    }

    console.log('🔧 Getting instance with config:', this.config);
    const instanceStart = Date.now();
    const instance = await this.getInstance(this.config);
    const instanceDuration = Date.now() - instanceStart;
    console.log(`✅ Instance obtained in ${instanceDuration}ms`);

    // Check signal after getInstance (may take time)
    if (signal?.aborted) {
      console.error('❌ Signal already aborted after getInstance');
      throw new Error('Operation cancelled before proofreading started');
    }

    console.log('🎯 Setting state to processing...');
    this.setState('processing');

    try {
      console.log('📡 Starting proofreading...');
      const proofreadStart = Date.now();

      const result = await ChromeAIProofreaderService.proofread(
        instance,
        input,
        context,
        signal,
      );

      const proofreadDuration = Date.now() - proofreadStart;
      console.log(`✅ Proofreading complete in ${proofreadDuration}ms`);
      console.log(`📊 Found ${result.corrections?.length || 0} corrections`);

      this.setState('ready');
      this.updateMetadata({ lastUsedAt: Date.now(), usageCount: 1 });

      return result;
    } catch (error: any) {
      console.error('❌ ProofreaderManager: Proofreading error:', error);

      this.setState('error');

      if (signal?.aborted || error?.name === 'AbortError') {
        throw new Error('Proofread operation cancelled by user');
      }

      throw new Error(
        `Proofreading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Apply a correction at a specific index
   *
   * @param text - Original text
   * @param correction - Correction to apply
   * @returns Text with correction applied
   */
  applyCorrectionAtIndex(
    text: string,
    correction: ProofreadCorrection,
  ): string {
    try {
      // Validate indices
      if (
        correction.startIndex < 0 ||
        correction.endIndex > text.length ||
        correction.startIndex >= correction.endIndex
      ) {
        throw new Error(
          `Invalid correction indices: start=${correction.startIndex}, end=${correction.endIndex}, textLength=${text.length}`,
        );
      }

      // Apply correction
      const before = text.slice(0, correction.startIndex);
      const after = text.slice(correction.endIndex);
      const corrected = before + correction.correction + after;

      const original = text.slice(correction.startIndex, correction.endIndex);
      console.log(
        `[ProofreaderManager] Applied correction: "${original}" → "${correction.correction}"`,
      );

      return corrected;
    } catch (error) {
      console.error('[ProofreaderManager] Error applying correction:', error);
      throw error;
    }
  }

  /**
   * Apply multiple corrections to text
   *
   * Corrections are applied in reverse order (from end to start)
   * to maintain correct indices.
   *
   * @param text - Original text
   * @param corrections - Corrections to apply
   * @returns Text with all corrections applied
   */
  applyAllCorrections(
    text: string,
    corrections: ProofreadCorrection[],
  ): string {
    try {
      // Sort corrections by startIndex in descending order
      const sortedCorrections = [...corrections].sort(
        (a, b) => b.startIndex - a.startIndex,
      );

      let correctedText = text;

      // Apply corrections from end to start to maintain indices
      for (const correction of sortedCorrections) {
        correctedText = this.applyCorrectionAtIndex(correctedText, correction);
      }

      console.log(
        `[ProofreaderManager] Applied ${corrections.length} corrections`,
      );

      return correctedText;
    } catch (error) {
      console.error('[ProofreaderManager] Error applying corrections:', error);
      throw error;
    }
  }

  /**
   * Filter corrections by type
   *
   * @param corrections - All corrections
   * @param types - Types to include (empty = all)
   * @returns Filtered corrections
   */
  filterCorrectionsByType(
    corrections: ProofreadCorrection[],
    types: string[],
  ): ProofreadCorrection[] {
    if (types.length === 0) {
      return corrections;
    }

    return corrections.filter(
      (correction) => correction.type && types.includes(correction.type),
    );
  }

  /**
   * Group corrections by type
   *
   * @param corrections - All corrections
   * @returns Corrections grouped by type
   */
  groupCorrectionsByType(
    corrections: ProofreadCorrection[],
  ): Record<string, ProofreadCorrection[]> {
    const grouped: Record<string, ProofreadCorrection[]> = {
      grammar: [],
      spelling: [],
      punctuation: [],
      style: [],
      clarity: [],
    };

    for (const correction of corrections) {
      if (correction.type) {
        const typeArray = grouped[correction.type];
        if (typeArray) {
          typeArray.push(correction);
        }
      }
    }

    return grouped;
  }

  /**
   * Update configuration
   */
  updateConfig(config: ProofreaderConfig): void {
    this.config = config;
  }

  /**
   * Destroy manager and cleanup resources
   *
   * Overrides BaseWritingManager.destroy() to use destroyInstance()
   * for consistent cleanup through the service layer.
   */
  override destroy(): void {
    try {
      // Abort any ongoing operations
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      // Destroy instance using service
      if (this.instance) {
        this.destroyInstance(this.instance);
        this.instance = null;
      }
    } catch (error) {
      console.error('[ProofreaderManager] Error destroying instance:', error);
    } finally {
      // Reset state
      this.config = null;
      this.downloadProgress = null;
      this.metadata = null;
      this.state = 'destroyed';
      this.isCreating = false;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.destroy();
  }

  // ==========================================================================
  // Static Utility Methods
  // ==========================================================================

  /**
   * Check if Proofreader API is supported
   */
  static isSupported(): boolean {
    return ChromeAIProofreaderService.isSupported();
  }

  /**
   * Get user-friendly error message
   *
   * @param error - Error object
   * @returns User-friendly message
   */
  static getErrorMessage(error: unknown): string {
    return ChromeAIProofreaderService.getErrorMessage(error);
  }
}

// ============================================================================
// Export
// ============================================================================

export default ProofreaderManager;
