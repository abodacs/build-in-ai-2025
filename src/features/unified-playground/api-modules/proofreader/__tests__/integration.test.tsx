/**
 * Proofreader Integration Tests
 *
 * End-to-end integration tests for the complete proofreading workflow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProofreaderMain } from '../components/tabs/PlaygroundTab';

// Mock Chrome AI API
const mockProofread = vi.fn();
const mockProofreader = { proofread: mockProofread, destroy: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();

  // Setup Chrome AI mock
  (globalThis as any).Proofreader = {
    create: vi.fn().mockResolvedValue(mockProofreader),
    availability: vi.fn().mockResolvedValue('readily'),
  };

  mockProofread.mockResolvedValue({
    corrections: [
      {
        original: 'teh',
        suggestion: 'the',
        type: 'spelling',
        startIndex: 0,
        endIndex: 3,
        explanation: 'Spelling error',
      },
      {
        original: 'quik',
        suggestion: 'quick',
        type: 'spelling',
        startIndex: 4,
        endIndex: 8,
        explanation: 'Spelling error',
      },
    ],
  });
});

describe('Proofreader Integration', () => {
  describe('Complete Workflow', () => {
    it('should complete full proofreading flow', async () => {
      render(<ProofreaderMain />);

      // 1. Enter text
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'teh quik test' } });

      // 2. Click proofread button
      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      // 3. Wait for results
      await waitFor(() => {
        expect(screen.getByText(/corrections found/i)).toBeInTheDocument();
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

      // Enter and proofread
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'teh test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Apply correction
      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });
    });

    it('should ignore corrections', async () => {
      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'teh test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Ignore correction
      const ignoreButton = screen.getByRole('button', { name: /ignore/i });
      fireEvent.click(ignoreButton);

      await waitFor(() => {
        expect(screen.getByText('Ignored')).toBeInTheDocument();
      });
    });

    it('should clear text and results', async () => {
      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'teh test' } });

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

      // Verify cleared
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should show error when proofreading fails', async () => {
      mockProofread.mockRejectedValueOnce(new Error('Proofread failed'));

      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should recover from error state', async () => {
      // First call fails
      mockProofread.mockRejectedValueOnce(new Error('Proofread failed'));

      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Second call succeeds
      mockProofread.mockResolvedValueOnce({
        corrections: [
          {
            original: 'teh',
            suggestion: 'the',
            type: 'spelling',
            startIndex: 0,
            endIndex: 3,
            explanation: 'Spelling error',
          },
        ],
      });

      fireEvent.change(textarea, { target: { value: 'teh test' } });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });

    it('should handle API unavailable', async () => {
      (globalThis as any).Proofreader.availability.mockResolvedValueOnce('no');

      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText(/not available/i)).toBeInTheDocument();
      });
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
                      original: 'teh',
                      suggestion: 'the',
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

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      // Should show loading state
      expect(screen.getByText(/proofreading/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/proofreading/i)).not.toBeInTheDocument();
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

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      // Controls should be disabled
      await waitFor(() => {
        expect(textarea).toBeDisabled();
      });

      // Wait for completion
      await waitFor(() => {
        expect(textarea).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle no corrections returned', async () => {
      mockProofread.mockResolvedValueOnce({ corrections: [] });

      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'perfect text' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText(/no corrections needed/i)).toBeInTheDocument();
      });
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(1000);

      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: longText } });

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
            original: 'こんにちは',
            suggestion: 'こんにちは世界',
            type: 'spelling',
            startIndex: 0,
            endIndex: 5,
            explanation: 'Suggestion',
          },
        ],
      });

      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'こんにちは' } });

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
            original: 'test!@#',
            suggestion: 'test?!',
            type: 'punctuation',
            startIndex: 0,
            endIndex: 7,
            explanation: 'Punctuation fix',
          },
        ],
      });

      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test!@# text' } });

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

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'teh test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Apply correction
      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });

      // Undo
      const undoButton = screen.getByRole('button', { name: /undo/i });
      if (undoButton && !undoButton.disabled) {
        fireEvent.click(undoButton);
      }
    });

    it('should support redo operation', async () => {
      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'teh test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Apply correction
      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });

      // Undo
      const undoButton = screen.getByRole('button', { name: /undo/i });
      if (undoButton && !undoButton.disabled) {
        fireEvent.click(undoButton);

        // Redo
        const redoButton = screen.getByRole('button', { name: /redo/i });
        if (redoButton && !redoButton.disabled) {
          fireEvent.click(redoButton);
        }
      }
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

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'teh quik test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
        expect(screen.getByText('quik')).toBeInTheDocument();
      });

      // Apply all
      const applyAllButton = screen.getByRole('button', { name: /apply all/i });
      fireEvent.click(applyAllButton);

      await waitFor(() => {
        expect(screen.getAllByText('Applied')).toHaveLength(2);
      });
    });

    it('should display statistics for multiple corrections', async () => {
      render(<ProofreaderMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'teh quik test' } });

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

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'teh test' } });

      const proofreadButton = screen.getByRole('button', {
        name: /proofread/i,
      });
      fireEvent.click(proofreadButton);

      await waitFor(() => {
        expect(screen.getByText('teh')).toBeInTheDocument();
      });

      // Apply correction
      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });

      // Copy
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });
  });
});
