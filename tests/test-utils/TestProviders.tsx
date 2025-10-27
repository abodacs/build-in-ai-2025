/**
 * Test Providers - Universal wrapper for component tests
 *
 * Provides all necessary context providers for testing components
 * Includes: ThemeProvider, CodeThemeProvider, Router
 */

import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../src/providers/ThemeProvider';
import { CodeThemeProvider } from '../../src/providers/CodeThemeProvider';

// ============================================================================
// Test Providers Component
// ============================================================================

interface TestProvidersProps {
  children: ReactNode;
  initialRoute?: string;
  theme?: 'light' | 'dark' | 'system';
  codeTheme?: 'light' | 'dark' | 'auto';
}

/**
 * Wraps children with all required providers for testing
 */
export function TestProviders({
  children,
  initialRoute = '/',
  theme = 'light',
  codeTheme = 'light',
}: TestProvidersProps) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider defaultTheme={theme} storageKey="test-theme">
        <CodeThemeProvider
          defaultCodeTheme={codeTheme}
          storageKey="test-code-theme"
        >
          {children}
        </CodeThemeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

// ============================================================================
// Custom Render Function
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  theme?: 'light' | 'dark' | 'system';
  codeTheme?: 'light' | 'dark' | 'auto';
}

/**
 * Custom render function that wraps components with TestProviders
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/tests/test-utils/TestProviders';
 *
 * test('renders component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />, {
 *     theme: 'dark',
 *     initialRoute: '/settings'
 *   });
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) {
  const {
    initialRoute = '/',
    theme = 'light',
    codeTheme = 'light',
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders
      initialRoute={initialRoute}
      theme={theme}
      codeTheme={codeTheme}
    >
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// ============================================================================
// Exports
// ============================================================================

export default TestProviders;

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with renderWithProviders
export { renderWithProviders as render };
