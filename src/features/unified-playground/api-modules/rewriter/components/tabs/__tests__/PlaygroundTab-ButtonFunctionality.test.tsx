/**
 * PlaygroundTab Button Functionality Test Suite
 *
 * Comprehensive tests for Rewrite button functionality including:
 * - Button states (enabled/disabled)
 * - Click handling
 * - Keyboard shortcuts
 * - Processing states
 * - Cancel functionality
 *
 * Coverage: Button interactions, user actions, state management
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
    rewriteStreaming: vi.fn().mockResolvedValue('Rewritten text'),
    rewrite: vi.fn().mockResolvedValue('Rewritten text'),
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

describe('PlaygroundTab - Button Functionality', () => {
  // ==========================================================================
  // Button Rendering Tests
  // ==========================================================================

  describe('Button Rendering', () => {
    it('renders Rewrite Text button', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue(mockUseRewriter);

      renderWithProviders(<PlaygroundTab />);

      expect(
        screen.getByRole('button', { name: /Rewrite Text/i }),
      ).toBeInTheDocument();
    });

    it('shows correct button text when not processing', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue(mockUseRewriter);

      renderWithProviders(<PlaygroundTab />);

      const button = screen.getByRole('button', { name: /Rewrite Text/i });
      expect(button).toHaveTextContent('Rewrite Text');
    });
  });

  // ==========================================================================
  // Button Disabled State Tests
  // ==========================================================================

  describe('Button Disabled States', () => {
    it('disables button when no input text', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue(mockUseRewriter);

      renderWithProviders(<PlaygroundTab />);

      const button = screen.getByRole('button', { name: /Rewrite Text/i });
      expect(button).toBeDisabled();
    });

    it('disables button when API not supported', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue({
        ...mockUseRewriterAvailability,
        isSupported: false,
      });
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue(mockUseRewriter);

      renderWithProviders(<PlaygroundTab />);

      const button = screen.getByRole('button', { name: /Rewrite Text/i });
      expect(button).toBeDisabled();
    });

    it('disables button during rewriting', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        isRewriting: true,
      });

      renderWithProviders(<PlaygroundTab />);

      const button = screen.getByRole('button', { name: /Rewriting.../i });
      expect(button).toBeDisabled();
    });

    it('disables button during loading', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        isLoading: true,
      });

      renderWithProviders(<PlaygroundTab />);

      const button = screen.getByRole('button', { name: /Preparing.../i });
      expect(button).toBeDisabled();
    });

    it('enables button when all conditions are met', async () => {
      const user = userEvent.setup();

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue(mockUseRewriter);

      renderWithProviders(<PlaygroundTab />);

      // Type some text
      const input = screen.getByRole('textbox', {
        name: /Input text for rewriting/i,
      });
      await user.type(input, 'Test text to rewrite');

      // Button should be enabled
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Rewrite Text/i });
        expect(button).toBeEnabled();
      });
    });
  });

  // ==========================================================================
  // Button Click Handler Tests
  // ==========================================================================

  describe('Button Click Handling', () => {
    it('calls rewriteStreaming when button is clicked', async () => {
      const user = userEvent.setup();
      const mockRewriteStreaming = vi.fn().mockResolvedValue('Rewritten text');

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        actions: {
          ...mockUseRewriter.actions,
          rewriteStreaming: mockRewriteStreaming,
        },
      });

      renderWithProviders(<PlaygroundTab />);

      // Add input text
      const input = screen.getByRole('textbox', {
        name: /Input text for rewriting/i,
      });
      await user.type(input, 'Test text to rewrite');

      // Click button
      const button = screen.getByRole('button', { name: /Rewrite Text/i });
      await user.click(button);

      // Verify rewriteStreaming was called
      await waitFor(() => {
        expect(mockRewriteStreaming).toHaveBeenCalled();
        expect(mockRewriteStreaming).toHaveBeenCalledWith(
          'Test text to rewrite',
          expect.any(Function),
          undefined,
        );
      });
    });

    it('passes context when provided', async () => {
      const user = userEvent.setup();
      const mockRewriteStreaming = vi.fn().mockResolvedValue('Rewritten text');

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        actions: {
          ...mockUseRewriter.actions,
          rewriteStreaming: mockRewriteStreaming,
        },
      });

      renderWithProviders(<PlaygroundTab />);

      // Add input text
      const input = screen.getByRole('textbox', {
        name: /Input text for rewriting/i,
      });
      await user.type(input, 'Test text');

      // Add context
      const contextInput = screen.getByRole('textbox', {
        name: /Task-specific context/i,
      });
      await user.type(contextInput, 'Make it formal');

      // Click button
      const button = screen.getByRole('button', { name: /Rewrite Text/i });
      await user.click(button);

      // Verify context was passed
      await waitFor(() => {
        expect(mockRewriteStreaming).toHaveBeenCalledWith(
          'Test text',
          expect.any(Function),
          'Make it formal',
        );
      });
    });

    it('does not call rewrite when input is empty', async () => {
      const user = userEvent.setup();
      const mockRewriteStreaming = vi.fn();

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        actions: {
          ...mockUseRewriter.actions,
          rewriteStreaming: mockRewriteStreaming,
        },
      });

      renderWithProviders(<PlaygroundTab />);

      const button = screen.getByRole('button', { name: /Rewrite Text/i });

      // Button should be disabled, but try clicking anyway
      expect(button).toBeDisabled();

      // Verify rewrite was not called
      expect(mockRewriteStreaming).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Keyboard Shortcut Tests
  // ==========================================================================

  describe('Keyboard Shortcuts', () => {
    it('triggers rewrite on Cmd+Enter', async () => {
      const user = userEvent.setup();
      const mockRewriteStreaming = vi.fn().mockResolvedValue('Rewritten text');

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        actions: {
          ...mockUseRewriter.actions,
          rewriteStreaming: mockRewriteStreaming,
        },
      });

      renderWithProviders(<PlaygroundTab />);

      // Add input text
      const input = screen.getByRole('textbox', {
        name: /Input text for rewriting/i,
      });
      await user.type(input, 'Test text');

      // Press Cmd+Enter
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      // Verify rewrite was called
      await waitFor(() => {
        expect(mockRewriteStreaming).toHaveBeenCalled();
      });
    });

    it('triggers rewrite on Ctrl+Enter', async () => {
      const user = userEvent.setup();
      const mockRewriteStreaming = vi.fn().mockResolvedValue('Rewritten text');

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        actions: {
          ...mockUseRewriter.actions,
          rewriteStreaming: mockRewriteStreaming,
        },
      });

      renderWithProviders(<PlaygroundTab />);

      // Add input text
      const input = screen.getByRole('textbox', {
        name: /Input text for rewriting/i,
      });
      await user.type(input, 'Test text');

      // Press Ctrl+Enter
      await user.keyboard('{Control>}{Enter}{/Control}');

      // Verify rewrite was called
      await waitFor(() => {
        expect(mockRewriteStreaming).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // Processing State Tests
  // ==========================================================================

  describe('Processing States', () => {
    it('shows "Preparing..." text when loading', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        isLoading: true,
      });

      renderWithProviders(<PlaygroundTab />);

      expect(
        screen.getByRole('button', { name: /Preparing.../i }),
      ).toBeInTheDocument();
    });

    it('shows "Rewriting..." text when rewriting', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        isRewriting: true,
      });

      renderWithProviders(<PlaygroundTab />);

      expect(
        screen.getByRole('button', { name: /Rewriting.../i }),
      ).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Cancel Functionality Tests
  // ==========================================================================

  describe('Cancel Functionality', () => {
    it('shows cancel button when streaming', async () => {
      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        isRewriting: true,
        isStreaming: true,
        content: 'Partial content...',
        originalInput: 'Test input',
      });

      renderWithProviders(<PlaygroundTab />);

      // Cancel button should be in the results section
      await waitFor(() => {
        expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
      });
    });

    it('calls cancel action when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockCancel = vi.fn();

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        isRewriting: true,
        isStreaming: true,
        content: 'Partial content...',
        originalInput: 'Test input',
        actions: {
          ...mockUseRewriter.actions,
          cancel: mockCancel,
        },
      });

      renderWithProviders(<PlaygroundTab />);

      // Find and click cancel button in results (aria-label specific)
      await waitFor(async () => {
        const cancelButton = screen.getByRole('button', {
          name: /Cancel operation/i,
        });
        await user.click(cancelButton);
      });

      expect(mockCancel).toHaveBeenCalled();
    });

    it('triggers cancel on Escape key during rewriting', async () => {
      const user = userEvent.setup();
      const mockCancel = vi.fn();

      vi.spyOn(RewriterHooks, 'useRewriterAvailability').mockReturnValue(
        mockUseRewriterAvailability,
      );
      vi.spyOn(RewriterHooks, 'useRewriter').mockReturnValue({
        ...mockUseRewriter,
        isRewriting: true,
        actions: {
          ...mockUseRewriter.actions,
          cancel: mockCancel,
        },
      });

      renderWithProviders(<PlaygroundTab />);

      // Press Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockCancel).toHaveBeenCalled();
      });
    });
  });
});
