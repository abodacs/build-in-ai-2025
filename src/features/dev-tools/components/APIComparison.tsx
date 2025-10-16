/**
 * API Comparison Component
 *
 * Side-by-side comparison of multiple APIs with the same input
 *
 * @module dev-tools/components/APIComparison
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  Download,
  Loader2,
  Trophy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import { useDebugStore } from '../stores/debugStore';
import type { ComparisonResult, ComparisonReport } from '../types';

// ============================================================================
// Constants
// ============================================================================

const AVAILABLE_APIS = [
  { id: 'summarizer', name: 'Summarizer', description: 'Text summarization' },
  { id: 'translator', name: 'Translator', description: 'Language translation' },
  { id: 'writer', name: 'Writer', description: 'Content generation' },
  { id: 'rewriter', name: 'Rewriter', description: 'Text rewriting' },
  { id: 'prompt', name: 'Prompt API', description: 'General prompting' },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Analyze output quality
 */
function analyzeOutput(output: string) {
  return {
    length: output.length,
    wordCount: output.split(/\s+/).filter((w) => w.length > 0).length,
    charCount: output.length,
  };
}

/**
 * Mock API call (replace with real API calls)
 */
async function callAPI(
  api: string,
  input: string,
): Promise<{
  output: string;
  duration: number;
  tokens?: { input: number; output: number; total: number };
}> {
  const start = Date.now();

  // Simulate API delay
  await new Promise((resolve) =>
    setTimeout(resolve, 500 + Math.random() * 1500),
  );

  const duration = Date.now() - start;

  // Mock responses (in real implementation, call actual APIs)
  const outputs: Record<string, string> = {
    summarizer: `Summary: ${input.substring(0, 100)}...`,
    translator: `Translated: ${input}`,
    writer: `Generated content based on: ${input}`,
    rewriter: `Rewritten: ${input}`,
    prompt: `Response to: ${input}`,
  };

  return {
    output: outputs[api] || `API ${api} response`,
    duration,
    tokens: {
      input: Math.floor(input.length / 4),
      output: Math.floor(outputs[api].length / 4),
      total: Math.floor((input.length + outputs[api].length) / 4),
    },
  };
}

/**
 * Export comparison report
 */
function exportReport(report: ComparisonReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-comparison-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Result Card Component
// ============================================================================

interface ResultCardProps {
  result: ComparisonResult;
  isFastest: boolean;
  isSlowest: boolean;
}

function ResultCard({ result, isFastest, isSlowest }: ResultCardProps) {
  return (
    <Card className={result.status === 'error' ? 'border-destructive' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{result.api}</CardTitle>
          <div className="flex items-center gap-2">
            {isFastest && (
              <Badge variant="default" className="gap-1">
                <Trophy className="h-3 w-3" />
                Fastest
              </Badge>
            )}
            {isSlowest && (
              <Badge variant="secondary" className="gap-1">
                Slowest
              </Badge>
            )}
            <Badge
              variant={result.status === 'success' ? 'default' : 'destructive'}
            >
              {result.responseTime.toFixed(0)}ms
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.status === 'success' ? (
          <>
            <div className="bg-muted rounded-md p-3 max-h-32 overflow-auto">
              <p className="text-sm whitespace-pre-wrap">{result.output}</p>
            </div>
            {result.quality && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Length:</span>
                  <span className="ml-1 font-medium">
                    {result.quality.length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Words:</span>
                  <span className="ml-1 font-medium">
                    {result.quality.wordCount}
                  </span>
                </div>
                {result.tokens && (
                  <div>
                    <span className="text-muted-foreground">Tokens:</span>
                    <span className="ml-1 font-medium">
                      {result.tokens.total}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-destructive/10 border border-destructive rounded-md p-3">
            <p className="text-sm text-destructive">{result.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function APIComparison() {
  const { addReport } = useDebugStore();

  const [input, setInput] = useState('');
  const [selectedAPIs, setSelectedAPIs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [lastReport, setLastReport] = useState<ComparisonReport | null>(null);

  // Toggle API selection
  const toggleAPI = (apiId: string) => {
    setSelectedAPIs((prev) =>
      prev.includes(apiId)
        ? prev.filter((id) => id !== apiId)
        : [...prev, apiId],
    );
  };

  // Run comparison
  const runComparison = async () => {
    if (!input.trim() || selectedAPIs.length === 0) {
      return;
    }

    setIsRunning(true);
    setResults([]);

    try {
      const comparisonResults: ComparisonResult[] = [];

      // Call all selected APIs in parallel
      const promises = selectedAPIs.map(async (apiId) => {
        try {
          const { output, duration, tokens } = await callAPI(apiId, input);
          const quality = analyzeOutput(output);

          return {
            api: AVAILABLE_APIS.find((a) => a.id === apiId)?.name || apiId,
            output,
            responseTime: duration,
            tokens,
            quality,
            status: 'success' as const,
          };
        } catch (error) {
          return {
            api: AVAILABLE_APIS.find((a) => a.id === apiId)?.name || apiId,
            output: '',
            responseTime: 0,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const results = await Promise.all(promises);
      comparisonResults.push(...results);

      // Sort by response time
      comparisonResults.sort((a, b) => a.responseTime - b.responseTime);

      setResults(comparisonResults);

      // Create report
      const successResults = comparisonResults.filter(
        (r) => r.status === 'success',
      );
      const fastestTokens = successResults.reduce((min, r) =>
        (r.tokens?.total || 0) < (min.tokens?.total || Infinity) ? r : min,
      );
      const mostTokens = successResults.reduce((max, r) =>
        (r.tokens?.total || 0) > (max.tokens?.total || 0) ? r : max,
      );

      const report: ComparisonReport = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        config: {
          apis: selectedAPIs,
          input,
        },
        results: comparisonResults,
        summary: {
          fastest: successResults[0]?.api || 'N/A',
          slowest: successResults[successResults.length - 1]?.api || 'N/A',
          leastTokens: fastestTokens.api,
          mostTokens: mostTokens.api,
        },
      };

      setLastReport(report);
      addReport(report);
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Find fastest and slowest
  const fastestAPI = results.find((r) => r.status === 'success')?.api;
  const slowestAPI = results
    .slice()
    .reverse()
    .find((r) => r.status === 'success')?.api;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Comparison</h2>
          <p className="text-muted-foreground">
            Compare multiple APIs side-by-side with the same input
          </p>
        </div>
        {lastReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport(lastReport)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Configuration */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Enter text to test across APIs</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your test input here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* API Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select APIs</CardTitle>
            <CardDescription>Choose 2 or more APIs to compare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {AVAILABLE_APIS.map((api) => (
              <div key={api.id} className="flex items-start space-x-2">
                <Checkbox
                  id={api.id}
                  checked={selectedAPIs.includes(api.id)}
                  onCheckedChange={() => toggleAPI(api.id)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={api.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {api.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {api.description}
                  </p>
                </div>
              </div>
            ))}
            <Button
              className="w-full mt-4"
              onClick={runComparison}
              disabled={isRunning || !input.trim() || selectedAPIs.length < 2}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Comparison...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Comparison
                </>
              )}
            </Button>
            {selectedAPIs.length < 2 && selectedAPIs.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Select at least 2 APIs to compare
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Results Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Results</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <ResultCard
                  key={result.api}
                  result={result}
                  isFastest={result.api === fastestAPI}
                  isSlowest={result.api === slowestAPI}
                />
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Detailed metrics comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>API</TableHead>
                    <TableHead className="text-right">Response Time</TableHead>
                    <TableHead className="text-right">Output Length</TableHead>
                    <TableHead className="text-right">Word Count</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.api}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {result.api}
                          {result.api === fastestAPI && (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                          {result.api === slowestAPI && (
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {result.responseTime.toFixed(0)}ms
                      </TableCell>
                      <TableCell className="text-right">
                        {result.quality?.length || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.quality?.wordCount || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.tokens?.total || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.status === 'success'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {result.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Results Placeholder */}
      {results.length === 0 && !isRunning && (
        <Card>
          <CardContent className="flex h-[300px] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>
                Configure input and select APIs, then click &quot;Run
                Comparison&quot;
              </p>
              <p className="text-sm mt-2">Results will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
