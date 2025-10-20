/**
 * CodeModalSkeleton Component
 *
 * Skeleton loader for CodeModal during code generation
 * Mimics the modal layout to provide visual feedback
 *
 * @module CodeModalSkeleton
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface CodeModalSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Skeleton loader that mimics CodeModal layout
 * Shows during code generation (>200ms)
 */
export function CodeModalSkeleton({ className }: CodeModalSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Requirements Section Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>

      {/* Configuration Display Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Code Block Skeleton */}
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CodeModalSkeleton;
