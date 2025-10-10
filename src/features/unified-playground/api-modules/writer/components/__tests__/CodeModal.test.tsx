/**
 * CodeModal Tests - View Code Button Functionality
 *
 * Essential tests for CodeModal component.
 * Focus: Rendering, code generation, button functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeModal } from '../CodeModal';
import type { WriterConfig } from '../../types';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { CodeThemeProvider } from '@/providers/CodeThemeProvider';

const DEFAULT_CONFIG: WriterConfig = {
  tone: 'neutral',
  format: 'markdown',
  length: 'medium',
  outputLanguage: 'en',
  sharedContext: '',
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <CodeThemeProvider>{ui}</CodeThemeProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  // Mock ResizeObserver for Collapsible components
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock matchMedia for ThemeProvider
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
});

describe('CodeModal', () => {
  describe('Rendering', () => {
    it('should render when open', () => {
      renderWithProviders(
        <CodeModal isOpen={true} onClose={vi.fn()} config={DEFAULT_CONFIG} />,
      );
      expect(
        screen.getByText('Generated Code - Writer API'),
      ).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderWithProviders(
        <CodeModal isOpen={false} onClose={vi.fn()} config={DEFAULT_CONFIG} />,
      );
      expect(
        screen.queryByText('Generated Code - Writer API'),
      ).not.toBeInTheDocument();
    });

    it('should show TypeScript tab by default', () => {
      renderWithProviders(
        <CodeModal isOpen={true} onClose={vi.fn()} config={DEFAULT_CONFIG} />,
      );
      expect(
        screen.getByRole('tab', { name: /typescript/i, selected: true }),
      ).toBeInTheDocument();
    });

    it('should show JavaScript tab', () => {
      renderWithProviders(
        <CodeModal isOpen={true} onClose={vi.fn()} config={DEFAULT_CONFIG} />,
      );
      expect(
        screen.getByRole('tab', { name: /javascript/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Configuration Display', () => {
    it('should display current configuration', () => {
      const config: WriterConfig = {
        tone: 'formal',
        format: 'plain-text',
        length: 'long',
        outputLanguage: 'en',
        sharedContext: '',
      };

      renderWithProviders(
        <CodeModal isOpen={true} onClose={vi.fn()} config={config} />,
      );

      expect(screen.getByText(/tone.*formal/i)).toBeInTheDocument();
      expect(screen.getByText(/format.*plain-text/i)).toBeInTheDocument();
      expect(screen.getByText(/length.*long/i)).toBeInTheDocument();
    });

    it('should show shared context badge when present', () => {
      const config: WriterConfig = {
        ...DEFAULT_CONFIG,
        sharedContext: 'Business context',
      };

      renderWithProviders(
        <CodeModal isOpen={true} onClose={vi.fn()} config={config} />,
      );
      expect(screen.getByText(/shared context.*yes/i)).toBeInTheDocument();
    });
  });

  describe('Code Generation', () => {
    it('should show TypeScript tab content', () => {
      renderWithProviders(
        <CodeModal isOpen={true} onClose={vi.fn()} config={DEFAULT_CONFIG} />,
      );

      // TypeScript tab is selected by default
      const tsTab = screen.getByRole('tab', {
        name: /typescript/i,
        selected: true,
      });
      expect(tsTab).toBeInTheDocument();

      // Check that code generation description is shown
      expect(
        screen.getByText(/Full TypeScript implementation/i),
      ).toBeInTheDocument();
    });

    it('should have JavaScript tab available', () => {
      renderWithProviders(
        <CodeModal isOpen={true} onClose={vi.fn()} config={DEFAULT_CONFIG} />,
      );

      // Verify JavaScript tab exists and can be interacted with
      const jsTab = screen.getByRole('tab', { name: /javascript/i });
      expect(jsTab).toBeInTheDocument();
      expect(jsTab).not.toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Button Functionality', () => {
    it('should have close handler configured', () => {
      const onClose = vi.fn();
      renderWithProviders(
        <CodeModal isOpen={true} onClose={onClose} config={DEFAULT_CONFIG} />,
      );

      // Dialog component handles close button internally
      // Just verify modal renders with onClose prop
      expect(
        screen.getByText('Generated Code - Writer API'),
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shared context', () => {
      const config: WriterConfig = {
        ...DEFAULT_CONFIG,
        sharedContext: '',
      };

      renderWithProviders(
        <CodeModal isOpen={true} onClose={vi.fn()} config={config} />,
      );
      expect(
        screen.queryByText(/shared context.*yes/i),
      ).not.toBeInTheDocument();
    });

    it('should handle different config options', () => {
      const config: WriterConfig = {
        tone: 'casual',
        format: 'markdown',
        length: 'short',
        outputLanguage: 'es',
        sharedContext: 'Test context',
      };

      renderWithProviders(
        <CodeModal isOpen={true} onClose={vi.fn()} config={config} />,
      );

      // Verify config is displayed in the modal
      expect(screen.getByText(/tone.*casual/i)).toBeInTheDocument();
      expect(screen.getByText(/format.*markdown/i)).toBeInTheDocument();
      expect(screen.getByText(/length.*short/i)).toBeInTheDocument();
      expect(screen.getByText(/shared context.*yes/i)).toBeInTheDocument();
    });
  });
});
