/**
 * Language Detection Integration Tests
 *
 * End-to-end integration tests for the complete language detection workflow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageDetectionMain } from '../components/tabs/PlaygroundTab';

// Mock Chrome AI API
const mockDetect = vi.fn();
const mockDetector = { detect: mockDetect };

beforeEach(() => {
  vi.clearAllMocks();

  // Setup Chrome AI mock
  (globalThis as any).LanguageDetector = {
    create: vi.fn().mockResolvedValue(mockDetector),
    capabilities: vi.fn().mockResolvedValue({
      available: 'readily',
      defaultTopK: 3,
      defaultThreshold: 0.5,
    }),
  };

  mockDetect.mockResolvedValue([
    { detectedLanguage: 'en', confidence: 0.95 },
    { detectedLanguage: 'es', confidence: 0.03 },
    { detectedLanguage: 'fr', confidence: 0.02 },
  ]);
});

describe('Language Detection Integration', () => {
  describe('Complete Workflow', () => {
    it('should complete full detection flow', async () => {
      render(<LanguageDetectionMain />);

      // 1. Enter text
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Hello world' } });

      // 2. Click detect button
      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      // 3. Wait for results
      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });

      // 4. Verify results display
      expect(screen.getByText(/95%/)).toBeInTheDocument();
      expect(mockDetect).toHaveBeenCalledWith('Hello world');
    });

    it('should update results when detecting different text', async () => {
      render(<LanguageDetectionMain />);

      // First detection
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });

      // Second detection with different text
      mockDetect.mockResolvedValueOnce([
        { detectedLanguage: 'es', confidence: 0.98 },
      ]);

      fireEvent.change(textarea, { target: { value: 'Hola' } });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('es')).toBeInTheDocument();
      });
    });

    it('should clear text and results', async () => {
      render(<LanguageDetectionMain />);

      // Enter text and detect
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });

      // Clear
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      // Verify cleared
      expect((textarea as HTMLTextAreaElement).value).toBe('');
      expect(screen.queryByText('en')).not.toBeInTheDocument();
    });
  });

  describe('Configuration Changes', () => {
    it('should filter results by confidence threshold', async () => {
      render(<LanguageDetectionMain />);

      // Set high threshold
      const thresholdSlider = screen.getByLabelText(/confidence threshold/i);
      fireEvent.change(thresholdSlider, { target: { value: '0.9' } });

      // Detect
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        // Only results above 0.9 should show
        expect(screen.getByText('en')).toBeInTheDocument(); // 0.95
        expect(screen.queryByText('es')).not.toBeInTheDocument(); // 0.03
      });
    });

    it('should limit results by maxCandidates', async () => {
      render(<LanguageDetectionMain />);

      // Set max candidates to 1
      const maxCandidatesInput = screen.getByLabelText(/max candidates/i);
      fireEvent.change(maxCandidatesInput, { target: { value: '1' } });

      // Detect
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });

      // Should only show 1 result
      expect(screen.queryByText('es')).not.toBeInTheDocument();
      expect(screen.queryByText('fr')).not.toBeInTheDocument();
    });

    it('should show all candidates when showAllCandidates enabled', async () => {
      mockDetect.mockResolvedValueOnce([
        { detectedLanguage: 'en', confidence: 0.95 },
        { detectedLanguage: 'es', confidence: 0.2 }, // Below default threshold
      ]);

      render(<LanguageDetectionMain />);

      // Enable show all
      const showAllCheckbox = screen.getByLabelText(/show all candidates/i);
      fireEvent.click(showAllCheckbox);

      // Detect
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        // Both should show regardless of threshold
        expect(screen.getByText('en')).toBeInTheDocument();
        expect(screen.getByText('es')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when detection fails', async () => {
      mockDetect.mockRejectedValueOnce(new Error('Detection failed'));

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should recover from error state', async () => {
      // First call fails
      mockDetect.mockRejectedValueOnce(new Error('Detection failed'));

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Second call succeeds
      mockDetect.mockResolvedValueOnce([
        { detectedLanguage: 'en', confidence: 0.95 },
      ]);

      fireEvent.change(textarea, { target: { value: 'Hello' } });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });

    it('should handle API unavailable', async () => {
      delete (globalThis as any).LanguageDetector;

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText(/not available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sample Texts', () => {
    it('should load sample text on button click', async () => {
      render(<LanguageDetectionMain />);

      // Find sample button
      const buttons = screen.getAllByRole('button');
      const sampleButton = buttons.find((btn) =>
        btn.textContent?.match(/english|spanish|french/i),
      );

      if (sampleButton) {
        fireEvent.click(sampleButton);

        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.value.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Copy Functionality', () => {
    it('should copy primary result', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      render(<LanguageDetectionMain />);

      // Detect
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });

      // Copy
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during detection', async () => {
      // Make detection slow
      mockDetect.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve([{ detectedLanguage: 'en', confidence: 0.95 }]),
              100,
            ),
          ),
      );

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      // Should show loading state
      expect(screen.getByText(/detecting/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });
    });

    it('should disable controls while detecting', async () => {
      mockDetect.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve([{ detectedLanguage: 'en', confidence: 0.95 }]),
              100,
            ),
          ),
      );

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

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
    it('should handle no results returned', async () => {
      mockDetect.mockResolvedValueOnce([]);

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '12345' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText(/no language detected/i)).toBeInTheDocument();
      });
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(1000);

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: longText } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });

      expect(mockDetect).toHaveBeenCalledWith(longText);
    });

    it('should handle Unicode text', async () => {
      mockDetect.mockResolvedValueOnce([
        { detectedLanguage: 'ja', confidence: 0.98 },
      ]);

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'こんにちは' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('ja')).toBeInTheDocument();
      });
    });
  });
});
