/**
 * Unified Playground Component
 *
 * Main playground interface that integrates all Chrome AI API modules
 * Provides tab-based navigation and API-specific content
 *
 * @module UnifiedPlayground
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Settings,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Menu,
} from 'lucide-react';

// Import API modules registry
import { API_MODULES, getAPIModule } from './api-modules';

// Import responsive hooks
import { useIsDesktop } from './shared/hooks/useBreakpoint';

// ============================================================================
// Types
// ============================================================================

interface UnifiedPlaygroundProps {
  /** Initial API to display */
  initialAPI?: string;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * API Selector Content
 * Shared between mobile drawer and desktop sidebar
 */
function APISelectorContent({
  selectedAPI,
  onSelect,
  onAfterSelect,
}: {
  selectedAPI: string;
  onSelect: (apiId: string) => void;
  onAfterSelect?: () => void;
}) {
  const handleSelect = (apiId: string) => {
    onSelect(apiId);
    // Close drawer on mobile after selection
    onAfterSelect?.();
  };

  return (
    <div className="space-y-2">
      {Object.values(API_MODULES).map((module) => (
        <Button
          key={module.id}
          variant={selectedAPI === module.id ? 'default' : 'ghost'}
          className="w-full justify-start h-auto p-3 text-left touch-target tap-fast"
          onClick={() => handleSelect(module.id)}
          disabled={!module.available}
        >
          <div className="flex items-start gap-3 w-full">
            <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                {module.name}
                {module.available ? (
                  <Badge variant="secondary" className="text-xs">
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Soon
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-pretty">
                {module.description}
              </div>
            </div>
            {selectedAPI === module.id && (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
          </div>
        </Button>
      ))}
    </div>
  );
}

/**
 * Mobile API Selector (Drawer)
 */
function MobileAPISelector({
  selectedAPI,
  onSelect,
  className,
}: {
  selectedAPI: string;
  onSelect: (apiId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={`w-full justify-start gap-3 touch-target-lg tap-fast ${className || ''}`}
        >
          <Menu className="h-5 w-5" />
          <span className="flex-1 text-left">
            {API_MODULES[selectedAPI]?.name || 'Select API'}
          </span>
          <Badge variant="secondary" className="text-xs">
            {Object.keys(API_MODULES).length} APIs
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Available APIs
          </SheetTitle>
          <SheetDescription>
            Select a Chrome AI API to explore. Tap to switch instantly.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <APISelectorContent
            selectedAPI={selectedAPI}
            onSelect={onSelect}
            onAfterSelect={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Desktop API Selector (Fixed Sidebar)
 */
function DesktopAPISelector({
  selectedAPI,
  onSelect,
}: {
  selectedAPI: string;
  onSelect: (apiId: string) => void;
}) {
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Available APIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <APISelectorContent selectedAPI={selectedAPI} onSelect={onSelect} />
      </CardContent>
    </Card>
  );
}

/**
 * API Module Content
 * Renders all available playground components and toggles visibility
 * This prevents unmounting/remounting on tab changes (no flickering!)
 */
function APIModuleContent({ apiId }: { apiId: string }) {
  const module = getAPIModule(apiId);

  // Handle invalid module
  if (!module) {
    return (
      <Alert className="border-destructive/20 bg-destructive/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          API module &quot;{apiId}&quot; not found. Please select a valid API
          from the sidebar.
        </AlertDescription>
      </Alert>
    );
  }

  // Handle unavailable module
  if (!module.available) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{module.name}</h3>
            <p className="text-muted-foreground mb-6">{module.description}</p>
            <Badge variant="outline" className="mb-4">
              Coming Soon
            </Badge>
            <p className="text-sm text-muted-foreground">
              This API module is currently under development. Stay tuned!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render ALL available playground components, hide inactive ones
  // This prevents unmounting and preserves all component state
  return (
    <>
      {Object.values(API_MODULES)
        .filter((m) => m.available)
        .map((m) => {
          const isActive = m.id === apiId;
          const PlaygroundComponent = m.PlaygroundComponent;

          return (
            <Card key={m.id} className={!isActive ? 'hidden' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-primary" />
                      {m.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {m.description}
                    </p>
                  </div>
                  <Badge variant="secondary">{m.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <PlaygroundComponent />
              </CardContent>
            </Card>
          );
        })}
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Unified Playground
 *
 * Main interface for exploring Chrome AI APIs
 *
 * @example
 * ```tsx
 * <UnifiedPlayground initialAPI="summarizer" />
 * ```
 */
export function UnifiedPlayground({
  initialAPI = 'summarizer',
}: UnifiedPlaygroundProps) {
  const [selectedAPI, setSelectedAPI] = useState(initialAPI);
  const isDesktop = useIsDesktop();

  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6">
      {/* Mobile: Drawer Button */}
      {!isDesktop && (
        <MobileAPISelector
          className="lg:hidden"
          selectedAPI={selectedAPI}
          onSelect={setSelectedAPI}
        />
      )}

      {/* Desktop: Fixed Sidebar */}
      {isDesktop && (
        <div className="lg:col-span-3">
          <DesktopAPISelector
            selectedAPI={selectedAPI}
            onSelect={setSelectedAPI}
          />
        </div>
      )}

      {/* Main Content Area - Full width on mobile, 9/12 on desktop */}
      <div className="lg:col-span-9">
        <APIModuleContent apiId={selectedAPI} />
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default UnifiedPlayground;
