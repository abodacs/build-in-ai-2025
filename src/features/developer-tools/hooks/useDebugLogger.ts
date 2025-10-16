/**
 * useDebugLogger Hook
 * Manages debug logs with filtering and export capabilities
 */

import { useState, useCallback } from 'react';
import type { DebugLogEntry, DebugFilter } from '../types';

export function useDebugLogger() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [filter, setFilter] = useState<DebugFilter>({});

  const addLog = useCallback((entry: Omit<DebugLogEntry, 'id'>) => {
    const newEntry: DebugLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setLogs((prev) => [newEntry, ...prev].slice(0, 500)); // Keep last 500
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const getFilteredLogs = useCallback(() => {
    return logs.filter((log) => {
      if (filter.level && !filter.level.includes(log.level)) return false;
      if (filter.apiName && !filter.apiName.includes(log.apiName)) return false;
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        if (
          !log.message.toLowerCase().includes(searchLower) &&
          !log.operation.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      if (filter.timeRange) {
        if (
          log.timestamp < filter.timeRange.start ||
          log.timestamp > filter.timeRange.end
        ) {
          return false;
        }
      }
      return true;
    });
  }, [logs, filter]);

  return {
    logs: getFilteredLogs(),
    allLogs: logs,
    addLog,
    clearLogs,
    filter,
    setFilter,
  };
}
