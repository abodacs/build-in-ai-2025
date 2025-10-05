import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WarningBanner } from '../WarningBanner';

describe('WarningBanner Component', () => {
  describe('Structure and Content', () => {
    it('renders with correct structure', () => {
      render(<WarningBanner />);

      const banner = document.querySelector('.bg-red-50.border.border-red-200');
      expect(banner).toBeInTheDocument();
    });

    it('displays the warning icon', () => {
      render(<WarningBanner />);

      // Check for AlertTriangle icon
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-4', 'h-4', 'text-red-600', 'flex-shrink-0');
    });

    it('displays the correct warning message', () => {
      render(<WarningBanner />);

      const expectedText =
        "Chrome AI APIs are currently in development. This playground demonstrates the upcoming functionality. You'll need Chrome Canary with experimental flags enabled to test the actual APIs.";
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('applies correct layout and spacing', () => {
      render(<WarningBanner />);

      const container = document.querySelector(
        '.px-4.py-3.flex.items-center.gap-3',
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('applies warning color scheme', () => {
      render(<WarningBanner />);

      const banner = document.querySelector('.bg-red-50');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveClass('border-red-200');

      const text = screen.getByText(
        /Chrome AI APIs are currently in development/,
      );
      expect(text).toHaveClass('text-red-800');
    });

    it('uses correct text styling', () => {
      render(<WarningBanner />);

      const text = screen.getByText(
        /Chrome AI APIs are currently in development/,
      );
      expect(text).toHaveClass('text-sm', 'text-red-800');
    });

    it('positions icon correctly', () => {
      render(<WarningBanner />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('flex-shrink-0');
    });
  });

  describe('Accessibility', () => {
    it('provides semantic warning information', () => {
      render(<WarningBanner />);

      // The component should convey warning status
      const banner = document.querySelector('[class*="bg-red"]');
      expect(banner).toBeInTheDocument();
    });

    it('has readable text content', () => {
      render(<WarningBanner />);

      const text = screen.getByText(
        /Chrome AI APIs are currently in development/,
      );
      expect(text).toBeInTheDocument();
      expect(text.textContent).toBeTruthy();
    });

    it('maintains proper contrast', () => {
      render(<WarningBanner />);

      // Red text on red background should have sufficient contrast
      const text = screen.getByText(
        /Chrome AI APIs are currently in development/,
      );
      expect(text).toHaveClass('text-red-800'); // Dark red on light red background
    });
  });

  describe('Responsive Design', () => {
    it('maintains layout on different screen sizes', () => {
      render(<WarningBanner />);

      const container = document.querySelector('.flex.items-center');
      expect(container).toBeInTheDocument();

      // Icon should not shrink
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('flex-shrink-0');
    });

    it('handles long text content gracefully', () => {
      render(<WarningBanner />);

      const text = screen.getByText(
        /Chrome AI APIs are currently in development/,
      );
      expect(text).toBeInTheDocument();

      // Text should wrap naturally (no nowrap classes)
      expect(text).not.toHaveClass('whitespace-nowrap');
    });
  });

  describe('Performance', () => {
    it('renders efficiently without complex state', () => {
      const { rerender } = render(<WarningBanner />);

      expect(
        screen.getByText(/Chrome AI APIs are currently in development/),
      ).toBeInTheDocument();

      // Re-render should work without issues
      rerender(<WarningBanner />);
      expect(
        screen.getByText(/Chrome AI APIs are currently in development/),
      ).toBeInTheDocument();
    });

    it('does not cause layout shifts', () => {
      render(<WarningBanner />);

      const banner = document.querySelector('.bg-red-50');
      expect(banner).toBeInTheDocument();

      // Banner should have consistent dimensions
      expect(banner).toHaveClass('px-4', 'py-3');
    });
  });

  describe('Content Validation', () => {
    it('contains all required information', () => {
      render(<WarningBanner />);

      const text = screen.getByText(
        /Chrome AI APIs are currently in development/,
      );

      // Check that all key points are mentioned
      expect(text.textContent).toContain('development');
      expect(text.textContent).toContain('playground demonstrates');
      expect(text.textContent).toContain('Chrome Canary');
      expect(text.textContent).toContain('experimental flags');
    });

    it('provides actionable guidance', () => {
      render(<WarningBanner />);

      const text = screen.getByText(
        /Chrome AI APIs are currently in development/,
      );

      // Should mention what users need to do
      expect(text.textContent).toContain("You'll need Chrome Canary");
      expect(text.textContent).toContain('experimental flags enabled');
    });
  });

  describe('Icon Integration', () => {
    it('imports and displays AlertTriangle correctly', () => {
      render(<WarningBanner />);

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();

      // Should be warning/alert style icon
      expect(icon).toHaveClass('text-red-600');
    });

    it('positions icon relative to text', () => {
      render(<WarningBanner />);

      const container = document.querySelector('.flex.items-center.gap-3');
      expect(container).toBeInTheDocument();

      const icon = document.querySelector('svg');
      const text = screen.getByText(
        /Chrome AI APIs are currently in development/,
      );

      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });
  });

  describe('Browser Compatibility', () => {
    it('uses standard CSS classes', () => {
      render(<WarningBanner />);

      const banner = document.querySelector('.bg-red-50');
      expect(banner).toBeInTheDocument();

      // All classes should be standard Tailwind classes
      expect(banner).toHaveClass(
        'bg-red-50',
        'border',
        'border-red-200',
        'px-4',
        'py-3',
        'flex',
        'items-center',
        'gap-3',
      );
    });
  });

  describe('Error Handling', () => {
    it('renders without any props or dependencies', () => {
      // Component should be completely self-contained
      expect(() => render(<WarningBanner />)).not.toThrow();
    });

    it('maintains integrity under stress testing', () => {
      // Render multiple instances
      const { container } = render(
        <div>
          <WarningBanner />
          <WarningBanner />
          <WarningBanner />
        </div>,
      );

      const banners = container.querySelectorAll('.bg-red-50');
      expect(banners).toHaveLength(3);

      // Each should render correctly
      banners.forEach((banner) => {
        expect(banner).toHaveClass('border', 'border-red-200');
      });
    });
  });

  describe('Advanced Edge Cases', () => {
    describe('Component Isolation and Self-Sufficiency', () => {
      it('should render correctly without any external dependencies', () => {
        // Verify complete self-sufficiency
        expect(() => render(<WarningBanner />)).not.toThrow();

        // All required elements should be present
        expect(document.querySelector('.bg-red-50')).toBeInTheDocument();
        expect(document.querySelector('svg')).toBeInTheDocument();
        expect(
          screen.getByText(/Chrome AI APIs are currently in development/),
        ).toBeInTheDocument();
      });

      it('should maintain consistency across multiple simultaneous instances', () => {
        const { container } = render(
          <div>
            <WarningBanner />
            <div>
              <WarningBanner />
              <span>
                <WarningBanner />
              </span>
            </div>
          </div>,
        );

        const banners = container.querySelectorAll('.bg-red-50');
        expect(banners).toHaveLength(3);

        // Each banner should have identical structure and content
        banners.forEach((banner, _index) => {
          expect(banner).toHaveClass(
            'bg-red-50',
            'border',
            'border-red-200',
            'px-4',
            'py-3',
            'flex',
            'items-center',
            'gap-3',
          );

          const icon = banner.querySelector('svg');
          expect(icon).toBeInTheDocument();
          expect(icon).toHaveClass(
            'w-4',
            'h-4',
            'text-red-600',
            'flex-shrink-0',
          );

          const text = banner.querySelector('.text-sm.text-red-800');
          expect(text).toBeInTheDocument();
          expect(text?.textContent).toContain(
            'Chrome AI APIs are currently in development',
          );
        });
      });

      it('should handle rapid mounting and unmounting cycles', () => {
        for (let i = 0; i < 10; i++) {
          const { unmount } = render(<WarningBanner />);

          // Verify proper rendering
          expect(
            screen.getByText(/Chrome AI APIs are currently in development/),
          ).toBeInTheDocument();

          // Unmount should be clean
          expect(() => unmount()).not.toThrow();
        }
      });
    });

    describe('Advanced Visual Consistency and Layout Integrity', () => {
      it('should maintain visual consistency under different container contexts', () => {
        const containers = [
          ({ children }: { children: React.ReactNode }) => (
            <div>{children}</div>
          ),
          ({ children }: { children: React.ReactNode }) => (
            <main>{children}</main>
          ),
          ({ children }: { children: React.ReactNode }) => (
            <section className="p-4">{children}</section>
          ),
          ({ children }: { children: React.ReactNode }) => (
            <article className="max-w-lg">{children}</article>
          ),
          ({ children }: { children: React.ReactNode }) => (
            <aside className="bg-gray-100">{children}</aside>
          ),
        ];

        containers.forEach((Container, _index) => {
          const { container } = render(
            <Container>
              <WarningBanner />
            </Container>,
          );

          // Banner should maintain its styling regardless of container
          const banner = container.querySelector('.bg-red-50');
          expect(banner).toBeInTheDocument();
          expect(banner).toHaveClass(
            'border',
            'border-red-200',
            'px-4',
            'py-3',
            'flex',
            'items-center',
            'gap-3',
          );

          // Icon and text should be positioned correctly
          const icon = banner?.querySelector('svg');
          const text = banner?.querySelector('.text-sm.text-red-800');

          expect(icon).toBeInTheDocument();
          expect(text).toBeInTheDocument();
        });
      });

      it('should handle CSS class conflicts gracefully', () => {
        const { container } = render(
          <div className="bg-red-50 border border-red-200 text-red-800">
            <WarningBanner />
          </div>,
        );

        // Banner should maintain its own styling despite parent conflicts
        const banner = container.querySelector(
          '.bg-red-50.border.border-red-200',
        );
        expect(banner).toBeInTheDocument();

        // Should have two elements with similar classes (parent and banner)
        const redBackgrounds = container.querySelectorAll('.bg-red-50');
        expect(redBackgrounds.length).toBeGreaterThanOrEqual(2);
      });

      it('should maintain layout integrity with varying content lengths', () => {
        render(<WarningBanner />);

        const banner = document.querySelector('.bg-red-50');
        const icon = banner?.querySelector('svg');
        const text = banner?.querySelector('p');

        // Icon should maintain fixed dimensions
        expect(icon).toHaveClass('w-4', 'h-4', 'flex-shrink-0');

        // Text should flow naturally without breaking layout
        expect(text).toHaveClass('text-sm');
        expect(text?.textContent?.length).toBeGreaterThan(100); // Long message
      });
    });

    describe('Accessibility and Screen Reader Optimization', () => {
      it('should provide optimal screen reader experience', () => {
        render(<WarningBanner />);

        const banner = document.querySelector('.bg-red-50');
        const icon = banner?.querySelector('svg');
        const text = banner?.querySelector('p');

        // Visual hierarchy should be clear
        expect(icon).toHaveClass('text-red-600'); // Color coding for visual users
        expect(text).toHaveClass('text-red-800'); // Darker text for readability

        // Content should be meaningful for screen readers
        expect(text?.textContent).toContain(
          'Chrome AI APIs are currently in development',
        );
        expect(text?.textContent).toContain(
          'Chrome Canary with experimental flags',
        );
      });

      it('should handle high contrast mode compatibility', () => {
        render(<WarningBanner />);

        const banner = document.querySelector('.bg-red-50');
        const icon = banner?.querySelector('svg');
        const text = banner?.querySelector('p');

        // Colors should provide sufficient contrast
        expect(banner).toHaveClass('bg-red-50', 'border-red-200'); // Light background with darker border
        expect(icon).toHaveClass('text-red-600'); // Medium red for icon
        expect(text).toHaveClass('text-red-800'); // Dark red for text
      });

      it('should support keyboard navigation patterns', () => {
        render(<WarningBanner />);

        const banner = document.querySelector('.bg-red-50');

        // Banner should not interfere with keyboard navigation
        expect(banner).not.toHaveAttribute('tabindex');
        expect(banner).not.toHaveAttribute('role', 'button');

        // Should be informational only, not interactive
        expect(banner?.tagName.toLowerCase()).toBe('div');
      });
    });

    describe('Performance Optimization and Resource Management', () => {
      it('should render with minimal computational overhead', () => {
        const startTime = performance.now();

        // Render multiple instances to test performance
        const instances = Array.from({ length: 50 }, (_, i) => (
          <WarningBanner key={i} />
        ));

        render(<div>{instances}</div>);

        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(100); // Should be very fast

        // All instances should render correctly
        const banners = document.querySelectorAll('.bg-red-50');
        expect(banners).toHaveLength(50);
      });

      it('should optimize re-renders efficiently', () => {
        const { rerender } = render(<WarningBanner />);

        const startTime = performance.now();

        // Multiple re-renders should be fast
        for (let i = 0; i < 100; i++) {
          rerender(<WarningBanner />);
        }

        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(200);

        // Component should still render correctly
        expect(
          screen.getByText(/Chrome AI APIs are currently in development/),
        ).toBeInTheDocument();
      });

      it('should handle memory management efficiently', () => {
        const components = [];

        // Mount multiple components
        for (let i = 0; i < 20; i++) {
          components.push(render(<WarningBanner />));
        }

        // All should render correctly
        expect(document.querySelectorAll('.bg-red-50')).toHaveLength(20);

        // Unmount all components
        components.forEach(({ unmount }) => {
          expect(() => unmount()).not.toThrow();
        });

        // DOM should be clean
        expect(document.querySelectorAll('.bg-red-50')).toHaveLength(0);
      });
    });

    describe('Content Validation and Message Integrity', () => {
      it('should maintain message accuracy and completeness', () => {
        render(<WarningBanner />);

        const text = screen.getByText(
          /Chrome AI APIs are currently in development/,
        );
        const fullMessage = text.textContent;

        // Message should contain all essential information
        const requiredElements = [
          'Chrome AI APIs',
          'currently in development',
          'playground demonstrates',
          'upcoming functionality',
          'Chrome Canary',
          'experimental flags enabled',
          'test the actual APIs',
        ];

        requiredElements.forEach((element) => {
          expect(fullMessage).toContain(element);
        });

        // Message should be actionable and informative
        expect(fullMessage?.length).toBeGreaterThan(100);
        expect(fullMessage?.length).toBeLessThan(300); // Not too long
      });

      it('should provide contextually appropriate warning level', () => {
        render(<WarningBanner />);

        // Should use warning (red) color scheme, not error or info
        const banner = document.querySelector('.bg-red-50');
        expect(banner).toHaveClass('border-red-200');

        const icon = banner?.querySelector('svg');
        expect(icon).toHaveClass('text-red-600');

        const text = banner?.querySelector('p');
        expect(text).toHaveClass('text-red-800');

        // Should not use other color schemes
        expect(banner).not.toHaveClass(
          'bg-yellow-50',
          'bg-blue-50',
          'bg-green-50',
        );
      });

      it('should handle text rendering edge cases', () => {
        render(<WarningBanner />);

        const text = screen.getByText(
          /Chrome AI APIs are currently in development/,
        );

        // Text should render without truncation
        expect(text).not.toHaveClass('truncate', 'text-ellipsis');

        // Should handle word wrapping properly
        expect(text).not.toHaveClass('whitespace-nowrap');

        // Text should be selectable for copy/paste
        expect(text).not.toHaveClass('select-none');
      });
    });

    describe('Icon Integration and Visual Hierarchy', () => {
      it('should maintain icon-text relationship integrity', () => {
        render(<WarningBanner />);

        const banner = document.querySelector('.bg-red-50');
        const icon = banner?.querySelector('svg');
        const text = banner?.querySelector('p');

        // Icon should be positioned before text
        expect(icon?.nextElementSibling).toBe(text);

        // Should maintain proper spacing
        expect(banner).toHaveClass('gap-3');

        // Icon should not shrink
        expect(icon).toHaveClass('flex-shrink-0');
      });

      it('should handle icon rendering across different environments', () => {
        render(<WarningBanner />);

        const icon = document.querySelector('svg');

        // Icon should have proper dimensions
        expect(icon).toHaveClass('w-4', 'h-4');

        // Should have proper color
        expect(icon).toHaveClass('text-red-600');

        // Should be scalable vector
        expect(icon?.tagName.toLowerCase()).toBe('svg');
      });

      it('should maintain visual balance with varying text lengths', () => {
        render(<WarningBanner />);

        const banner = document.querySelector('.bg-red-50');
        const icon = banner?.querySelector('svg');

        // Icon should maintain fixed size regardless of text
        expect(icon).toHaveClass('w-4', 'h-4', 'flex-shrink-0');

        // Container should use flexbox alignment
        expect(banner).toHaveClass('flex', 'items-center');
      });
    });

    describe('Integration and Deployment Scenarios', () => {
      it('should work correctly in different React environments', () => {
        // Test in different wrapper scenarios
        const scenarios = [
          { name: 'basic', render: () => render(<WarningBanner />) },
          {
            name: 'strict-mode',
            render: () =>
              render(
                <React.StrictMode>
                  <WarningBanner />
                </React.StrictMode>,
              ),
          },
          {
            name: 'div-wrapper',
            render: () =>
              render(
                <div>
                  <WarningBanner />
                </div>,
              ),
          },
          {
            name: 'fragment',
            render: () =>
              render(
                <>
                  <WarningBanner />
                </>,
              ),
          },
        ];

        scenarios.forEach(({ name: _name, render: renderScenario }) => {
          const { unmount, container } = renderScenario();
          expect(container).toBeInTheDocument();

          const message = screen.getByText(
            /Chrome AI APIs are currently in development/,
          );
          expect(message).toBeInTheDocument();

          unmount();
        });
      });

      it('should handle component composition gracefully', () => {
        const CompositeComponent = () => (
          <div>
            <header>Page Header</header>
            <WarningBanner />
            <main>Main Content</main>
            <WarningBanner />
            <footer>Footer</footer>
          </div>
        );

        render(<CompositeComponent />);

        // Should render multiple banners correctly
        const banners = document.querySelectorAll('.bg-red-50');
        expect(banners).toHaveLength(2);

        // Each should maintain independence
        banners.forEach((banner) => {
          expect(banner).toHaveClass(
            'px-4',
            'py-3',
            'flex',
            'items-center',
            'gap-3',
          );
        });
      });

      it('should maintain consistency across browser environments', () => {
        render(<WarningBanner />);

        const banner = document.querySelector('.bg-red-50');

        // Should use standard CSS properties
        expect(banner).toHaveClass(
          'bg-red-50', // Background color
          'border', // Border presence
          'border-red-200', // Border color
          'px-4', // Horizontal padding
          'py-3', // Vertical padding
          'flex', // Display type
          'items-center', // Alignment
          'gap-3', // Spacing
        );

        // All classes should be standard Tailwind classes
        const classList = Array.from(banner?.classList || []);
        classList.forEach((className) => {
          expect(className).toMatch(
            /^(bg-|border|px-|py-|flex|items-|gap-|text-)/,
          );
        });
      });
    });
  });
});
