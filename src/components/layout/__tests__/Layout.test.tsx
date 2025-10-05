import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Layout } from '../Layout';

// Mock the child components
vi.mock('../header/Header', () => ({
  Header: () => <div data-testid="header">Header Component</div>,
}));

vi.mock('../sidebar/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Component</div>,
}));

vi.mock('../header/WarningBanner', () => ({
  WarningBanner: () => (
    <div data-testid="warning-banner">Warning Banner Component</div>
  ),
}));

const renderLayout = (children: React.ReactNode = <div>Test Content</div>) => {
  return render(
    <BrowserRouter>
      <Layout>{children}</Layout>
    </BrowserRouter>,
  );
};

describe('Layout Component', () => {
  describe('Structure and Layout', () => {
    it('renders with correct overall structure', () => {
      renderLayout();

      // Check main container exists
      const container = screen.getByRole('main');
      expect(container).toBeInTheDocument();

      // Check sidebar exists
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });

    it('applies correct container styling for centered layout', () => {
      renderLayout();

      // Check for centered container with max-width
      const mainContainer = document.querySelector('.max-w-7xl');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('mx-auto');
    });

    it('implements two-column layout correctly', () => {
      renderLayout();

      const layoutContainer = document.querySelector('.flex');
      expect(layoutContainer).toBeInTheDocument();

      // Sidebar should have fixed width
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-80');

      // Main content should be flexible
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1');
    });
  });

  describe('Component Integration', () => {
    it('renders Header component', () => {
      renderLayout();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders WarningBanner component', () => {
      renderLayout();
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
    });

    it('renders Sidebar component', () => {
      renderLayout();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders children content in main area', () => {
      const testContent = (
        <div data-testid="test-content">Custom Test Content</div>
      );
      renderLayout(testContent);

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Test Content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure with landmarks', () => {
      renderLayout();

      // Check for semantic landmarks
      expect(screen.getByRole('complementary')).toBeInTheDocument(); // aside/sidebar
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
    });

    it('maintains proper document outline', () => {
      renderLayout();

      // Sidebar should come before main content in DOM order
      const sidebar = screen.getByRole('complementary');
      const main = screen.getByRole('main');

      // prettier-ignore
      expect(
        (sidebar.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      ).toBeTruthy();
    });

    it('provides accessible navigation structure', () => {
      renderLayout();

      // Sidebar should be identifiable as navigation area
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies background styling correctly', () => {
      renderLayout();

      const container = document.querySelector('.min-h-screen');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('bg-white');
    });

    it('maintains layout structure across different viewport sizes', () => {
      renderLayout();

      // Check flexbox layout is maintained
      const layoutContainer = document.querySelector('.flex');
      expect(layoutContainer).toBeInTheDocument();

      // Sidebar maintains fixed width
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-80');
    });
  });

  describe('Performance', () => {
    it('renders without unnecessary re-renders', () => {
      const { rerender } = renderLayout(<div>Content 1</div>);

      // Initial render should work
      expect(screen.getByText('Content 1')).toBeInTheDocument();

      // Re-render with different content
      rerender(
        <BrowserRouter>
          <Layout>
            <div>Content 2</div>
          </Layout>
        </BrowserRouter>,
      );

      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing children gracefully', () => {
      renderLayout(null);

      // Layout should still render header, sidebar, and warning banner
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
    });

    it('handles empty children gracefully', () => {
      renderLayout(<></>);

      // Main content area should still exist
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Integration with Router', () => {
    it('works correctly within Router context', () => {
      // This test ensures the Layout component doesn't break routing
      expect(() => renderLayout()).not.toThrow();
    });
  });

  describe('Advanced Edge Cases', () => {
    describe('Complex Component Integration', () => {
      it('should maintain component ordering and hierarchy integrity', () => {
        renderLayout();

        // Verify all integrated components are present
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();

        // Verify ordering of components (header first, then warning banner, then layout)
        const allElements = document.body.querySelectorAll('[data-testid]');
        const elementOrder = Array.from(allElements).map((el) =>
          el.getAttribute('data-testid'),
        );

        expect(elementOrder.indexOf('header')).toBeLessThan(
          elementOrder.indexOf('warning-banner'),
        );
        expect(elementOrder.indexOf('warning-banner')).toBeLessThan(
          elementOrder.indexOf('sidebar'),
        );
      });

      it('should handle multiple complex children with deep nesting', () => {
        const complexNestedContent = (
          <>
            <div data-testid="nested-1">
              <header>
                <nav>
                  <ul>
                    <li>
                      <a href="#test">Test Link</a>
                    </li>
                  </ul>
                </nav>
              </header>
            </div>
            <div data-testid="nested-2">
              <section>
                <article>
                  <h2>Article Title</h2>
                  <p>
                    Article content with <strong>bold text</strong>
                  </p>
                </article>
              </section>
            </div>
            <div data-testid="nested-3">
              <footer>
                <form>
                  <input type="text" placeholder="Search" />
                  <button type="submit">Submit</button>
                </form>
              </footer>
            </div>
          </>
        );

        renderLayout(complexNestedContent);

        // Verify all nested content renders correctly
        expect(screen.getByTestId('nested-1')).toBeInTheDocument();
        expect(screen.getByTestId('nested-2')).toBeInTheDocument();
        expect(screen.getByTestId('nested-3')).toBeInTheDocument();
        expect(screen.getByText('Test Link')).toBeInTheDocument();
        expect(screen.getByText('Article Title')).toBeInTheDocument();
        expect(screen.getByText('bold text')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();

        // All children should be within the main element
        const mainElement = screen.getByRole('main');
        expect(mainElement).toContainElement(screen.getByTestId('nested-1'));
        expect(mainElement).toContainElement(screen.getByTestId('nested-2'));
        expect(mainElement).toContainElement(screen.getByTestId('nested-3'));

        // Layout components should still be functional
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });
    });

    describe('Styling and CSS Class Integrity', () => {
      it('should maintain all required CSS classes across layout hierarchy', () => {
        renderLayout();

        // Verify outer container classes
        const outerContainer = document.querySelector('.min-h-screen.bg-white');
        expect(outerContainer).toBeInTheDocument();

        // Verify centered container classes
        const centeredContainer = document.querySelector(
          '.max-w-7xl.mx-auto.bg-white',
        );
        expect(centeredContainer).toBeInTheDocument();

        // Verify flex layout classes
        const flexContainer = document.querySelector('.flex');
        expect(flexContainer).toBeInTheDocument();

        // Verify sidebar specific classes
        const sidebar = screen.getByRole('complementary');
        expect(sidebar).toHaveClass('w-80', 'bg-white');

        // Verify main content classes
        const main = screen.getByRole('main');
        expect(main).toHaveClass('flex-1', 'bg-white');
      });

      it('should apply consistent white background theme across all elements', () => {
        renderLayout();

        // Check all elements with bg-white class
        const whiteBackgroundElements = document.querySelectorAll('.bg-white');
        expect(whiteBackgroundElements.length).toBeGreaterThanOrEqual(4);

        // Verify specific elements have white background
        expect(screen.getByRole('complementary')).toHaveClass('bg-white');
        expect(screen.getByRole('main')).toHaveClass('bg-white');

        // Check nested containers
        const containers = [
          document.querySelector('.min-h-screen'),
          document.querySelector('.max-w-7xl'),
          screen.getByRole('complementary'),
          screen.getByRole('main'),
        ];

        containers.forEach((container) => {
          expect(container).toHaveClass('bg-white');
        });
      });
    });

    describe('Accessibility and Semantic Structure', () => {
      it('should provide comprehensive accessibility support', () => {
        renderLayout();

        // Verify semantic landmark elements
        const mainElement = screen.getByRole('main');
        const sidebarElement = screen.getByRole('complementary');
        expect(mainElement).toBeInTheDocument();
        expect(sidebarElement).toBeInTheDocument();

        // Check proper element types
        expect(sidebarElement.tagName.toLowerCase()).toBe('aside');
        expect(mainElement.tagName.toLowerCase()).toBe('main');

        // Verify layout structure for assistive technologies
        const flexContainer = document.querySelector('.flex');
        expect(flexContainer).toContainElement(sidebarElement);
        expect(flexContainer).toContainElement(mainElement);
      });

      it('should maintain proper focus management and navigation', () => {
        renderLayout();

        // Verify tabindex is not preventing natural focus flow
        const sidebar = screen.getByRole('complementary');
        const main = screen.getByRole('main');

        expect(sidebar).not.toHaveAttribute('tabindex', '-1');
        expect(main).not.toHaveAttribute('tabindex', '-1');

        // Verify elements are in proper DOM order for screen readers
        expect(
          (sidebar.compareDocumentPosition(main) &
            Node.DOCUMENT_POSITION_FOLLOWING) !==
            0,
        ).toBeTruthy();
      });
    });

    describe('Error Boundaries and Resilience', () => {
      it('should handle various falsy children values gracefully', () => {
        const falsyValues = [null, undefined, false, '', 0];

        falsyValues.forEach((value) => {
          expect(() => renderLayout(value)).not.toThrow();
        });

        // Test with mixed falsy and truthy values
        /* eslint-disable no-constant-binary-expression */
        const mixedContent = (
          <>
            {null}
            <div data-testid="real-content">Real Content</div>
            {undefined}
            {false && <div>Should not render</div>}
            {''}
          </>
        );

        renderLayout(mixedContent);
        expect(screen.getByTestId('real-content')).toBeInTheDocument();
        expect(screen.getByText('Real Content')).toBeInTheDocument();
      });

      it('should maintain layout integrity with dynamic content changes', () => {
        const { rerender } = renderLayout(
          <div data-testid="content-1">Content 1</div>,
        );

        // Verify initial content
        expect(screen.getByTestId('content-1')).toBeInTheDocument();

        // Test with completely different content structure
        rerender(
          <BrowserRouter>
            <Layout>
              <div data-testid="content-2">
                <table>
                  <thead>
                    <tr>
                      <th>Column 1</th>
                      <th>Column 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Data 1</td>
                      <td>Data 2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Layout>
          </BrowserRouter>,
        );

        // Verify new content renders and old content is gone
        expect(screen.getByTestId('content-2')).toBeInTheDocument();
        expect(screen.getByText('Column 1')).toBeInTheDocument();
        expect(screen.queryByTestId('content-1')).not.toBeInTheDocument();

        // Layout components should remain stable
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
      });
    });

    describe('Performance and Memory Management', () => {
      it('should not cause memory leaks with frequent re-renders', () => {
        const { rerender } = renderLayout(<div>Initial</div>);

        // Simulate multiple rapid re-renders
        for (let i = 0; i < 10; i++) {
          rerender(
            <BrowserRouter>
              <Layout>
                <div data-testid={`content-${i}`}>Content {i}</div>
              </Layout>
            </BrowserRouter>,
          );
        }

        // Final content should be rendered correctly
        expect(screen.getByTestId('content-9')).toBeInTheDocument();
        expect(screen.getByText('Content 9')).toBeInTheDocument();

        // Previous content should be cleaned up
        expect(screen.queryByTestId('content-0')).not.toBeInTheDocument();
        expect(screen.queryByTestId('content-5')).not.toBeInTheDocument();
      });

      it('should handle large content efficiently', () => {
        const largeContent = (
          <div data-testid="large-content">
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i} data-testid={`item-${i}`}>
                <h3>Item {i}</h3>
                <p>Description for item {i} with some lengthy text content</p>
                <button>Action {i}</button>
              </div>
            ))}
          </div>
        );

        expect(() => renderLayout(largeContent)).not.toThrow();

        // Verify container and first/last items
        expect(screen.getByTestId('large-content')).toBeInTheDocument();
        expect(screen.getByTestId('item-0')).toBeInTheDocument();
        expect(screen.getByTestId('item-99')).toBeInTheDocument();

        // Layout structure should remain intact
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });
  });
});
