/**
 * Performance Monitor Component
 *
 * Real-time API performance tracking with charts and metrics
 *
 * @module dev-tools/components/PerformanceMonitor
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';

import { useDebugStore } from '../stores/debugStore';
import type { PerformanceMetric, PerformanceStats } from '../types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate statistics from performance metrics
 */
function calculateStats(metrics: PerformanceMetric[]): PerformanceStats[] {
  const byAPI = new Map<string, PerformanceMetric[]>();

  // Group metrics by API
  metrics.forEach((metric) => {
    const existing = byAPI.get(metric.api) || [];
    byAPI.set(metric.api, [...existing, metric]);
  });

  // Calculate stats for each API
  return Array.from(byAPI.entries()).map(([api, apiMetrics]) => {
    const durations = apiMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const successCount = apiMetrics.filter(
      (m) => m.status === 'success',
    ).length;
    const tokens = apiMetrics
      .filter((m) => m.tokens)
      .map((m) => m.tokens!.total);

    return {
      api,
      callCount: apiMetrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
      successRate: successCount / apiMetrics.length,
      totalTokens: tokens.reduce((a, b) => a + b, 0),
      avgTokens:
        tokens.length > 0
          ? tokens.reduce((a, b) => a + b, 0) / tokens.length
          : 0,
    };
  });
}

/**
 * Get memory usage if available
 */
function getMemoryUsage() {
  if ('memory' in performance && performance.memory) {
    const memory = performance.memory as {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }

  return null;
}

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration to human-readable
 */
function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Export metrics to JSON
 */
function exportToJSON(metrics: PerformanceMetric[], stats: PerformanceStats[]) {
  const data = {
    exportedAt: new Date().toISOString(),
    metrics,
    stats,
    summary: {
      totalCalls: metrics.length,
      avgDuration: metrics.reduce((a, b) => a + b.duration, 0) / metrics.length,
      successRate:
        metrics.filter((m) => m.status === 'success').length / metrics.length,
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-metrics-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export metrics to CSV
 */
function exportToCSV(metrics: PerformanceMetric[]) {
  const headers = [
    'Timestamp',
    'API',
    'Method',
    'Duration (ms)',
    'Request Size',
    'Response Size',
    'Status',
  ];

  const rows = metrics.map((m) => [
    new Date(m.startTime).toISOString(),
    m.api,
    m.method,
    m.duration.toFixed(2),
    m.requestSize,
    m.responseSize,
    m.status,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-metrics-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Component
// ============================================================================

export function PerformanceMonitor() {
  const { metrics, clearMetrics } = useDebugStore();

  // Calculate statistics
  const stats = useMemo(() => calculateStats(metrics), [metrics]);

  // Prepare chart data (last 20 calls)
  const chartData = useMemo(() => {
    return metrics.slice(-20).map((m, i) => ({
      index: i + 1,
      duration: m.duration,
      api: m.api,
      timestamp: new Date(m.startTime).toLocaleTimeString(),
    }));
  }, [metrics]);

  // Memory usage
  const memory = getMemoryUsage();

  // Chart configuration
  const chartConfig = {
    duration: {
      label: 'Duration (ms)',
      color: 'hsl(var(--chart-1))',
    },
  };

  const barChartConfig = {
    avgDuration: {
      label: 'Avg Duration (ms)',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Performance Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time API performance tracking and metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToJSON(metrics, stats)}
            disabled={metrics.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(metrics)}
            disabled={metrics.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearMetrics}
            disabled={metrics.length === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total API Calls
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.length} APIs tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            {metrics.length > 1 &&
            metrics[metrics.length - 1].duration <
              metrics[metrics.length - 2].duration ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.length > 0
                ? formatDuration(
                    metrics.reduce((a, b) => a + b.duration, 0) /
                      metrics.length,
                  )
                : '0ms'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all API calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.length > 0
                ? `${((metrics.filter((m) => m.status === 'success').length / metrics.length) * 100).toFixed(1)}%`
                : '0%'}
            </div>
            <Progress
              value={
                metrics.length > 0
                  ? (metrics.filter((m) => m.status === 'success').length /
                      metrics.length) *
                    100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memory ? formatBytes(memory.used) : 'N/A'}
            </div>
            {memory && (
              <>
                <Progress value={memory.percentage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {memory.percentage.toFixed(1)}% of {formatBytes(memory.limit)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="by-api">By API</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Timeline Chart */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Time Timeline</CardTitle>
              <CardDescription>
                Last 20 API calls (most recent on right)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="index"
                      label={{
                        value: 'Call #',
                        position: 'insideBottom',
                        offset: -5,
                      }}
                    />
                    <YAxis
                      label={{
                        value: 'Duration (ms)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="var(--color-duration)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No metrics recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By API Chart */}
        <TabsContent value="by-api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by API</CardTitle>
              <CardDescription>
                Average response time comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.length > 0 ? (
                <ChartContainer config={barChartConfig} className="h-[300px]">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="api" />
                    <YAxis
                      label={{
                        value: 'Avg Duration (ms)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="avgDuration"
                      fill="var(--color-avgDuration)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No metrics recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Table */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Statistics</CardTitle>
              <CardDescription>
                Detailed performance metrics per API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>API</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Avg</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                      <TableHead className="text-right">P95</TableHead>
                      <TableHead className="text-right">Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((stat) => (
                      <TableRow key={stat.api}>
                        <TableCell className="font-medium">
                          {stat.api}
                        </TableCell>
                        <TableCell className="text-right">
                          {stat.callCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(stat.avgDuration)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(stat.minDuration)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(stat.maxDuration)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(stat.p95Duration)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              stat.successRate >= 0.95
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {(stat.successRate * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No metrics recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
