/**
 * Developer Tools Main Component
 *
 * Integrated developer tools panel with performance monitoring,
 * debugging console, and API comparison
 *
 * @module dev-tools/DevTools
 */

import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

import { useDebugStore } from './stores/debugStore';
import { PerformanceMonitor, DebugConsole, APIComparison } from './components';

// ============================================================================
// Component
// ============================================================================

export function DevTools() {
  const { isOpen, activeTab, setActiveTab, togglePanel } = useDebugStore();

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        togglePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Developer Tools</h1>
          <div className="text-xs text-muted-foreground">
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded border">
              Ctrl+Shift+D
            </kbd>{' '}
            to toggle
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePanel}
          aria-label="Close developer tools"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as 'performance' | 'debug' | 'comparison')
          }
          className="h-full flex flex-col"
        >
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="debug">Debug Console</TabsTrigger>
            <TabsTrigger value="comparison">API Comparison</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="performance" className="h-full m-0">
              <PerformanceMonitor />
            </TabsContent>

            <TabsContent value="debug" className="h-full m-0">
              <DebugConsole />
            </TabsContent>

            <TabsContent value="comparison" className="h-full m-0">
              <APIComparison />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================================
// Toggle Button Component
// ============================================================================

/**
 * Floating toggle button for developer tools
 */
export function DevToolsToggle() {
  const { isOpen, togglePanel } = useDebugStore();

  if (isOpen) {
    return null;
  }

  return (
    <Button
      onClick={togglePanel}
      className="fixed bottom-4 right-4 z-50 shadow-lg"
      size="lg"
      title="Open Developer Tools (Ctrl+Shift+D)"
    >
      <svg
        className="h-5 w-5 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
      Dev Tools
    </Button>
  );
}
