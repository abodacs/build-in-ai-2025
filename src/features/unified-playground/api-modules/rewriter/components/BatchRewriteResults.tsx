/**
 * BatchRewriteResults Component
 *
 * Displays results of batch rewriting operations.
 * Shows all items with their original and rewritten text, status, and metrics.
 *
 * @module rewriter/components/BatchRewriteResults
 */

import { useState, useMemo } from 'react';
import {
  FileOutput,
  Copy,
  Download,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type {
  BatchRewriteItem,
  BatchItemStatus,
  BatchExportOptions,
} from '../types/batch.types';

// ============================================================================
// Types
// ============================================================================

export interface BatchRewriteResultsProps {
  /** All batch items */
  items: BatchRewriteItem[];

  /** Export results callback */
  onExport?: (options: Partial<BatchExportOptions>) => void;

  /** Copy text callback */
  onCopyText?: (text: string) => void;

  /** Retry failed items callback */
  onRetryFailed?: () => void;

  /** Additional CSS classes */
  className?: string;
}

type FilterOption = 'all' | BatchItemStatus;
type SortOption = 'index' | 'status' | 'length';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status badge variant
 */
function getStatusVariant(
  status: BatchItemStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'processing':
      return 'secondary';
    case 'cancelled':
      return 'outline';
    case 'pending':
    default:
      return 'secondary';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: BatchItemStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-3 h-3" />;
    case 'failed':
      return <XCircle className="w-3 h-3" />;
    case 'processing':
      return (
        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
    default:
      return null;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Batch rewrite results component
 *
 * Displays all batch items with filtering and sorting.
 *
 * @example
 * ```tsx
 * <BatchRewriteResults
 *   items={batch.items}
 *   onExport={batch.actions.exportResults}
 *   onCopyText={handleCopy}
 * />
 * ```
 */
export function BatchRewriteResults({
  items,
  onExport,
  onCopyText,
  onRetryFailed,
  className,
}: BatchRewriteResultsProps) {
  // State
  const [filterStatus, setFilterStatus] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('index');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Calculate statistics
  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const failed = items.filter((i) => i.status === 'failed').length;
    const cancelled = items.filter((i) => i.status === 'cancelled').length;
    const pending = items.filter((i) => i.status === 'pending').length;

    return { total, completed, failed, cancelled, pending };
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter((item) => item.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'status':
          return a.status.localeCompare(b.status);
        case 'length':
          return b.originalText.length - a.originalText.length;
        case 'index':
        default:
          return 0; // Keep original order
      }
    });

    return result;
  }, [items, filterStatus, sortBy]);

  /**
   * Toggle item expansion
   */
  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  /**
   * Copy item text
   */
  const handleCopyItem = (text: string) => {
    if (onCopyText) {
      onCopyText(text);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  // Don't show if no items
  if (items.length === 0) {
    return null;
  }

  const hasFailedItems = stats.failed > 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileOutput className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              Batch Results
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {stats.completed} completed, {stats.failed} failed,{' '}
              {stats.pending} pending
            </CardDescription>
          </div>

          {/* Export Button */}
          {onExport && stats.completed > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport({ format: 'csv' })}
              className="h-8"
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>

        {/* Statistics Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary">{stats.total} total items</Badge>
          {stats.completed > 0 && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {stats.completed} completed
            </Badge>
          )}
          {stats.failed > 0 && (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              {stats.failed} failed
            </Badge>
          )}
          {stats.pending > 0 && (
            <Badge variant="outline">{stats.pending} pending</Badge>
          )}
        </div>

        {/* Failed Items Alert */}
        {hasFailedItems && onRetryFailed && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {stats.failed} {stats.failed === 1 ? 'item' : 'items'} failed to
                process
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryFailed}
                className="ml-2"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry Failed
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as FilterOption)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="index">Original Order</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="length">By Length</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground ml-auto">
            {filteredItems.length}{' '}
            {filteredItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Items List */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredItems.map((item, index) => {
            const isExpanded = expandedItems.has(item.id);
            const hasResult = item.status === 'completed' && item.rewrittenText;

            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-md border bg-muted/30 transition-all',
                  item.status === 'failed' && 'border-destructive/50',
                  item.status === 'completed' && 'border-green-500/30',
                )}
              >
                {/* Item Header */}
                <div
                  className="flex items-start gap-2 p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <span className="text-xs text-muted-foreground mt-0.5 min-w-[2rem]">
                    #{index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={getStatusVariant(item.status)}
                        className="text-xs"
                      >
                        {getStatusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status}</span>
                      </Badge>

                      <span className="text-xs text-muted-foreground">
                        {item.originalText.length} chars
                      </span>
                    </div>

                    <p className="text-sm truncate">{item.originalText}</p>
                  </div>

                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t">
                    {/* Original Text */}
                    <div className="space-y-1 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Original Text
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyItem(item.originalText);
                          }}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-sm p-2 rounded bg-muted/50 font-mono whitespace-pre-wrap">
                        {item.originalText}
                      </div>
                    </div>

                    {/* Rewritten Text */}
                    {hasResult && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Rewritten Text
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyItem(item.rewrittenText!);
                            }}
                            className="h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-sm p-2 rounded bg-green-50 dark:bg-green-950/20 font-mono whitespace-pre-wrap border border-green-200 dark:border-green-900">
                          {item.rewrittenText}
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {item.status === 'failed' && item.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Error:</strong> {item.error.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Metrics */}
                    {item.metrics && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t">
                        <div className="space-y-0.5">
                          <div className="text-muted-foreground">Duration</div>
                          <div className="font-mono font-semibold">
                            {item.metrics.duration}ms
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-muted-foreground">Words</div>
                          <div className="font-mono font-semibold">
                            {item.metrics.words || 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-muted-foreground">Speed</div>
                          <div className="font-mono font-semibold">
                            {item.metrics.tokensPerSecond?.toFixed(1) || 'N/A'}{' '}
                            t/s
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-muted-foreground">
                            Characters
                          </div>
                          <div className="font-mono font-semibold">
                            {item.rewrittenText?.length || 0}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No items match the current filter</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default BatchRewriteResults;
