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
  Settings,
  AlertTriangle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

// Import API modules registry
import { API_MODULES, getAPIModule } from './api-modules';

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
 * API Selector Sidebar
 */
function APISelector({
  selectedAPI,
  onSelect,
}: {
  selectedAPI: string;
  onSelect: (apiId: string) => void;
}) {

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="text-lg">Available APIs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.values(API_MODULES).map((module) => (
          <Button
            key={module.id}
            variant={selectedAPI === module.id ? 'default' : 'ghost'}
            className="w-full justify-start h-auto p-3 text-left"
            onClick={() => onSelect(module.id)}
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
      </CardContent>
    </Card>
  );
}

/**
 * API Module Content
 */
function APIModuleContent({ apiId }: { apiId: string }) {
  const module = getAPIModule(apiId);

  if (!module) {
    return (
      <Alert className="border-destructive/20 bg-destructive/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          API module &quot;{apiId}&quot; not found. Please select a valid API from the
          sidebar.
        </AlertDescription>
      </Alert>
    );
  }

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

  const PlaygroundComponent = module.PlaygroundComponent;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              {module.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {module.description}
            </p>
          </div>
          <Badge variant="secondary">{module.category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <PlaygroundComponent />
      </CardContent>
    </Card>
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

  return (
    <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6">
      {/* API Selector Sidebar */}
      <div className="lg:col-span-3">
        <APISelector selectedAPI={selectedAPI} onSelect={setSelectedAPI} />
      </div>

      {/* Main Content Area */}
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
