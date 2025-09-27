import React from 'react';

interface DefaultErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

export function DefaultErrorFallback({
  error,
  resetError,
}: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="text-6xl mb-4">🚨</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred while running the Chrome AI DevBench.
        </p>

        {error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              Error details
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-40">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Reload page
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          If this problem persists, please check that you&apos;re using Chrome
          136.0.7103.0+ (Canary) with AI features enabled.
        </p>
      </div>
    </div>
  );
}
