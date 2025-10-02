/**
 * URL Extractor Service
 *
 * Extracts web content for summarization
 * Supports major content sites with specialized parsers
 *
 * @module URLExtractor
 */

import { SummarizerManager } from './SummarizerManager';
import { ErrorHandler } from './ErrorHandler';
import {
  cleanText,
  stripHTML,
  countWords,
  estimateReadingTime,
} from '../utils/textPreprocessing';
import {
  normalizeURL,
  getURLMetadata,
  getExtractionStrategy,
  removeTrackingParams,
} from '../utils/urlParser';
import type {
  WebContent,
  WebContentMetadata,
  WebSummaryResult,
  WebSummaryMetadata,
} from '../types/api.types';
import type { SummarizerCreateOptions } from '../types/summarizer.types';

// ============================================================================
// URL Extractor Class
// ============================================================================

export class URLExtractor {
  private manager: SummarizerManager;

  constructor(manager?: SummarizerManager) {
    this.manager = manager || new SummarizerManager();
  }

  // ============================================================================
  // Main Extraction Methods
  // ============================================================================

  /**
   * Extract content from URL
   * Note: This is a client-side implementation that requires CORS support
   * or a proxy server. For production, consider using a backend service.
   *
   * @param {string} url - URL to extract
   * @returns {Promise<WebContent>} Extracted content
   */
  async extractFromURL(url: string): Promise<WebContent> {
    const startTime = performance.now();

    // Validate URL
    const normalizedURL = normalizeURL(url);
    if (!normalizedURL) {
      throw new Error('Invalid URL provided');
    }

    // Clean URL
    const cleanURL = removeTrackingParams(normalizedURL);

    // Get extraction strategy
    const metadata = getURLMetadata(cleanURL);
    if (!metadata) {
      throw new Error('Failed to analyze URL');
    }

    console.log(
      `[URLExtractor] Extracting from ${metadata.domain} (${metadata.contentType})...`,
    );

    try {
      // Fetch content
      const response = await fetch(cleanURL, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChromeAISummarizer/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Parse content
      const content = await this.parseHTML(
        html,
        cleanURL,
        metadata.contentType,
      );

      const extractionTime = performance.now() - startTime;
      console.log(
        `[URLExtractor] Extracted ${content.content.length} characters in ${extractionTime.toFixed(0)}ms`,
      );

      return content;
    } catch (error) {
      // CORS or network error - provide helpful message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Failed to fetch URL due to CORS restrictions. Consider using a proxy service or backend API for web content extraction.',
        );
      }

      throw ErrorHandler.handleError(error);
    }
  }

  /**
   * Extract and summarize content from URL
   *
   * @param {string} url - URL to extract and summarize
   * @param {SummarizerCreateOptions} config - Summarizer configuration
   * @returns {Promise<WebSummaryResult>} Summary result with metadata
   */
  async extractAndSummarize(
    url: string,
    config: SummarizerCreateOptions = {},
  ): Promise<WebSummaryResult> {
    const startTime = performance.now();

    // Extract content
    const extractionStartTime = performance.now();
    const content = await this.extractFromURL(url);
    const extractionTime = performance.now() - extractionStartTime;

    // Summarize content
    const summarizeStartTime = performance.now();
    const summary = await this.manager.summarize(content.content, {}, config);
    const processingTime = performance.now() - summarizeStartTime;

    // Calculate metadata
    const summaryMetadata: WebSummaryMetadata = {
      compressionRatio: content.metadata.wordCount / countWords(summary),
      processingTime,
      summaryType: config.type || 'tldr',
      extractionTime,
      totalTime: performance.now() - startTime,
    };

    console.log(
      `[URLExtractor] Complete: ${content.metadata.wordCount} words → ${countWords(summary)} words (${summaryMetadata.compressionRatio.toFixed(1)}x compression)`,
    );

    return {
      original: content,
      summary,
      summaryMetadata,
    };
  }

  // ============================================================================
  // HTML Parsing
  // ============================================================================

  /**
   * Parse HTML to extract main content
   *
   * @param {string} html - HTML content
   * @param {string} url - Source URL
   * @param {string} contentType - Content type hint
   * @returns {Promise<WebContent>} Extracted content
   */
  private async parseHTML(
    html: string,
    url: string,
    contentType: string,
  ): Promise<WebContent> {
    // Extract basic metadata
    const title = this.extractTitle(html);
    const author = this.extractMetaTag(html, 'author');
    const description = this.extractMetaTag(html, 'description');
    const publishDate = this.extractPublishDate(html);

    // Extract main content based on content type
    let content: string;

    switch (contentType) {
      case 'documentation':
        content = this.extractDocumentation(html);
        break;

      case 'blog':
      case 'article':
      case 'news':
      case 'tech-news':
        content = this.extractArticle(html);
        break;

      case 'qa':
        content = this.extractQA(html);
        break;

      case 'encyclopedia':
        content = this.extractWikipedia(html);
        break;

      default:
        content = this.extractGeneric(html);
    }

    // Clean content
    content = cleanText(stripHTML(content));

    // Calculate metadata
    const wordCount = countWords(content);
    const readingTime = estimateReadingTime(content);

    const metadata: WebContentMetadata = {
      author,
      publishDate,
      wordCount,
      readingTime,
      source: new URL(url).hostname,
      url,
      description,
    };

    return {
      title,
      content,
      metadata,
    };
  }

  /**
   * Extract article content (generic)
   */
  private extractArticle(html: string): string {
    // Try common article selectors
    const selectors = [
      'article',
      'main',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      '[role="main"]',
    ];

    for (const selector of selectors) {
      const regex = new RegExp(
        `<${selector}[^>]*>([\\s\\S]*?)</${selector}>`,
        'i',
      );
      const match = html.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Fallback to body
    return this.extractGeneric(html);
  }

  /**
   * Extract documentation content
   */
  private extractDocumentation(html: string): string {
    const selectors = [
      'main',
      '.documentation',
      '.content',
      '.markdown-body',
      'article',
    ];

    for (const selector of selectors) {
      const regex = new RegExp(
        `<${selector}[^>]*>([\\s\\S]*?)</${selector}>`,
        'i',
      );
      const match = html.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }

    return this.extractGeneric(html);
  }

  /**
   * Extract Q&A content (Stack Overflow style)
   */
  private extractQA(html: string): string {
    // Extract question
    const questionMatch = html.match(
      /<div[^>]*class="[^"]*question[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    );
    const question = questionMatch ? questionMatch[1] : '';

    // Extract answers
    const answerMatches = html.matchAll(
      /<div[^>]*class="[^"]*answer[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    );
    const answers = Array.from(answerMatches)
      .map((match) => match[1])
      .join('\n\n');

    return `${question}\n\n${answers}`;
  }

  /**
   * Extract Wikipedia content
   */
  private extractWikipedia(html: string): string {
    const match = html.match(
      /<div[^>]*id="mw-content-text"[^>]*>([\s\S]*?)<\/div>/i,
    );
    if (match && match[1]) {
      // Remove reference links and edit sections
      let content = match[1];
      content = content.replace(
        /<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi,
        '',
      );
      content = content.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '');
      return content;
    }

    return this.extractGeneric(html);
  }

  /**
   * Extract generic content (fallback)
   */
  private extractGeneric(html: string): string {
    // Remove script, style, nav, footer, header
    let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

    // Extract body
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : content;
  }

  // ============================================================================
  // Metadata Extraction
  // ============================================================================

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string {
    // Try og:title first
    const ogTitle = this.extractMetaTag(html, 'og:title');
    if (ogTitle) return ogTitle;

    // Try <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();

    return 'Untitled';
  }

  /**
   * Extract meta tag content
   */
  private extractMetaTag(html: string, name: string): string | undefined {
    // Try name attribute
    let regex = new RegExp(
      `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      'i',
    );
    let match = html.match(regex);
    if (match) return match[1];

    // Try property attribute (og: tags)
    regex = new RegExp(
      `<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      'i',
    );
    match = html.match(regex);
    if (match) return match[1];

    return undefined;
  }

  /**
   * Extract publish date
   */
  private extractPublishDate(html: string): Date | undefined {
    // Try various meta tags
    const dateFields = [
      'article:published_time',
      'datePublished',
      'publish_date',
      'date',
    ];

    for (const field of dateFields) {
      const dateStr = this.extractMetaTag(html, field);
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Try time tags
    const timeMatch = html.match(/<time[^>]*datetime=["']([^"']+)["'][^>]*>/i);
    if (timeMatch) {
      const date = new Date(timeMatch[1]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return undefined;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if URL can be extracted
   *
   * @param {string} url - URL to check
   * @returns {boolean} True if extractable
   */
  canExtract(url: string): boolean {
    const normalizedURL = normalizeURL(url);
    if (!normalizedURL) return false;

    const metadata = getURLMetadata(normalizedURL);
    return metadata !== null && metadata.isContentSite;
  }

  /**
   * Get extraction preview (without actually fetching)
   *
   * @param {string} url - URL to preview
   * @returns {object} Preview information
   */
  getExtractionPreview(url: string) {
    const normalizedURL = normalizeURL(url);
    if (!normalizedURL) {
      return null;
    }

    const metadata = getURLMetadata(normalizedURL);
    if (!metadata) {
      return null;
    }

    const strategy = getExtractionStrategy(normalizedURL);

    return {
      url: metadata.url,
      domain: metadata.domain,
      contentType: metadata.contentType,
      isContentSite: metadata.isContentSite,
      extractionStrategy: strategy.strategy,
      readabilitySupported: strategy.readability,
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clean up resources
   */
  cleanup() {
    this.manager.cleanup();
  }
}

// ============================================================================
// Export
// ============================================================================

export default URLExtractor;
