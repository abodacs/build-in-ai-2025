/**
 * PlaygroundTab Error Handling Test Suite
 *
 * Tests for enhanced error handling in PlaygroundTab.
 * Covers all error scenarios and recovery actions.
 *
 * Coverage: Error display, action buttons, user guidance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaygroundTab } from '../PlaygroundTab';
import { ThemeProvider } from '@/providers/ThemeProvider';
import * as RewriterHooks from '../../../hooks';

// ============================================================================
// Test Setup
// ============================================================================

function renderWithProviders(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

// Default mock for useRewriterAvailability
const mockUseRewriterAvailability = {
  isChecking: false,
  error: null,
  isSupported: true,
  requiresDownload: false,
};

// Default mock for useRewriter
const mockUseRewriter = {
  isRewriting: false,
  isStreaming: false,
  content: null,
  originalInput: null,
  error: null,
  isLoading: false,
  config: {
    tone: 'as-is' as const,
    format: 'plain-text' as const,
    length: 'as-is' as const,
    outputLanguage: 'en' as const,
    sharedContext: '',
  },
  metrics: null,
  actions: {
    rewriteStreaming: vi.fn(),
    rewrite: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
    updateConfig: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

// ============================================================================
// Tests
// ============================================================================

describe('PlaygroundTab - Error Handling', () => {
  // ==========================================================================
  // User Activation Error Tests
  // ==========================================================================

  describe('User Activation Error', () => {
    it('displays user activation error with solution', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('user activation required'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(screen.getByText(/Rewrite Failed/i)).toBeInTheDocument();
      // Multiple elements may contain this text, use getAllByText
      const userActivationTexts = screen.getAllByText(/user activation required/i);
      expect(userActivationTexts.length).toBeGreaterThan(0);
      expect(
        screen.getByText(/The API requires a user interaction/i),
      ).toBeInTheDocument();
    });

    it('shows try again button for user activation error', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('user activation required'),
      });

      renderWithProviders(<PlaygroundTab />);

      const tryAgainButton = screen.getByRole('button', {
        name: /Try Again/i,
      });
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('calls retry when try again button is clicked', async () => {
      const user = userEvent.setup();
      const mockReset = vi.fn();

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('user activation required'),
        actions: {
          ...mockUseRewriter.actions,
          reset: mockReset,
        },
      });

      renderWithProviders(<PlaygroundTab />);

      const tryAgainButton = screen.getByRole('button', {
        name: /Try Again/i,
      });
      await user.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Download/Model Error Tests
  // ==========================================================================

  describe('Download/Model Error', () => {
    it('displays download error with solution', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('model download failed'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(screen.getByText(/Rewrite Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/The AI model needs to be downloaded first/i),
      ).toBeInTheDocument();
    });

    it('shows retry download button', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('download required'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(
        screen.getByRole('button', { name: /Retry Download/i }),
      ).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // API Not Available Error Tests
  // ==========================================================================

  describe('API Not Available Error', () => {
    it('displays API not available error with solution', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('API not available'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(screen.getByText(/Rewrite Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Enable the Rewriter API in Chrome flags/i),
      ).toBeInTheDocument();
    });

    it('shows copy chrome flags URL button', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('not available'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(
        screen.getByRole('button', { name: /Copy Chrome Flags URL/i }),
      ).toBeInTheDocument();
    });

    it('copies chrome flags URL when button is clicked', async () => {
      const user = userEvent.setup();
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);

      // Re-mock clipboard after userEvent setup
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        configurable: true,
        value: {
          writeText: writeTextSpy,
        },
      });

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('not available'),
      });

      renderWithProviders(<PlaygroundTab />);

      const copyButton = screen.getByRole('button', {
        name: /Copy Chrome Flags URL/i,
      });
      await user.click(copyButton);

      expect(writeTextSpy).toHaveBeenCalledWith(
        'chrome://flags#rewriter-api-for-gemini-nano',
      );
    });
  });

  // ==========================================================================
  // Input Too Long Error Tests
  // ==========================================================================

  describe('Input Too Long Error', () => {
    it('displays input too long error with solution', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('input too long'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(screen.getByText(/Rewrite Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Try shortening your input text/i),
      ).toBeInTheDocument();
    });

    it('shows shorten text button', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('too long'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(
        screen.getByRole('button', { name: /Shorten Text/i }),
      ).toBeInTheDocument();
    });

    it('has shorten text button that can be clicked', async () => {
      const user = userEvent.setup();

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('limit exceeded'),
      });

      renderWithProviders(<PlaygroundTab />);

      const shortenButton = screen.getByRole('button', {
        name: /Shorten Text/i,
      });
      expect(shortenButton).toBeInTheDocument();

      // Button should be clickable
      await user.click(shortenButton);

      // Button click should not throw
      expect(shortenButton).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Generic Error Tests
  // ==========================================================================

  describe('Generic Error', () => {
    it('displays generic error with retry and reset buttons', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('Something went wrong'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(screen.getByText(/Rewrite Failed/i)).toBeInTheDocument();
      // Multiple elements may contain this text, use getAllByText
      const errorTexts = screen.getAllByText(/Something went wrong/i);
      expect(errorTexts.length).toBeGreaterThan(0);
      expect(
        screen.getByRole('button', { name: /Try Again/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Reset/i }),
      ).toBeInTheDocument();
    });

    it('calls reset when reset button is clicked', async () => {
      const user = userEvent.setup();
      const mockReset = vi.fn();

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('Generic error'),
        actions: {
          ...mockUseRewriter.actions,
          reset: mockReset,
        },
      });

      renderWithProviders(<PlaygroundTab />);

      const resetButton = screen.getByRole('button', { name: /Reset/i });
      await user.click(resetButton);

      expect(mockReset).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Error Display Conditions Tests
  // ==========================================================================

  describe('Error Display Conditions', () => {
    it('shows error only when not rewriting', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('Test error'),
        isRewriting: true, // Still rewriting
      });

      renderWithProviders(<PlaygroundTab />);

      // Error should not be displayed while rewriting
      expect(screen.queryByText(/Rewrite Failed/i)).not.toBeInTheDocument();
    });

    it('shows error when rewriting is complete', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('Test error'),
        isRewriting: false, // Rewriting complete
      });

      renderWithProviders(<PlaygroundTab />);

      expect(screen.getByText(/Rewrite Failed/i)).toBeInTheDocument();
    });

    it('hides error when there is no error', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: null,
      });

      renderWithProviders(<PlaygroundTab />);

      expect(screen.queryByText(/Rewrite Failed/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Multiple Error Scenarios Tests
  // ==========================================================================

  describe('Error Message Detection', () => {
    it('correctly identifies user activation error', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('Requires user activation before using'),
      });

      renderWithProviders(<PlaygroundTab />);

      // Should show user activation specific guidance
      expect(
        screen.getByText(/The API requires a user interaction/i),
      ).toBeInTheDocument();
      // Should NOT show other error guidances
      expect(
        screen.queryByText(/AI model needs to be downloaded/i),
      ).not.toBeInTheDocument();
    });

    it('correctly identifies download error', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('Model download in progress'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(
        screen.getByText(/AI model needs to be downloaded/i),
      ).toBeInTheDocument();
    });

    it('correctly identifies API not available error', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('Rewriter API not available in this browser'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(
        screen.getByText(/Enable the Rewriter API in Chrome flags/i),
      ).toBeInTheDocument();
    });

    it('correctly identifies input too long error', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        error: new Error('Input text exceeds character limit'),
      });

      renderWithProviders(<PlaygroundTab />);

      expect(
        screen.getByText(/Try shortening your input text/i),
      ).toBeInTheDocument();
    });
  });
});
