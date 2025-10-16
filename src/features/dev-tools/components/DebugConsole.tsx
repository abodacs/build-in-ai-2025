/**
 * Debug Console Component
 *
 * Request/response inspector with search and filtering
 *
 * @module dev-tools/components/DebugConsole
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Copy,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

import { useDebugStore, getFilteredLogs } from '../stores/debugStore';
import type { DebugLogEntry } from '../types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format JSON with syntax highlighting
 */
function formatJSON(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Export logs to JSON
 */
function exportLogs(logs: DebugLogEntry[]) {
  const data = {
    exportedAt: new Date().toISOString(),
    count: logs.length,
    logs,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debug-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Log Entry Component
// ============================================================================

interface LogEntryProps {
  log: DebugLogEntry;
  isSelected: boolean;
  onClick: () => void;
}

function LogEntry({ log, isSelected, onClick }: LogEntryProps) {
  const time = new Date(log.timestamp).toLocaleTimeString();

  return (
    <button
      className={`w-full text-left p-3 border-b hover:bg-accent transition-colors ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {log.status === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
          <span className="font-medium truncate">{log.api}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            {log.method}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
            {log.duration.toFixed(0)}ms
          </Badge>
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Log Details Component
// ============================================================================

interface LogDetailsProps {
  log: DebugLogEntry;
}

function LogDetails({ log }: LogDetailsProps) {
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const handleCopyRequest = async () => {
    const success = await copyToClipboard(formatJSON(log.request));
    if (success) {
      setCopiedRequest(true);
      setTimeout(() => setCopiedRequest(false), 2000);
    }
  };

  const handleCopyResponse = async () => {
    const success = await copyToClipboard(formatJSON(log.response));
    if (success) {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold">{log.api}</h3>
          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
            {log.status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Method:</span>
            <span className="ml-2 font-medium">{log.method}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <span className="ml-2 font-medium">
              {log.duration.toFixed(2)}ms
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Timestamp:</span>
            <span className="ml-2 font-medium">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">ID:</span>
            <span className="ml-2 font-mono text-xs">{log.id}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Request */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Request</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyRequest}
            className="h-7"
          >
            <Copy className="h-3 w-3 mr-1" />
            {copiedRequest ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className="bg-muted rounded-md p-4 overflow-auto max-h-64">
          <pre className="text-xs font-mono">{formatJSON(log.request)}</pre>
        </div>
      </div>

      {/* Response */}
      {log.status === 'success' ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Response</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyResponse}
              className="h-7"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedResponse ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="bg-muted rounded-md p-4 overflow-auto max-h-64">
            <pre className="text-xs font-mono">{formatJSON(log.response)}</pre>
          </div>
        </div>
      ) : (
        <div>
          <h4 className="font-semibold mb-2 text-destructive">Error</h4>
          <div className="bg-destructive/10 border border-destructive rounded-md p-4">
            <p className="font-medium text-destructive mb-2">
              {log.error?.message}
            </p>
            {log.error?.stack && (
              <pre className="text-xs font-mono text-destructive/80 overflow-auto max-h-32">
                {log.error.stack}
              </pre>
            )}
            {log.error?.code && (
              <p className="text-sm text-destructive/80 mt-2">
                Error Code: {log.error.code}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Metadata</h4>
          <div className="bg-muted rounded-md p-4 overflow-auto max-h-32">
            <pre className="text-xs font-mono">{formatJSON(log.metadata)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DebugConsole() {
  const { logs, filters, setFilters, clearFilters, clearLogs } =
    useDebugStore();

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Get unique API names
  const apis = useMemo(() => {
    const unique = new Set(logs.map((log) => log.api));
    return Array.from(unique).sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return getFilteredLogs(logs, filters);
  }, [logs, filters]);

  // Get selected log
  const selectedLog = useMemo(() => {
    return filteredLogs.find((log) => log.id === selectedLogId) || null;
  }, [filteredLogs, selectedLogId]);

  // Auto-select first log when filters change
  React.useEffect(() => {
    if (filteredLogs.length > 0 && !selectedLog) {
      setSelectedLogId(filteredLogs[0].id);
    }
  }, [filteredLogs, selectedLog]);

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Debug Console</h2>
          <p className="text-muted-foreground">
            API call history and request/response inspector
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportLogs(filteredLogs)}
            disabled={filteredLogs.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            disabled={logs.length === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search logs..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="h-9"
              />
            </div>
            <Select
              value={filters.api || 'all'}
              onValueChange={(value) =>
                setFilters({ api: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filter by API" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All APIs</SelectItem>
                {apis.map((api) => (
                  <SelectItem key={api} value={api}>
                    {api}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters({
                  status:
                    value === 'all' ? 'all' : (value as 'success' | 'error'),
                })
              }
            >
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              Clear
            </Button>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Log List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Call History</CardTitle>
            <CardDescription>
              {filteredLogs.length} calls (newest first)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredLogs.length > 0 ? (
                filteredLogs
                  .slice()
                  .reverse()
                  .map((log) => (
                    <LogEntry
                      key={log.id}
                      log={log}
                      isSelected={selectedLogId === log.id}
                      onClick={() => setSelectedLogId(log.id)}
                    />
                  ))
              ) : (
                <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                  {logs.length === 0
                    ? 'No logs recorded yet'
                    : 'No logs match the filters'}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Log Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Details</CardTitle>
            <CardDescription>Request and response inspector</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {selectedLog ? (
                <LogDetails log={selectedLog} />
              ) : (
                <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                  Select a log entry to view details
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
