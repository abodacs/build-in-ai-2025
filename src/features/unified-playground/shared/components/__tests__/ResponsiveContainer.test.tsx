/**
 * ResponsiveContainer Component Tests
 *
 * Tests for responsive wrapper component with multiple variants
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { ResponsiveContainer } from '../ResponsiveContainer';

// Extend Vitest matchers with axe
expect.extend(matchers);

describe('ResponsiveContainer', () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic rendering', () => {
    it('should render children correctly', () => {
      render(
        <ResponsiveContainer>
          <div data-testid="test-child">Test Content</div>
        </ResponsiveContainer>,
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toHaveTextContent(
        'Test Content',
      );
    });

    it('should render as div by default', () => {
      const { container } = render(
        <ResponsiveContainer>Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('DIV');
    });

    it('should apply base classes', () => {
      const { container } = render(
        <ResponsiveContainer>Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('w-full');
      expect(element).toHaveClass('mx-auto');
    });
  });

  // ==========================================================================
  // Width Variants
  // ==========================================================================

  describe('Width variants', () => {
    it('should apply default variant (max-w-7xl)', () => {
      const { container } = render(
        <ResponsiveContainer variant="default">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('max-w-7xl');
    });

    it('should apply narrow variant (max-w-4xl)', () => {
      const { container } = render(
        <ResponsiveContainer variant="narrow">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('max-w-4xl');
    });

    it('should apply wide variant (max-w-screen-2xl)', () => {
      const { container } = render(
        <ResponsiveContainer variant="wide">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('max-w-screen-2xl');
    });

    it('should apply full variant (max-w-none)', () => {
      const { container } = render(
        <ResponsiveContainer variant="full">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('max-w-none');
    });

    it('should apply code variant (max-w-6xl)', () => {
      const { container } = render(
        <ResponsiveContainer variant="code">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('max-w-6xl');
    });

    it('should use default variant when not specified', () => {
      const { container } = render(
        <ResponsiveContainer>Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('max-w-7xl');
    });
  });

  // ==========================================================================
  // Padding Variants
  // ==========================================================================

  describe('Padding variants', () => {
    it('should apply default padding (px-4 sm:px-6 lg:px-8)', () => {
      const { container } = render(
        <ResponsiveContainer padding="default">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('px-4');
      expect(element).toHaveClass('sm:px-6');
      expect(element).toHaveClass('lg:px-8');
    });

    it('should apply compact padding (px-3 sm:px-4 lg:px-6)', () => {
      const { container } = render(
        <ResponsiveContainer padding="compact">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('px-3');
      expect(element).toHaveClass('sm:px-4');
      expect(element).toHaveClass('lg:px-6');
    });

    it('should apply spacious padding (px-6 sm:px-8 lg:px-12)', () => {
      const { container } = render(
        <ResponsiveContainer padding="spacious">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('px-6');
      expect(element).toHaveClass('sm:px-8');
      expect(element).toHaveClass('lg:px-12');
    });

    it('should apply no padding (px-0)', () => {
      const { container } = render(
        <ResponsiveContainer padding="none">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('px-0');
    });

    it('should use default padding when not specified', () => {
      const { container } = render(
        <ResponsiveContainer>Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('px-4');
      expect(element).toHaveClass('sm:px-6');
      expect(element).toHaveClass('lg:px-8');
    });
  });

  // ==========================================================================
  // Semantic HTML Support
  // ==========================================================================

  describe('Semantic HTML support', () => {
    it('should render as section when specified', () => {
      const { container } = render(
        <ResponsiveContainer as="section">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('SECTION');
    });

    it('should render as article when specified', () => {
      const { container } = render(
        <ResponsiveContainer as="article">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('ARTICLE');
    });

    it('should render as main when specified', () => {
      const { container } = render(
        <ResponsiveContainer as="main">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('MAIN');
    });

    it('should render as aside when specified', () => {
      const { container } = render(
        <ResponsiveContainer as="aside">Content</ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('ASIDE');
    });
  });

  // ==========================================================================
  // Combined Variants
  // ==========================================================================

  describe('Combined variants', () => {
    it('should combine width and padding variants', () => {
      const { container } = render(
        <ResponsiveContainer variant="narrow" padding="compact">
          Content
        </ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      // Width variant
      expect(element).toHaveClass('max-w-4xl');
      // Padding variant
      expect(element).toHaveClass('px-3');
      expect(element).toHaveClass('sm:px-4');
      expect(element).toHaveClass('lg:px-6');
    });

    it('should work with semantic HTML and variants', () => {
      const { container } = render(
        <ResponsiveContainer as="article" variant="code" padding="spacious">
          Content
        </ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('ARTICLE');
      expect(element).toHaveClass('max-w-6xl');
      expect(element).toHaveClass('px-6');
      expect(element).toHaveClass('sm:px-8');
      expect(element).toHaveClass('lg:px-12');
    });
  });

  // ==========================================================================
  // Custom Props
  // ==========================================================================

  describe('Custom props', () => {
    it('should accept and apply custom className', () => {
      const { container } = render(
        <ResponsiveContainer className="custom-class bg-red-500">
          Content
        </ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-class');
      expect(element).toHaveClass('bg-red-500');
      // Should also have base classes
      expect(element).toHaveClass('w-full');
      expect(element).toHaveClass('mx-auto');
    });

    it('should forward additional HTML attributes', () => {
      const { container } = render(
        <ResponsiveContainer data-testid="container" id="test-container">
          Content
        </ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('data-testid', 'container');
      expect(element).toHaveAttribute('id', 'test-container');
    });

    it('should forward ARIA attributes', () => {
      const { container } = render(
        <ResponsiveContainer
          aria-label="Test container"
          role="region"
          aria-live="polite"
        >
          Content
        </ResponsiveContainer>,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('aria-label', 'Test container');
      expect(element).toHaveAttribute('role', 'region');
      expect(element).toHaveAttribute('aria-live', 'polite');
    });
  });

  // ==========================================================================
  // Real-World Use Cases
  // ==========================================================================

  describe('Real-world use cases', () => {
    it('should work for form layouts (narrow variant)', () => {
      render(
        <ResponsiveContainer variant="narrow">
          <form data-testid="test-form">
            <input type="text" />
            <button>Submit</button>
          </form>
        </ResponsiveContainer>,
      );

      const form = screen.getByTestId('test-form');
      expect(form).toBeInTheDocument();
      expect(form.parentElement).toHaveClass('max-w-4xl');
    });

    it('should work for code viewing (code variant with compact padding)', () => {
      render(
        <ResponsiveContainer variant="code" padding="compact">
          <pre data-testid="code-block">
            <code>const x = 42;</code>
          </pre>
        </ResponsiveContainer>,
      );

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock.parentElement).toHaveClass('max-w-6xl');
      expect(codeBlock.parentElement).toHaveClass('px-3');
    });

    it('should work for dashboards (wide variant)', () => {
      render(
        <ResponsiveContainer variant="wide">
          <div data-testid="dashboard">Dashboard Content</div>
        </ResponsiveContainer>,
      );

      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard.parentElement).toHaveClass('max-w-screen-2xl');
    });

    it('should work for full-width layouts (full variant, no padding)', () => {
      render(
        <ResponsiveContainer variant="full" padding="none">
          <div data-testid="full-width">Full Width Content</div>
        </ResponsiveContainer>,
      );

      const content = screen.getByTestId('full-width');
      expect(content.parentElement).toHaveClass('max-w-none');
      expect(content.parentElement).toHaveClass('px-0');
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have no accessibility violations (default)', async () => {
      const { container } = render(
        <ResponsiveContainer>
          <div>Accessible content</div>
        </ResponsiveContainer>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (with semantic HTML)', async () => {
      const { container } = render(
        <ResponsiveContainer as="section" aria-label="Test section">
          <h2>Section Heading</h2>
          <p>Section content</p>
        </ResponsiveContainer>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (with ARIA attributes)', async () => {
      const { container } = render(
        <ResponsiveContainer
          role="region"
          aria-label="Main content area"
          aria-live="polite"
        >
          <div>Dynamic content</div>
        </ResponsiveContainer>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (with interactive content)', async () => {
      const { container } = render(
        <ResponsiveContainer variant="narrow">
          <form>
            <label htmlFor="test-input">Test Input</label>
            <input id="test-input" type="text" />
            <button type="submit">Submit</button>
          </form>
        </ResponsiveContainer>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (all variants)', async () => {
      const variants = ['default', 'narrow', 'wide', 'full', 'code'] as const;

      for (const variant of variants) {
        const { container } = render(
          <ResponsiveContainer variant={variant}>
            <div>Content for {variant} variant</div>
          </ResponsiveContainer>,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });
});
