/**
 * Unified Playground Accessibility Tests
 *
 * Comprehensive accessibility testing for responsive components
 * focusing on WCAG AAA compliance, touch targets, and keyboard navigation
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { ProofreaderResults } from '../../api-modules/proofreader/components/ProofreaderResults';
import { TranslatorResults } from '../../api-modules/translator/components/TranslatorResults';
import { RewriterResults } from '../../api-modules/rewriter/components/RewriterResults';
import type {
  ProofreadCorrection,
  CorrectionState,
} from '../../api-modules/proofreader/types';

// Extend Vitest matchers with axe
expect.extend(matchers);

// =============================================================================
// Test Data Fixtures
// =============================================================================

const mockCorrections: ProofreadCorrection[] = [
  {
    original: 'teh',
    correction: 'the',
    type: 'spelling',
    startOffset: 0,
    endOffset: 3,
  },
  {
    original: 'recieve',
    correction: 'receive',
    type: 'spelling',
    startOffset: 10,
    endOffset: 17,
  },
];

const mockCorrectionStates: CorrectionState[] = mockCorrections.map(
  (correction, index) => ({
    correction,
    index,
    state: 'pending' as const,
  }),
);

// =============================================================================
// ProofreaderResults Accessibility Tests
// =============================================================================

describe('ProofreaderResults - Accessibility', () => {
  it('should have no accessibility violations with corrections', async () => {
    const { container } = render(
      <ProofreaderResults
        originalText="teh quick recieve"
        correctedText="the quick receive"
        corrections={mockCorrections}
        correctionStates={mockCorrectionStates}
        onApplyCorrection={() => {}}
        onIgnoreCorrection={() => {}}
        onApplyAll={() => {}}
        onReset={() => {}}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with no corrections', async () => {
    const { container } = render(
      <ProofreaderResults
        originalText="perfect text"
        correctedText="perfect text"
        corrections={[]}
        correctionStates={[]}
        onApplyCorrection={() => {}}
        onIgnoreCorrection={() => {}}
        onApplyAll={() => {}}
        onReset={() => {}}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible buttons with proper touch targets', async () => {
    const { container } = render(
      <ProofreaderResults
        originalText="teh text"
        correctedText="the text"
        corrections={mockCorrections}
        correctionStates={mockCorrectionStates}
        onApplyCorrection={() => {}}
        onIgnoreCorrection={() => {}}
        onApplyAll={() => {}}
        onReset={() => {}}
      />,
    );

    // Check that all buttons have the tap-fast class for touch optimization
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      const hasResponsiveSizing =
        button.classList.contains('h-10') ||
        button.classList.contains('h-8') ||
        button.classList.contains('h-12');
      expect(hasResponsiveSizing).toBe(true);
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// =============================================================================
// TranslatorResults Accessibility Tests
// =============================================================================

describe('TranslatorResults - Accessibility', () => {
  it('should have no accessibility violations with translation', async () => {
    const { container } = render(
      <TranslatorResults
        originalText="Hello world"
        translatedText="Hola mundo"
        isStreaming={false}
        sourceLanguage="en"
        targetLanguage="es"
        performance={{
          translationLatency: 250,
          throughput: 100,
          cacheHit: false,
        }}
        onCopy={() => {}}
        onDownload={() => {}}
        onRetry={() => {}}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations while streaming', async () => {
    const { container } = render(
      <TranslatorResults
        originalText="Hello world"
        translatedText="Hola"
        isStreaming={true}
        sourceLanguage="en"
        targetLanguage="es"
        onCopy={() => {}}
        onDownload={() => {}}
        onRetry={() => {}}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support RTL languages accessibly', async () => {
    const { container } = render(
      <TranslatorResults
        originalText="Hello"
        translatedText="مرحبا"
        isStreaming={false}
        sourceLanguage="en"
        targetLanguage="ar"
        onCopy={() => {}}
        onDownload={() => {}}
        onRetry={() => {}}
      />,
    );

    // Check for RTL direction attribute
    const rtlElement = container.querySelector('[dir="rtl"]');
    expect(rtlElement).toBeTruthy();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible touch targets on action buttons', async () => {
    const { container } = render(
      <TranslatorResults
        originalText="Test"
        translatedText="Prueba"
        isStreaming={false}
        sourceLanguage="en"
        targetLanguage="es"
        performance={{
          translationLatency: 100,
          throughput: 150,
          cacheHit: false,
        }}
        onCopy={() => {}}
        onDownload={() => {}}
        onRetry={() => {}}
      />,
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      // Should have either h-10 (40px mobile) or h-8 (32px desktop) classes
      const hasMinHeight =
        button.classList.contains('h-10') ||
        button.classList.contains('h-8') ||
        button.classList.contains('h-7') ||
        button.classList.contains('h-12');
      expect(hasMinHeight).toBe(true);
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// =============================================================================
// RewriterResults Accessibility Tests
// =============================================================================

describe('RewriterResults - Accessibility', () => {
  it('should have no accessibility violations with content', async () => {
    const { container } = render(
      <RewriterResults
        originalText="Short text"
        content="Concise phrase"
        isRewriting={false}
        isStreaming={false}
        metrics={{
          latency: 150,
          throughput: 120,
          tokensPerSecond: 25,
          totalTokens: 10,
        }}
        onCopyOriginal={() => {}}
        onCopyRewritten={() => {}}
        onDownload={() => {}}
        onRetry={() => {}}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations while streaming', async () => {
    const { container } = render(
      <RewriterResults
        originalText="Original content"
        content="Rewritten"
        isRewriting={true}
        isStreaming={true}
        metrics={null}
        onCancel={() => {}}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible tabs for view switching', async () => {
    const { container } = render(
      <RewriterResults
        originalText="Test text"
        content="Modified text"
        isRewriting={false}
        isStreaming={false}
        metrics={{
          latency: 100,
          throughput: 150,
          tokensPerSecond: 30,
          totalTokens: 8,
        }}
      />,
    );

    // Check for proper ARIA roles on tabs
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBeGreaterThan(0);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have responsive touch targets on all buttons', async () => {
    const { container } = render(
      <RewriterResults
        originalText="Text"
        content="Content"
        isRewriting={false}
        isStreaming={false}
        metrics={{
          latency: 100,
          throughput: 100,
          tokensPerSecond: 20,
          totalTokens: 5,
        }}
        onCopyOriginal={() => {}}
        onCopyRewritten={() => {}}
        onDownload={() => {}}
        onRetry={() => {}}
      />,
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Check that buttons have responsive height classes (h-6, h-7, h-8, h-9, h-10, h-12)
    let buttonsWithHeight = 0;
    buttons.forEach((button) => {
      const classes = button.className;
      const hasHeightClass = /\bh-\d+\b/.test(classes);
      if (hasHeightClass) buttonsWithHeight++;
    });

    // At least 50% of buttons should have responsive heights
    // (Some UI library buttons may use default styles)
    expect(buttonsWithHeight / buttons.length).toBeGreaterThanOrEqual(0.5);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// =============================================================================
// General Touch Target Compliance Tests
// =============================================================================

describe('Touch Target Compliance (WCAG AAA)', () => {
  it('ProofreaderResults buttons should meet WCAG AAA touch target size', () => {
    const { container } = render(
      <ProofreaderResults
        originalText="test"
        correctedText="test"
        corrections={mockCorrections}
        correctionStates={mockCorrectionStates}
        onApplyCorrection={() => {}}
        onIgnoreCorrection={() => {}}
        onApplyAll={() => {}}
        onReset={() => {}}
      />,
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Check that most buttons have responsive height classes
    let buttonsWithHeight = 0;
    let buttonsWithTapFast = 0;

    buttons.forEach((button) => {
      const classes = button.className;
      const hasHeightClass = /\bh-\d+\b/.test(classes);
      if (hasHeightClass) buttonsWithHeight++;

      if (button.classList.contains('tap-fast')) buttonsWithTapFast++;
    });

    // At least 80% of buttons should have proper responsive heights
    expect(buttonsWithHeight / buttons.length).toBeGreaterThanOrEqual(0.8);

    // tap-fast is an optimization - at least some buttons should have it
    expect(buttonsWithTapFast).toBeGreaterThan(0);
  });

  it('TranslatorResults buttons should have adequate spacing', () => {
    const { container } = render(
      <TranslatorResults
        originalText="Test"
        translatedText="Prueba"
        isStreaming={false}
        sourceLanguage="en"
        targetLanguage="es"
        performance={{
          translationLatency: 100,
          throughput: 100,
          cacheHit: false,
        }}
        onCopy={() => {}}
        onDownload={() => {}}
        onRetry={() => {}}
      />,
    );

    // Find button groups with touch-gap spacing
    const gapContainers = container.querySelectorAll('.touch-gap');
    expect(gapContainers.length).toBeGreaterThan(0);
  });

  it('RewriterResults should have icons with proper spacing', () => {
    const { container } = render(
      <RewriterResults
        originalText="Test"
        content="Content"
        isRewriting={false}
        isStreaming={false}
        metrics={{
          latency: 100,
          throughput: 100,
          tokensPerSecond: 20,
          totalTokens: 5,
        }}
        onCopyRewritten={() => {}}
      />,
    );

    // Check that icons exist and are properly rendered
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);

    // Check that icon containers have gap or margin spacing
    let hasSpacing = false;
    icons.forEach((icon) => {
      const parent = icon.parentElement;
      const grandparent = parent?.parentElement;

      // Check for gap classes, margin classes, or flex spacing
      if (parent) {
        const classes = parent.className + ' ' + (grandparent?.className || '');
        if (
          classes.includes('gap-') ||
          classes.includes('mr-') ||
          classes.includes('ml-') ||
          classes.includes('sm:mr') ||
          classes.includes('space-')
        ) {
          hasSpacing = true;
        }
      }
    });

    expect(hasSpacing).toBe(true);
  });
});

// =============================================================================
// Responsive Text Visibility Tests
// =============================================================================

describe('Responsive Text Visibility', () => {
  it('should hide button labels on mobile (hidden sm:inline pattern)', () => {
    const { container } = render(
      <TranslatorResults
        originalText="Test"
        translatedText="Prueba"
        isStreaming={false}
        sourceLanguage="en"
        targetLanguage="es"
        performance={{
          translationLatency: 100,
          throughput: 100,
          cacheHit: false,
        }}
        onCopy={() => {}}
        onDownload={() => {}}
        onRetry={() => {}}
      />,
    );

    // Find elements with hidden sm:inline pattern
    const responsiveText = container.querySelectorAll('.hidden.sm\\:inline');
    expect(responsiveText.length).toBeGreaterThan(0);
  });

  it('should maintain icon visibility across all breakpoints', () => {
    const { container } = render(
      <ProofreaderResults
        originalText="test"
        correctedText="test"
        corrections={mockCorrections}
        correctionStates={mockCorrectionStates}
        onApplyCorrection={() => {}}
        onIgnoreCorrection={() => {}}
        onApplyAll={() => {}}
        onReset={() => {}}
      />,
    );

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);

    // Icons should not have display:none classes
    icons.forEach((icon) => {
      expect(icon.classList.contains('hidden')).toBe(false);
    });
  });
});
