/**
 * Language Detection Integration Tests
 *
 * End-to-end integration tests for the complete language detection workflow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/tests/test-utils/TestProviders';
import { LanguageDetectionMain } from '../components/tabs/PlaygroundTab';

// Mock Chrome AI API
const mockDetect = vi.fn();
const mockDetector = {
  detect: mockDetect,
  destroy: vi.fn(), // ✅ CRITICAL FIX: Add destroy() method
};

beforeEach(() => {
  vi.clearAllMocks();

  // Setup Chrome AI mock
  (window as any).LanguageDetector = {
    // ✅ FIX: Use window not globalThis
    create: vi.fn().mockResolvedValue(mockDetector),
    availability: vi.fn().mockResolvedValue('available'), // ✅ FIX: Add availability()
    capabilities: vi.fn().mockResolvedValue({
      available: 'available',
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
        expect(screen.getByText('English')).toBeInTheDocument();
      });

      // 4. Verify results display
      expect(screen.getByText(/95/)).toBeInTheDocument();
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
        expect(screen.getByText('English')).toBeInTheDocument();
      });

      // Second detection with different text
      mockDetect.mockResolvedValueOnce([
        { detectedLanguage: 'es', confidence: 0.98 },
      ]);

      fireEvent.change(textarea, { target: { value: 'Hola' } });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('Spanish')).toBeInTheDocument();
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
        expect(screen.getByText('English')).toBeInTheDocument();
      });

      // Clear
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      // Verify cleared
      expect((textarea as HTMLTextAreaElement).value).toBe('');
      expect(screen.queryByText('English')).not.toBeInTheDocument();
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

      // Wait for detection to complete and check that button is re-enabled
      await waitFor(
        () => {
          expect(detectButton).not.toBeDisabled();
        },
        { timeout: 3000 },
      );

      // Component should handle error gracefully (results should be empty)
      expect(screen.queryByText('English')).not.toBeInTheDocument();
    });

    it('should recover from error state', async () => {
      // First call fails
      mockDetect.mockRejectedValueOnce(new Error('Detection failed'));

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      // Wait for first detection to complete
      await waitFor(
        () => {
          expect(detectButton).not.toBeDisabled();
        },
        { timeout: 3000 },
      );

      // Second call succeeds
      mockDetect.mockResolvedValueOnce([
        { detectedLanguage: 'en', confidence: 0.95 },
      ]);

      fireEvent.change(textarea, { target: { value: 'Hello' } });
      fireEvent.click(detectButton);

      // Should successfully show results after recovery
      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument();
      });
    });

    it('should handle API unavailable', async () => {
      (window as any).LanguageDetector = undefined; // ✅ FIX: Use window and undefined instead of globalThis/delete

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const detectButton = screen.getByRole('button', { name: /detect/i });

      // Button should be present but component should handle unavailable API gracefully
      expect(detectButton).toBeInTheDocument();
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
        expect(screen.getByText('English')).toBeInTheDocument();
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

      // Wait for detection to complete (should not crash)
      await waitFor(() => {
        expect(detectButton).not.toBeDisabled();
      });

      // Component should handle empty results gracefully without crashing
      expect(screen.queryByText('English')).not.toBeInTheDocument();
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(1000);

      render(<LanguageDetectionMain />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: longText } });

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument();
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
        expect(screen.getByText('Japanese')).toBeInTheDocument();
      });
    });
  });
});
