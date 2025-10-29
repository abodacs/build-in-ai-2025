/**
 * ErrorBoundary Component
 * Catches React errors and displays a fallback UI with error details
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Bug } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Update state with error details
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const { fallbackTitle = 'Something went wrong' } = this.props;

      return (
        <div className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">
              {fallbackTitle}
            </AlertTitle>
            <AlertDescription>
              An error occurred in the Prompt Playground. This has been logged
              to the console. Try resetting the component or reloading the page.
            </AlertDescription>
          </Alert>

          {error && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-base">Error Details</CardTitle>
                </div>
                <CardDescription>
                  {errorCount > 1
                    ? `This error has occurred ${errorCount} times`
                    : 'Error information for debugging'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Error Message */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-600">
                    Error Message:
                  </h4>
                  <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md border border-red-200 dark:border-red-800">
                    <code className="text-sm text-red-800 dark:text-red-200">
                      {error.message}
                    </code>
                  </div>
                </div>

                {/* Error Stack */}
                {error.stack && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-red-600">
                      Stack Trace:
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md border max-h-40 overflow-auto">
                      <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Component Stack */}
                {errorInfo?.componentStack && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-red-600">
                      Component Stack:
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md border max-h-40 overflow-auto">
                      <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={this.handleReset}
                    variant="default"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Component
                  </Button>
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                </div>

                {/* Troubleshooting Tips */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-2">
                    Troubleshooting Tips:
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground list-disc ml-4">
                    <li>Check the browser console (F12) for more details</li>
                    <li>Ensure Chrome flags are properly enabled</li>
                    <li>
                      Verify Chrome version is 138+ (Dev/Canary) with{' '}
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                        chrome://version
                      </code>
                    </li>
                    <li>Try clearing browser cache and reloading</li>
                    <li>
                      Check if the model is downloaded at chrome://components
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
