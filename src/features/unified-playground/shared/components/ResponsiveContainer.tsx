/**
 * ResponsiveContainer Component
 *
 * Standardized responsive wrapper with pre-configured variants.
 * Provides consistent padding, max-width, and centering across all breakpoints.
 *
 * @module shared/components/ResponsiveContainer
 *
 * @example
 * ```tsx
 * // Default variant - optimal for most content
 * <ResponsiveContainer>
 *   <YourContent />
 * </ResponsiveContainer>
 *
 * // Code variant - optimal for code viewing
 * <ResponsiveContainer variant="code">
 *   <CodeBlock />
 * </ResponsiveContainer>
 *
 * // Narrow variant - optimal for forms/reading
 * <ResponsiveContainer variant="narrow">
 *   <Form />
 * </ResponsiveContainer>
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Variants
// ============================================================================

const responsiveContainerVariants = cva(
  // Base styles - applied to all variants
  'w-full mx-auto',
  {
    variants: {
      /**
       * Container width variants
       * - default: Standard content width (optimal for most content)
       * - narrow: Narrower width (optimal for forms, reading)
       * - wide: Wider width (optimal for dashboards, tables)
       * - full: Full width (no max-width constraint)
       * - code: Optimal for code viewing (slightly wider than default)
       */
      variant: {
        default: 'max-w-7xl', // 1280px
        narrow: 'max-w-4xl', // 896px - optimal reading width
        wide: 'max-w-screen-2xl', // 1536px
        full: 'max-w-none',
        code: 'max-w-6xl', // 1152px - optimal for code
      },

      /**
       * Responsive padding
       * - default: Standard responsive padding
       * - compact: Reduced padding (for dense UIs)
       * - spacious: Increased padding (for generous spacing)
       * - none: No padding
       */
      padding: {
        default: 'px-4 sm:px-6 lg:px-8',
        compact: 'px-3 sm:px-4 lg:px-6',
        spacious: 'px-6 sm:px-8 lg:px-12',
        none: 'px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  },
);

// ============================================================================
// Types
// ============================================================================

export interface ResponsiveContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof responsiveContainerVariants> {
  /**
   * Content to be wrapped
   */
  children: React.ReactNode;

  /**
   * Semantic HTML element to render
   * @default 'div'
   */
  as?: 'div' | 'section' | 'article' | 'main' | 'aside';
}

// ============================================================================
// Component
// ============================================================================

/**
 * ResponsiveContainer
 *
 * A standardized container component that handles responsive padding and max-width
 * constraints. Ensures consistent layouts across all screen sizes.
 *
 * Features:
 * - Multiple width variants for different content types
 * - Responsive padding that scales with breakpoints
 * - Automatic horizontal centering
 * - Semantic HTML support
 * - Fully customizable via className prop
 *
 * @example
 * ```tsx
 * // Standard content container
 * <ResponsiveContainer>
 *   <h1>My Content</h1>
 * </ResponsiveContainer>
 *
 * // Form container (narrow for better readability)
 * <ResponsiveContainer variant="narrow">
 *   <Form />
 * </ResponsiveContainer>
 *
 * // Code viewer (optimized width)
 * <ResponsiveContainer variant="code" padding="compact">
 *   <SyntaxHighlighter />
 * </ResponsiveContainer>
 *
 * // Full-width dashboard
 * <ResponsiveContainer variant="full">
 *   <Dashboard />
 * </ResponsiveContainer>
 *
 * // Semantic HTML
 * <ResponsiveContainer as="main">
 *   <PageContent />
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
  children,
  variant,
  padding,
  className,
  as: Component = 'div',
  ...props
}: ResponsiveContainerProps) {
  return (
    <Component
      className={cn(
        responsiveContainerVariants({ variant, padding }),
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default ResponsiveContainer;
