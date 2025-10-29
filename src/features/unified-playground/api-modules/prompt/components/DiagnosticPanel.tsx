/**
 * DiagnosticPanel Component
 * Displays real-time diagnostic information for Chrome AI Prompt API
 */

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Info,
  Download,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChromeAIPromptService } from '../services/ChromeAIPromptService';

interface DiagnosticInfo {
  apiSupported: boolean;
  availability: string | null;
  chromeVersion: number | null;
  userActivationActive: boolean | null;
  modelDownloadStatus: string | null;
  lastError: string | null;
}

export const DiagnosticPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo>({
    apiSupported: false,
    availability: null,
    chromeVersion: null,
    userActivationActive: null,
    modelDownloadStatus: null,
    lastError: null,
  });
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Run diagnostics on mount and periodically
  useEffect(() => {
    runDiagnostics();
    const interval = setInterval(runDiagnostics, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const runDiagnostics = async () => {
    try {
      // Check API support
      const apiSupported = ChromeAIPromptService.isSupported();

      // Check availability
      let availability: string | null = null;
      if (apiSupported) {
        try {
          availability = await ChromeAIPromptService.checkAvailability();
        } catch (error) {
          console.error('[DiagnosticPanel] Availability check failed:', error);
        }
      }

      // Extract Chrome version
      let chromeVersion: number | null = null;
      const userAgent = navigator.userAgent;
      const match = userAgent.match(/Chrome\/(\d+)/);
      if (match?.[1]) {
        chromeVersion = parseInt(match[1], 10);
      }

      // Check user activation
      let userActivationActive: boolean | null = null;
      if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
        const userActivation = (navigator as any).userActivation;
        userActivationActive = userActivation?.isActive ?? null;
      }

      // Determine model download status
      let modelDownloadStatus: string | null = null;
      if (availability === 'after-download') {
        modelDownloadStatus = 'required';
      } else if (availability === 'available') {
        modelDownloadStatus = 'ready';
      } else if (availability === 'no') {
        modelDownloadStatus = 'unavailable';
      }

      setDiagnostics({
        apiSupported,
        availability,
        chromeVersion,
        userActivationActive,
        modelDownloadStatus,
        lastError: null,
      });
    } catch (error: any) {
      setDiagnostics((prev) => ({
        ...prev,
        lastError: error?.message || 'Diagnostic check failed',
      }));
    }
  };

  const testAPI = async () => {
    setIsTestingAPI(true);
    setTestResult(null);

    try {
      console.log('[DiagnosticPanel] Testing API creation...');

      // Test instance creation
      const instance = await ChromeAIPromptService.createInstance({
        temperature: 0.7,
        topK: 8,
        maxTokens: 100,
        systemPrompt: 'You are a test assistant.',
      });

      console.log('[DiagnosticPanel] Instance created successfully:', instance);

      // Test a simple prompt
      const response = await ChromeAIPromptService.prompt(
        instance,
        'Say "Hello! API test successful." and nothing else.',
      );

      console.log('[DiagnosticPanel] Prompt response:', response);

      // Clean up
      ChromeAIPromptService.destroy(instance);

      setTestResult({
        success: true,
        message: `API test successful! Response: "${response.substring(0, 50)}${response.length > 50 ? '...' : ''}"`,
      });
    } catch (error: any) {
      console.error('[DiagnosticPanel] API test failed:', error);
      setTestResult({
        success: false,
        message: `API test failed: ${error?.message || 'Unknown error'}`,
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const getStatusBadge = (
    condition: boolean | null,
    trueLabel: string,
    falseLabel: string,
  ) => {
    if (condition === null) {
      return <Badge variant="outline">Unknown</Badge>;
    }
    return condition ? (
      <Badge className="bg-green-500 text-white">{trueLabel}</Badge>
    ) : (
      <Badge variant="destructive">{falseLabel}</Badge>
    );
  };

  const getStatusIcon = (condition: boolean | null) => {
    if (condition === null) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">API Diagnostics</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Show'}
          </Button>
        </div>
        <CardDescription>
          Real-time status of Chrome AI Prompt API
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* API Support */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(diagnostics.apiSupported)}
              <span className="text-sm font-medium">API Support</span>
            </div>
            {getStatusBadge(
              diagnostics.apiSupported,
              'Supported',
              'Not Supported',
            )}
          </div>

          {/* Chrome Version */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Chrome Version</span>
            </div>
            <Badge variant="outline">
              {diagnostics.chromeVersion
                ? `v${diagnostics.chromeVersion}`
                : 'Unknown'}
              {diagnostics.chromeVersion && diagnostics.chromeVersion < 138 && (
                <span className="ml-2 text-red-500">(Requires 138+)</span>
              )}
            </Badge>
          </div>

          {/* Availability Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(diagnostics.availability === 'available')}
              <span className="text-sm font-medium">Availability</span>
            </div>
            <Badge
              variant={
                diagnostics.availability === 'available'
                  ? 'default'
                  : diagnostics.availability === 'after-download'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {diagnostics.availability || 'Unknown'}
            </Badge>
          </div>

          {/* User Activation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(diagnostics.userActivationActive)}
              <span className="text-sm font-medium">User Activation</span>
            </div>
            {getStatusBadge(
              diagnostics.userActivationActive,
              'Active',
              'Inactive',
            )}
          </div>

          {/* Model Download Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Model Status</span>
            </div>
            <Badge
              variant={
                diagnostics.modelDownloadStatus === 'ready'
                  ? 'default'
                  : diagnostics.modelDownloadStatus === 'required'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {diagnostics.modelDownloadStatus || 'Unknown'}
            </Badge>
          </div>

          {/* Test API Button */}
          <div className="pt-2">
            <Button
              onClick={testAPI}
              disabled={isTestingAPI || !diagnostics.apiSupported}
              className="w-full"
              variant="outline"
            >
              {isTestingAPI ? 'Testing API...' : 'Test API'}
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {testResult.success ? 'Success' : 'Error'}
              </AlertTitle>
              <AlertDescription className="text-sm">
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {diagnostics.lastError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Diagnostic Error</AlertTitle>
              <AlertDescription className="text-sm">
                {diagnostics.lastError}
              </AlertDescription>
            </Alert>
          )}

          {/* Troubleshooting Tips */}
          {!diagnostics.apiSupported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription className="text-sm space-y-2">
                <p>The Prompt API is not available. Please:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Use Chrome 138+ (Dev/Canary)</li>
                  <li>
                    Enable flag:
                    chrome://flags#prompt-api-for-gemini-nano-multimodal-input
                  </li>
                  <li>Restart Chrome completely</li>
                  <li>Check chrome://components for model status</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
};
