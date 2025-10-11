/**
 * RewriterMain Component
 *
 * Main interface component for Rewriter API.
 * Provides tab navigation between Playground and Batch modes.
 *
 * @module rewriter/components/RewriterMain
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaygroundTab } from './tabs/PlaygroundTab';
import { BatchTab } from './tabs/BatchTab';

// ============================================================================
// Component
// ============================================================================

/**
 * Rewriter Main Component
 *
 * Provides tab-based navigation for single and batch rewriting operations.
 *
 * @example
 * ```tsx
 * <RewriterMain />
 * ```
 */
export function RewriterMain() {
  return (
    <Tabs defaultValue="playground" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="playground">Playground</TabsTrigger>
        <TabsTrigger value="batch">Batch Processing</TabsTrigger>
      </TabsList>

      <TabsContent value="playground">
        <PlaygroundTab />
      </TabsContent>

      <TabsContent value="batch">
        <BatchTab />
      </TabsContent>
    </Tabs>
  );
}

// ============================================================================
// Export
// ============================================================================

export default RewriterMain;
