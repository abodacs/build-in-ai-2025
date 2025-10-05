/**
 * URL Extractor Service
 *
 * DISABLED: URL extraction blocked by CORS in browsers
 * This service is not used in production - all AI processing is local only
 *
 * @module URLExtractor
 * @deprecated Not functional due to CORS restrictions
 */

// STUB: Export empty class to prevent import errors
// All URL extraction functionality is disabled to ensure no external network calls
// The application uses ONLY local Chrome AI models - no remote APIs

export class URLExtractor {
  constructor(_manager?: any) {
    console.warn(
      '[URLExtractor] Service disabled - CORS restrictions prevent URL extraction',
    );
    console.info(
      '[URLExtractor] All AI processing uses local Chrome built-in models only',
    );
  }

  async extractFromURL(_url: string): Promise<never> {
    throw new Error(
      'URL extraction is disabled due to CORS restrictions. Use local text input only.',
    );
  }

  async extractAndSummarize(_url: string, _config?: any): Promise<never> {
    throw new Error(
      'URL extraction is disabled due to CORS restrictions. Use local text input only.',
    );
  }
}

export default URLExtractor;
