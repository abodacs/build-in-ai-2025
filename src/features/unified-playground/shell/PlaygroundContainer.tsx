/**
 * Playground Container - Main Layout Component
 * Enterprise-grade component with proper architecture patterns, security, and performance
 */

import { useEffect, Suspense } from 'react';
import { ErrorBoundary } from '@/components/common/error-boundary/ErrorBoundary';
import { LoadingSpinner } from '../shared/components/LoadingScreen';
import { Header } from '@/components/layout/header/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  RefreshCw,
  Zap,
  Sparkles,
  Shield,
  Activity,
} from 'lucide-react';
import { usePlaygroundState } from '../shared/hooks/usePlaygroundState';
import { usePerformanceMetrics } from '../shared/hooks/usePerformanceMetrics';
import { cn } from '@/lib/utils';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface PlaygroundContainerProps {
  children?: React.ReactNode;
  className?: string;
  showPerformanceMetrics?: boolean;
  enableKeyboardShortcuts?: boolean;
}

// ============================================================================
// Error Handling Components
// ============================================================================

function PlaygroundErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center border-destructive/20 bg-background">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2 text-foreground">
          Playground Error
        </h2>

        <p className="text-sm text-muted-foreground mb-4">
          An unexpected error occurred in the unified playground. This error has
          been logged for investigation.
        </p>

        {error && (
          <details className="mb-4 text-left">
            <summary className="text-sm font-medium cursor-pointer hover:text-foreground transition-colors">
              Error Details
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded text-muted-foreground overflow-auto">
              {error.message}
            </pre>
          </details>
        )}

        <Button
          onClick={resetError}
          className="transition-all duration-200 hover:scale-105"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </Card>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

// Performance-aware loading fallback
function PlaygroundSuspenseFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center animate-fadeInUp">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-sm text-muted-foreground">
          Initializing secure playground...
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Playground Container Component
// ============================================================================

export function PlaygroundContainer({
  children,
  className,
  showPerformanceMetrics = true,
}: PlaygroundContainerProps) {
  // State management with custom hooks
  const { hasAvailableApis, availableApiCount } = usePlaygroundState();

  const { performanceScore, measureComponentRender, optimizationSuggestions } =
    usePerformanceMetrics();

  // ============================================================================
  // Performance Tracking (using useEffect to avoid infinite loops)
  // ============================================================================

  useEffect(() => {
    const stopMeasure = measureComponentRender('PlaygroundContainer');
    return () => {
      stopMeasure();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only measure on mount/unmount

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <ErrorBoundary fallback={PlaygroundErrorFallback}>
      <div
        className={cn(
          'min-h-screen bg-background transition-colors duration-200',
          className,
        )}
      >
        {/* Unified Header Component */}
        <Header />

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
          {/* Performance Insights */}
          {showPerformanceMetrics && optimizationSuggestions.length > 0 && (
            <div className="mb-6 animate-fadeInDown">
              <Card className="border-yellow-500/20 bg-yellow-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-700 mb-2">
                      Performance Optimization
                    </h3>
                    <ul className="space-y-1 text-sm text-yellow-700/80">
                      {optimizationSuggestions
                        .slice(0, 3)
                        .map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <Suspense fallback={<PlaygroundSuspenseFallback />}>
            <div className="animate-fadeInUp">
              {children || (
                <div className="text-center py-16">
                  <div className="max-w-2xl mx-auto">
                    <div className="w-20 h-20 mx-auto mb-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-600 to-green-500 flex items-center justify-center animate-aiPulse">
                      <Zap className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                      Welcome to Chrome AI DevBench
                    </h2>

                    <p className="text-lg text-muted-foreground mb-4">
                      Enterprise-grade playground for Chrome&apos;s built-in AI
                      APIs. Secure, performant, and production-ready.
                    </p>

                    {/* Status Summary */}
                    <div className="mb-8 flex items-center justify-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span>Secure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span>Performance: {performanceScore}/100</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span>{availableApiCount}/7 APIs Ready</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <Card className="p-4 hover-lift transition-all duration-200 cursor-pointer border-green-200 dark:border-green-800">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          Security First
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Input validation, XSS protection, and enterprise
                          security standards.
                        </p>
                      </Card>

                      <Card className="p-4 hover-lift transition-all duration-200 cursor-pointer border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          Performance Optimized
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Real-time metrics, Core Web Vitals tracking, and
                          optimization hints.
                        </p>
                      </Card>

                      <Card className="p-4 hover-lift transition-all duration-200 cursor-pointer border-purple-200 dark:border-purple-800">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-600" />
                          Production Ready
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          TypeScript, error boundaries, and enterprise-grade
                          architecture.
                        </p>
                      </Card>
                    </div>

                    <Button
                      size="lg"
                      className="transition-all duration-200 hover:scale-105 hover-glow"
                      disabled={!hasAvailableApis}
                    >
                      {hasAvailableApis
                        ? 'Start Exploring APIs'
                        : 'APIs Unavailable'}
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>

                    {!hasAvailableApis && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Requires Chrome 138+ with experimental AI flags enabled.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-muted/20 mt-20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <p className="text-sm text-muted-foreground">
                  Built with enterprise security & performance standards
                </p>
                {showPerformanceMetrics && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Activity className="w-3 h-3" />
                    <span>Performance: {performanceScore}/100</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  Security Guide
                </Button>
                <Button variant="ghost" size="sm">
                  API Documentation
                </Button>
                <Button variant="ghost" size="sm">
                  Performance Tips
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

// ============================================================================
// Compound Component Pattern Export
// ============================================================================

export const Playground = {
  Container: PlaygroundContainer,
  ErrorFallback: PlaygroundErrorFallback,
  SuspenseFallback: PlaygroundSuspenseFallback,
} as const;
