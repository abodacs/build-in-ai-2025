/**
 * Shared Hooks - Export Module
 *
 * Central export point for all shared React hooks.
 *
 * @module shared/hooks
 */

// Model download hook
export { useModelDownload } from './useModelDownload';
export type {
  DownloadState,
  DownloadActions,
  UseModelDownloadReturn,
} from './useModelDownload';

// Streaming output hook
export { useStreamingOutput } from './useStreamingOutput';
export type {
  StreamingActions,
  UseStreamingOutputReturn,
} from './useStreamingOutput';
