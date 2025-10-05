/**
 * URL Parser Utility
 *
 * URL validation, parsing, and domain extraction
 * Supports detection of common article/content sites
 *
 * @module urlParser
 */

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Validate if string is a valid URL
 *
 * @param {string} url - URL string to validate
 * @returns {boolean} True if valid URL
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate and normalize URL
 * Adds https:// if protocol is missing
 *
 * @param {string} url - URL string
 * @returns {string | null} Normalized URL or null if invalid
 */
export function normalizeURL(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//i)) {
    normalized = `https://${normalized}`;
  }

  // Validate
  if (!isValidURL(normalized)) {
    return null;
  }

  return normalized;
}

// ============================================================================
// URL Parsing
// ============================================================================

/**
 * Parse URL and extract components
 *
 * @param {string} url - URL to parse
 * @returns {object | null} URL components or null if invalid
 */
export function parseURL(url: string): {
  protocol: string;
  hostname: string;
  domain: string;
  pathname: string;
  search: string;
  hash: string;
  full: string;
} | null {
  try {
    const urlObj = new URL(url);

    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      domain: extractDomain(urlObj.hostname),
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      full: urlObj.href,
    };
  } catch {
    return null;
  }
}

/**
 * Extract domain from hostname
 * Removes subdomains to get base domain
 *
 * @param {string} hostname - Hostname (e.g., 'blog.example.com')
 * @returns {string} Domain (e.g., 'example.com')
 */
export function extractDomain(hostname: string): string {
  if (!hostname) return '';

  const parts = hostname.split('.');

  // Handle special cases (co.uk, com.au, etc.)
  if (
    parts.length >= 3 &&
    ['co', 'com', 'org', 'net'].includes(parts[parts.length - 2])
  ) {
    return parts.slice(-3).join('.');
  }

  // Standard domain
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }

  return hostname;
}

// ============================================================================
// Content Site Detection
// ============================================================================

/**
 * Check if URL is from a known content/article site
 *
 * @param {string} url - URL to check
 * @returns {boolean} True if known content site
 */
export function isContentSite(url: string): boolean {
  const parsed = parseURL(url);
  if (!parsed) return false;

  const contentSites = [
    'wikipedia.org',
    'medium.com',
    'dev.to',
    'stackoverflow.com',
    'github.com',
    'reddit.com',
    'news.ycombinator.com',
    'arxiv.org',
    'substack.com',
    'blogger.com',
    'wordpress.com',
    'tumblr.com',
    'blogspot.com',
    'nytimes.com',
    'theguardian.com',
    'bbc.com',
    'cnn.com',
    'reuters.com',
    'techcrunch.com',
    'wired.com',
    'arstechnica.com',
    'theverge.com',
  ];

  return contentSites.some(
    (site) => parsed.hostname.includes(site) || parsed.domain === site,
  );
}

/**
 * Detect content type from URL
 *
 * @param {string} url - URL to analyze
 * @returns {string} Content type
 */
export function detectContentType(url: string): string {
  const parsed = parseURL(url);
  if (!parsed) return 'unknown';

  const { hostname, pathname } = parsed;

  // Documentation sites
  if (hostname.includes('docs.') || pathname.includes('/docs/')) {
    return 'documentation';
  }

  // GitHub repositories
  if (hostname.includes('github.com') && pathname.includes('/blob/')) {
    return 'code';
  }

  // Stack Overflow
  if (hostname.includes('stackoverflow.com')) {
    return 'qa';
  }

  // Wikipedia
  if (hostname.includes('wikipedia.org')) {
    return 'encyclopedia';
  }

  // Blog platforms
  if (
    hostname.includes('medium.com') ||
    hostname.includes('dev.to') ||
    hostname.includes('substack.com') ||
    hostname.includes('blogger.com') ||
    hostname.includes('wordpress.com')
  ) {
    return 'blog';
  }

  // News sites
  if (
    hostname.includes('news') ||
    hostname.includes('nytimes.com') ||
    hostname.includes('theguardian.com') ||
    hostname.includes('bbc.com') ||
    hostname.includes('cnn.com') ||
    hostname.includes('reuters.com')
  ) {
    return 'news';
  }

  // Tech sites
  if (
    hostname.includes('techcrunch.com') ||
    hostname.includes('wired.com') ||
    hostname.includes('arstechnica.com') ||
    hostname.includes('theverge.com')
  ) {
    return 'tech-news';
  }

  // Research papers
  if (hostname.includes('arxiv.org') || pathname.includes('.pdf')) {
    return 'research';
  }

  return 'article';
}

/**
 * Get recommended extraction strategy for URL
 *
 * @param {string} url - URL to analyze
 * @returns {object} Extraction strategy
 */
export function getExtractionStrategy(url: string): {
  strategy: string;
  selector?: string;
  readability: boolean;
  customParser?: string;
} {
  const contentType = detectContentType(url);
  const parsed = parseURL(url);

  if (!parsed) {
    return { strategy: 'readability', readability: true };
  }

  // Custom strategies for known sites
  switch (contentType) {
    case 'documentation':
      return {
        strategy: 'custom',
        selector: 'main, article, .content, .documentation',
        readability: true,
      };

    case 'code':
      return {
        strategy: 'github',
        readability: false,
        customParser: 'github',
      };

    case 'qa':
      return {
        strategy: 'stackoverflow',
        selector: '.question, .answer',
        readability: false,
        customParser: 'stackoverflow',
      };

    case 'encyclopedia':
      return {
        strategy: 'wikipedia',
        selector: '#mw-content-text',
        readability: true,
        customParser: 'wikipedia',
      };

    case 'blog':
    case 'article':
    case 'news':
    case 'tech-news':
      return {
        strategy: 'readability',
        selector: 'article, main, .post-content, .entry-content',
        readability: true,
      };

    case 'research':
      return {
        strategy: 'research',
        readability: true,
      };

    default:
      return {
        strategy: 'readability',
        readability: true,
      };
  }
}

// ============================================================================
// URL Metadata
// ============================================================================

/**
 * Extract metadata from URL
 *
 * @param {string} url - URL to analyze
 * @returns {object} URL metadata
 */
export function getURLMetadata(url: string) {
  const parsed = parseURL(url);

  if (!parsed) {
    return null;
  }

  return {
    url: parsed.full,
    domain: parsed.domain,
    hostname: parsed.hostname,
    contentType: detectContentType(url),
    isContentSite: isContentSite(url),
    extractionStrategy: getExtractionStrategy(url),
  };
}

/**
 * Check if URL is likely to have extractable content
 *
 * @param {string} url - URL to check
 * @returns {boolean} True if likely extractable
 */
export function isExtractable(url: string): boolean {
  const parsed = parseURL(url);
  if (!parsed) return false;

  const { pathname } = parsed;

  // Exclude non-content URLs
  const excludePatterns = [
    /\.(jpg|jpeg|png|gif|svg|ico|css|js|json|xml|pdf)$/i,
    /^\/api\//,
    /^\/assets\//,
    /^\/static\//,
    /^\/cdn\//,
  ];

  if (excludePatterns.some((pattern) => pattern.test(pathname))) {
    return false;
  }

  // Content sites are likely extractable
  if (isContentSite(url)) {
    return true;
  }

  // If pathname suggests content
  const contentPatterns = [
    /\/blog\//,
    /\/article\//,
    /\/post\//,
    /\/news\//,
    /\/story\//,
    /\/docs\//,
    /\/wiki\//,
    /\/tutorial\//,
  ];

  if (contentPatterns.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  // Default to possibly extractable
  return true;
}

// ============================================================================
// URL Cleaning
// ============================================================================

/**
 * Remove tracking parameters from URL
 *
 * @param {string} url - URL to clean
 * @returns {string} Cleaned URL
 */
export function removeTrackingParams(url: string): string {
  try {
    const urlObj = new URL(url);

    // Common tracking parameters to remove
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
      'source',
    ];

    trackingParams.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.href;
  } catch {
    return url;
  }
}

/**
 * Get clean display URL (without protocol and trailing slash)
 *
 * @param {string} url - URL to clean
 * @returns {string} Display URL
 */
export function getDisplayURL(url: string): string {
  try {
    const urlObj = new URL(url);
    let display = urlObj.hostname + urlObj.pathname;

    // Remove trailing slash
    display = display.replace(/\/$/, '');

    // Add search params if present
    if (urlObj.search) {
      display += urlObj.search;
    }

    return display;
  } catch {
    return url;
  }
}

// ============================================================================
// Export All Functions
// ============================================================================

export default {
  isValidURL,
  normalizeURL,
  parseURL,
  extractDomain,
  isContentSite,
  detectContentType,
  getExtractionStrategy,
  getURLMetadata,
  isExtractable,
  removeTrackingParams,
  getDisplayURL,
};
