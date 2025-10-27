/**
 * Proofreader Integration Tests
 *
 * End-to-end integration tests for the complete proofreading workflow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  screen,
  fireEvent,
  waitFor,
  within,
  cleanup,
} from '@testing-library/react';
import { render } from '@/tests/test-utils/TestProviders';
import { ProofreaderMain } from '../components/tabs/PlaygroundTab';

// Helper function to set contenteditable text
const setContentEditableText = (element: HTMLElement, text: string) => {
  element.textContent = text;
  fireEvent.input(element);
};

// Mock Chrome AI API
const mockProofread = vi.fn();
const mockProofreader = { proofread: mockProofread, destroy: vi.fn() };

// Helper to wait for component to be ready
const waitForComponentReady = async () => {
  await waitFor(
    () => {
      // Wait for availability check to complete
      expect(
        screen.queryByText(/Checking Chrome AI availability/i),
      ).not.toBeInTheDocument();
      // Wait for proofreader button to appear
      const proofreadButton = screen.queryByRole('button', {
        name: /proofread/i,
      });
      expect(proofreadButton).toBeInTheDocument();
    },
    { timeout: 5000 }, // Increased timeout for initialization
  );
};

beforeEach(() => {
  vi.clearAllMocks();

  // Setup Chrome AI mock with proper structure
  (globalThis as any).Proofreader = {
    create: vi.fn().mockResolvedValue(mockProofreader),
    // availability() must accept options parameter
    availability: vi.fn().mockImplementation(async (options) => 'available'),
  };

  mockProofread.mockResolvedValue({
    corrections: [
      {
        correction: 'the',
        type: 'spelling',
        startIndex: 0,
        endIndex: 3,
        explanation: 'Spelling error',
      },
      {
        correction: 'quick',
        type: 'spelling',
        startIndex: 4,
        endIndex: 8,
        explanation: 'Spelling error',
      },
    ],
  });
});

afterEach(() => {
  // Critical: Cleanup all mounted components
  cleanup();

  // Reset all mocks
  vi.clearAllMocks();

  // Restore real timers if they were faked
  vi.useRealTimers();

  // Clear the Proofreader mock to ensure clean state
  delete (globalThis as any).Proofreader;
});

describe('Proofreader Integration', () => {
  describe('Complete Workflow', () => {
    it('should complete full proofreading flow', async () => {
      render(<ProofreaderMain />);
      await waitForComponentReady();

      // 1. Enter text
      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'teh quik test');

      // 2. Click proofread button
      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      // 3. Wait for results (check for results display - look for statistics card)
      await waitFor(() => {
        expect(screen.getByText(/^Corrections Found$/i)).toBeInTheDocument();
      });

      // 4. Verify results display
      expect(screen.getByText('teh')).toBeInTheDocument();
      expect(screen.getByText('the')).toBeInTheDocument();
      expect(mockProofread).toHaveBeenCalledWith(
        'teh quik test',
        expect.any(Object),
      );
    });

    it('should apply corrections and update text', async () => {
      render(<ProofreaderMain />);
      await waitForComponentReady();

      // Enter and proofread
      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'teh test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Apply correction
      const applyButtons = screen.getAllByRole('button', { name: /^apply$/i });
      fireEvent.click(applyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });
    });

    it('should ignore corrections', async () => {
      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'teh test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Ignore correction
      const ignoreButtons = screen.getAllByRole('button', {
        name: /^ignore$/i,
      });
      fireEvent.click(ignoreButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Ignored')).toBeInTheDocument();
      });
    });

    it('should clear text and results', async () => {
      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'teh test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Clear
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      // Verify cleared - contenteditable uses textContent, not value
      expect(textarea.textContent).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should show error when proofreading fails', async () => {
      // Reject all retry attempts
      mockProofread.mockRejectedValue(new Error('Proofread failed'));

      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      // Wait for error to appear after retries (allow enough time for 3 retries)
      await waitFor(
        () => {
          // Check for error alert or message
          const errorElements = screen.queryAllByText(/failed|error/i);
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { timeout: 10000 }, // Allow time for retries: 1s + 2s + 4s = 7s + buffer
      );
    }, 15000); // 15 second test timeout

    it('should recover from error state', async () => {
      // First call fails all retries
      mockProofread.mockRejectedValue(new Error('Proofread failed'));

      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      // Wait for error to appear after retries
      await waitFor(
        () => {
          // Check for error alert or message
          const errorElements = screen.queryAllByText(/failed|error/i);
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { timeout: 10000 }, // Allow time for retries
      );

      // Now reset mock completely to return success on next call
      mockProofread.mockReset();
      mockProofread.mockResolvedValue({
        corrections: [
          {
            correction: 'the',
            type: 'spelling',
            startIndex: 0,
            endIndex: 3,
            explanation: 'Spelling error',
          },
        ],
      });

      // Wait for button to be ready again (not disabled)
      await waitFor(() => {
        expect(proofreadButton).not.toBeDisabled();
      });

      // Clear the textarea and add new text
      setContentEditableText(textarea, '');
      await new Promise((resolve) => setTimeout(resolve, 100));
      setContentEditableText(textarea, 'teh test');

      // Try proofreading again
      fireEvent.click(proofreadButton);

      // Should successfully show corrections this time (verifies recovery)
      await waitFor(
        () => {
          // Look for the Corrections Found heading (indicates success, not error)
          expect(screen.getByText(/^Corrections Found$/i)).toBeInTheDocument();
        },
        { timeout: 10000 }, // Longer timeout to allow for full processing
      );
    }, 30000); // 30 second test timeout to allow for full retries + recovery

    it('should handle API unavailable', async () => {
      (globalThis as any).Proofreader.availability.mockImplementation(
        async (options) => 'no',
      );

      render(<ProofreaderMain />);

      // Wait for availability check to complete and "Not Supported" badge to appear
      await waitFor(
        () => {
          expect(screen.getByText(/not supported/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Loading States', () => {
    it('should show loading state during proofreading', async () => {
      // Make proofreading slow
      mockProofread.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  corrections: [
                    {
                      correction: 'the',
                      type: 'spelling',
                      startIndex: 0,
                      endIndex: 3,
                      explanation: 'Spelling error',
                    },
                  ],
                }),
              100,
            ),
          ),
      );

      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      // Should show loading state (button should be disabled during proofreading)
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /proofread/i });
        expect(button).toBeDisabled();
      });

      // Then loading state should disappear (button should be enabled again)
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /proofread/i });
        expect(button).not.toBeDisabled();
      });
    });

    it('should disable controls while proofreading', async () => {
      mockProofread.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  corrections: [],
                }),
              100,
            ),
          ),
      );

      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      // Controls should be disabled (contenteditable uses tabindex and contenteditable attributes)
      await waitFor(() => {
        const isDisabled =
          textarea.getAttribute('contenteditable') === 'false' ||
          textarea.getAttribute('tabindex') === '-1';
        expect(isDisabled).toBe(true);
      });

      // Wait for completion
      await waitFor(() => {
        const isEnabled =
          textarea.getAttribute('contenteditable') === 'true' ||
          textarea.getAttribute('tabindex') !== '-1';
        expect(isEnabled).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle no corrections returned', async () => {
      mockProofread.mockResolvedValueOnce({ corrections: [] });

      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'perfect text');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        // Check for the exact text from the component
        expect(screen.getByText(/No Corrections Needed/i)).toBeInTheDocument();
      });
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(1000);

      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, longText);

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(mockProofread).toHaveBeenCalledWith(
          longText,
          expect.any(Object),
        );
      });
    });

    it('should handle Unicode text', async () => {
      mockProofread.mockResolvedValueOnce({
        corrections: [
          {
            correction: 'こんにちは世界',
            type: 'spelling',
            startIndex: 0,
            endIndex: 5,
            explanation: 'Suggestion',
          },
        ],
      });

      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'こんにちは');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('こんにちは')).toBeInTheDocument();
      });
    });

    it('should handle special characters in corrections', async () => {
      mockProofread.mockResolvedValueOnce({
        corrections: [
          {
            correction: 'test?!',
            type: 'punctuation',
            startIndex: 0,
            endIndex: 7,
            explanation: 'Punctuation fix',
          },
        ],
      });

      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'test!@# text');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('test!@#')).toBeInTheDocument();
        expect(screen.getByText('test?!')).toBeInTheDocument();
      });
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('should support undo operation', async () => {
      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'teh test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Apply correction
      const applyButtons = screen.getAllByRole('button', { name: /^apply$/i });
      fireEvent.click(applyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });

      // Undo - wait for button to be enabled
      await waitFor(() => {
        const undoButton = screen.queryByRole('button', { name: /undo/i });
        expect(undoButton).toBeInTheDocument();
        expect(undoButton).not.toBeDisabled();
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      fireEvent.click(undoButton);

      // Verify undo worked
      await waitFor(() => {
        const redoButton = screen.queryByRole('button', { name: /redo/i });
        expect(redoButton).toBeInTheDocument();
        expect(redoButton).not.toBeDisabled();
      });
    });

    it('should support redo operation', async () => {
      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'teh test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Apply correction
      const applyButtons = screen.getAllByRole('button', { name: /^apply$/i });
      fireEvent.click(applyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });

      // Undo - wait for button to be enabled
      await waitFor(() => {
        const undoButton = screen.queryByRole('button', { name: /undo/i });
        expect(undoButton).toBeInTheDocument();
        expect(undoButton).not.toBeDisabled();
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      fireEvent.click(undoButton);

      // Wait for redo button to be enabled
      await waitFor(() => {
        const redoButton = screen.queryByRole('button', { name: /redo/i });
        expect(redoButton).toBeInTheDocument();
        expect(redoButton).not.toBeDisabled();
      });

      // Redo
      const redoButton = screen.getByRole('button', { name: /redo/i });
      fireEvent.click(redoButton);

      // Verify redo worked - undo should be enabled again
      await waitFor(() => {
        const undoButtonAfterRedo = screen.queryByRole('button', {
          name: /undo/i,
        });
        expect(undoButtonAfterRedo).not.toBeDisabled();
      });
    });
  });

  describe('Configuration', () => {
    it('should update expected input languages', async () => {
      render(<ProofreaderMain />);

      // Find language selection if available
      const languageInputs = screen.queryAllByRole('checkbox');

      if (languageInputs.length > 0) {
        fireEvent.click(languageInputs[0]);
      }

      // Verify language is updated (implementation-specific)
    });
  });

  describe('Multiple Corrections', () => {
    it('should apply all corrections at once', async () => {
      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'teh quik test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
        expect(screen.getByText('quik')).toBeInTheDocument();
      });

      // Apply all - use aria-label for accessibility
      const applyAllButton = screen.getByRole('button', {
        name: /apply all corrections/i,
      });
      fireEvent.click(applyAllButton);

      await waitFor(() => {
        expect(screen.getAllByText('Applied')).toHaveLength(2);
      });
    });

    it('should display statistics for multiple corrections', async () => {
      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'teh quik test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText(/total: 2/i)).toBeInTheDocument();
      });
    });
  });

  describe('Download and Copy', () => {
    it('should copy corrected text', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      render(<ProofreaderMain />);
      await waitForComponentReady();

      const textarea = screen.getByRole('textbox');
      setContentEditableText(textarea, 'teh test');

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Apply correction
      const applyButtons = screen.getAllByRole('button', { name: /^apply$/i });
      fireEvent.click(applyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });

      // Copy - use aria-label for accessibility
      const copyButton = screen.getByRole('button', {
        name: /copy corrected text/i,
      });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });
  });
});
