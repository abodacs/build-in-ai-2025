/**
 * usePrompt Hook
 *
 * Main hook for executing prompts with the Chrome AI LanguageModel API.
 * Supports streaming, multimodal input, and conversation management.
 *
 * @module prompt/hooks/usePrompt
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PromptManager } from '../services/PromptManager';
import { SessionManager } from '../services/SessionManager';
import { MultimodalHandler } from '../services/MultimodalHandler';
import type {
  PromptConfig,
  Message,
  StreamingState,
  PromptMetrics,
  ImageData,
  DownloadProgress,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface UsePromptOptions {
  /** Initial configuration */
  config: PromptConfig;

  /** Enable auto-save to localStorage */
  autoSave?: boolean;

  /** Enable conversation history */
  enableHistory?: boolean;

  /** Maximum history length */
  maxHistoryLength?: number;
}

interface UsePromptReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  currentResponse: string;
  streamingState: StreamingState;
  downloadProgress: DownloadProgress | null;

  // Actions
  initialize: () => Promise<void>;
  prompt: (text: string, images?: ImageData[]) => Promise<string>;
  promptStreaming: (text: string, images?: ImageData[]) => Promise<string>;
  cancel: () => void;
  reset: () => void;
  updateConfig: (config: Partial<PromptConfig>) => Promise<void>;

  // Conversation
  messages: Message[];
  addMessage: (role: Message['role'], content: string) => void;
  clearMessages: () => void;

  // Metrics
  metrics: PromptMetrics[];
  averageExecutionTime: number;
  successRate: number;

  // Token Management
  estimatedTokens: number;
  contextWindowUsage: number; // percentage
}

// ============================================================================
// Hook
// ============================================================================

/**
 * usePrompt - Main hook for Chrome AI Prompt API
 *
 * Manages LanguageModel instance, executes prompts, handles streaming,
 * and maintains conversation history.
 */
export function usePrompt(options: UsePromptOptions): UsePromptReturn {
  const { config, autoSave = true, enableHistory = true } = options;

  // Managers
  const promptManagerRef = useRef<PromptManager | null>(null);
  const sessionManagerRef = useRef<SessionManager | null>(null);
  const multimodalHandlerRef = useRef<MultimodalHandler | null>(null);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);

  // Streaming state
  const [streamingState, setStreamingState] = useState<StreamingState>({
    status: 'idle',
    content: '',
    chunksReceived: 0,
    startTime: null,
    endTime: null,
    timeToFirstChunk: null,
    error: null,
  });

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);

  // Metrics
  const [metrics, setMetrics] = useState<PromptMetrics[]>([]);
  const [averageExecutionTime, setAverageExecutionTime] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  // Token tracking
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [contextWindowUsage, setContextWindowUsage] = useState(0);

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize the LanguageModel instance
   */
  const initialize = useCallback(async () => {
    console.log('usePrompt: initialize() called');
    try {
      setIsLoading(true);
      setError(null);

      // Create managers
      if (!promptManagerRef.current) {
        console.log('usePrompt: Creating new PromptManager');
        promptManagerRef.current = new PromptManager();
      } else {
        console.log('usePrompt: Reusing existing PromptManager');
      }

      // Create SessionManager if needed
      if (!sessionManagerRef.current && enableHistory) {
        console.log('usePrompt: Creating new SessionManager');
        sessionManagerRef.current = new SessionManager(autoSave);
      }

      // Ensure active conversation exists (even if SessionManager already existed)
      if (sessionManagerRef.current && enableHistory) {
        const existingConversation =
          sessionManagerRef.current.getActiveConversation();
        if (!existingConversation) {
          console.log(
            'usePrompt: No active conversation found, creating new one',
          );
          sessionManagerRef.current.createConversation(
            config,
            'New Conversation',
          );
        } else {
          console.log(
            'usePrompt: Using existing conversation:',
            existingConversation.id,
          );
        }

        // Load messages
        const loadedMessages = sessionManagerRef.current.getMessages();
        setMessages(loadedMessages);
      }

      if (!multimodalHandlerRef.current) {
        multimodalHandlerRef.current = new MultimodalHandler();
      }

      // Initialize LanguageModel
      console.log('usePrompt: About to call PromptManager.initialize()');
      await promptManagerRef.current.initialize(config, (progress) => {
        setDownloadProgress(progress);
      });
      console.log(
        'usePrompt: PromptManager.initialize() completed successfully',
      );
      console.log(
        'usePrompt: Manager state:',
        promptManagerRef.current?.getState(),
      );
      console.log(
        'usePrompt: Manager isInitialized:',
        promptManagerRef.current?.isInitialized(),
      );

      setDownloadProgress(null);
      console.log('usePrompt: About to set isInitialized to true');
      setIsInitialized(true);
      console.log('usePrompt: isInitialized state has been set to true');
    } catch (err) {
      console.error('usePrompt: Initialization FAILED with error:', err);
      console.error('usePrompt: Error details:', {
        message: err instanceof Error ? err.message : 'Unknown',
        name: err instanceof Error ? err.name : 'Unknown',
        stack: err instanceof Error ? err.stack : 'No stack',
      });
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize';
      setError(errorMessage);
      setIsInitialized(false);
      console.log('usePrompt: isInitialized set to false due to error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config, autoSave, enableHistory]);

  // ============================================================================
  // Prompt Execution
  // ============================================================================

  /**
   * Execute a prompt (non-streaming)
   */
  const prompt = useCallback(
    async (text: string, images?: ImageData[]): Promise<string> => {
      if (!promptManagerRef.current?.isReady()) {
        throw new Error('Not initialized. Call initialize() first.');
      }

      try {
        setIsLoading(true);
        setError(null);
        setCurrentResponse('');

        const startTime = Date.now();

        // Add user message
        if (sessionManagerRef.current) {
          // Ensure active conversation exists before adding message
          const activeConversation =
            sessionManagerRef.current.getActiveConversation();
          if (!activeConversation) {
            console.warn(
              'usePrompt: No active conversation during prompt, creating one',
            );
            sessionManagerRef.current.createConversation(
              config,
              'New Conversation',
            );
          }

          const attachments = images?.map((img) => ({
            id: img.id,
            type: 'image' as const,
            name: img.metadata.fileName,
            size: img.size,
            mimeType: img.mimeType,
            url: img.dataUrl,
            previewUrl: img.thumbnailUrl || img.dataUrl,
            dimensions: img.dimensions,
          }));

          sessionManagerRef.current.addUserMessage(text, attachments);
          setMessages(sessionManagerRef.current.getMessages());
        }

        // Execute prompt - use multimodal if images provided
        let response: string;
        if (images && images.length > 0) {
          console.log(
            'usePrompt: Sending multimodal prompt with',
            images.length,
            'images',
          );
          response = await promptManagerRef.current.promptMultimodal(
            text,
            images,
            [],
          );
        } else {
          response = await promptManagerRef.current.prompt(text);
        }

        // Add assistant message
        if (sessionManagerRef.current) {
          const processingTime = Date.now() - startTime;
          sessionManagerRef.current.addAssistantMessage(response, {
            processingTime,
            streamed: false,
          });
          setMessages(sessionManagerRef.current.getMessages());
        }

        setCurrentResponse(response);

        // Update metrics
        updateMetrics();

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Prompt failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  );

  /**
   * Execute a prompt with streaming
   */
  const promptStreaming = useCallback(
    async (text: string, images?: ImageData[]): Promise<string> => {
      if (!promptManagerRef.current?.isReady()) {
        throw new Error('Not initialized. Call initialize() first.');
      }

      try {
        setIsLoading(true);
        setIsStreaming(true);
        setError(null);
        setCurrentResponse('');

        // Initialize streaming state
        const startTime = new Date();
        setStreamingState({
          status: 'streaming',
          content: '',
          chunksReceived: 0,
          startTime,
          endTime: null,
          timeToFirstChunk: null,
          error: null,
        });

        // Track accumulated content at hook level
        let accumulatedContent = '';
        let firstChunkTime: number | null = null;
        let chunksReceived = 0;

        // Add user message
        if (sessionManagerRef.current) {
          // Ensure active conversation exists before adding message
          const activeConversation =
            sessionManagerRef.current.getActiveConversation();
          if (!activeConversation) {
            console.warn(
              'usePrompt: No active conversation during streaming, creating one',
            );
            sessionManagerRef.current.createConversation(
              config,
              'New Conversation',
            );
          }

          const attachments = images?.map((img) => ({
            id: img.id,
            type: 'image' as const,
            name: img.metadata.fileName,
            size: img.size,
            mimeType: img.mimeType,
            url: img.dataUrl,
            previewUrl: img.thumbnailUrl || img.dataUrl,
            dimensions: img.dimensions,
          }));

          sessionManagerRef.current.addUserMessage(text, attachments);
          setMessages(sessionManagerRef.current.getMessages());
        }

        // Execute streaming prompt - use multimodal if images provided
        let response: string;
        const onChunk = (chunk: string) => {
          // Track first chunk time
          if (firstChunkTime === null) {
            firstChunkTime = Date.now() - startTime.getTime();
          }

          chunksReceived++;
          accumulatedContent += chunk;

          // Update UI state
          setCurrentResponse(accumulatedContent);
          setStreamingState((prev) => ({
            ...prev,
            content: accumulatedContent,
            chunksReceived,
            timeToFirstChunk: firstChunkTime,
          }));
        };

        if (images && images.length > 0) {
          console.log(
            'usePrompt: Sending multimodal streaming prompt with',
            images.length,
            'images',
          );
          response = await promptManagerRef.current.promptMultimodalStreaming(
            text,
            onChunk,
            images,
            [],
          );
        } else {
          response = await promptManagerRef.current.promptStreaming(
            text,
            onChunk,
          );
        }

        // Complete streaming
        const endTime = new Date();
        setStreamingState({
          status: 'complete',
          content: response,
          chunksReceived,
          startTime,
          endTime,
          timeToFirstChunk: firstChunkTime,
          error: null,
        });

        // Add assistant message
        if (sessionManagerRef.current) {
          const processingTime = endTime.getTime() - startTime.getTime();
          sessionManagerRef.current.addAssistantMessage(response, {
            processingTime,
            streamed: true,
          });
          setMessages(sessionManagerRef.current.getMessages());
        }

        setCurrentResponse(response);

        // Update metrics
        updateMetrics();

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Streaming failed';
        setError(errorMessage);
        setStreamingState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
          endTime: new Date(),
        }));
        throw err;
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  );

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    if (promptManagerRef.current) {
      promptManagerRef.current.cancelOperation();
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Cancelled by user',
        endTime: new Date(),
      }));
    }
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setCurrentResponse('');
    setError(null);
    setStreamingState({
      status: 'idle',
      content: '',
      chunksReceived: 0,
      startTime: null,
      endTime: null,
      timeToFirstChunk: null,
      error: null,
    });
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback(async (newConfig: Partial<PromptConfig>) => {
    if (!promptManagerRef.current) {
      throw new Error('Not initialized');
    }

    try {
      setIsLoading(true);
      await promptManagerRef.current.updateConfig(newConfig);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Config update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // Message Management
  // ============================================================================

  /**
   * Add a message to history
   */
  const addMessage = useCallback((role: Message['role'], content: string) => {
    if (sessionManagerRef.current) {
      sessionManagerRef.current.addMessage(role, content);
      setMessages(sessionManagerRef.current.getMessages());
    }
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    if (sessionManagerRef.current) {
      sessionManagerRef.current.clearMessages();
      setMessages([]);
    }
    reset();
  }, [reset]);

  // ============================================================================
  // Metrics
  // ============================================================================

  /**
   * Update metrics from manager
   */
  const updateMetrics = useCallback(() => {
    if (promptManagerRef.current) {
      const managerMetrics = promptManagerRef.current.getMetrics();
      setMetrics(managerMetrics);
      setAverageExecutionTime(
        promptManagerRef.current.getAverageExecutionTime(),
      );
      setSuccessRate(promptManagerRef.current.getSuccessRate());
    }
  }, []);

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * Update token estimates
   */
  const updateTokenEstimates = useCallback(() => {
    // This would use actual token counting if available
    // For now, we'll estimate based on message length
    const totalChars = messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0,
    );
    const estimated = Math.ceil(totalChars / 4);
    setEstimatedTokens(estimated);

    const maxTokens = config.maxTokens || 4096;
    const usage = (estimated / maxTokens) * 100;
    setContextWindowUsage(Math.min(usage, 100));
  }, [messages, config.maxTokens]);

  // Update token estimates when messages change
  useEffect(() => {
    updateTokenEstimates();
  }, [messages, updateTokenEstimates]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (promptManagerRef.current) {
        promptManagerRef.current.destroy();
        setIsInitialized(false);
      }
    };
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    isInitialized,
    isLoading,
    isStreaming,
    error,
    currentResponse,
    streamingState,
    downloadProgress,

    // Actions
    initialize,
    prompt,
    promptStreaming,
    cancel,
    reset,
    updateConfig,

    // Conversation
    messages,
    addMessage,
    clearMessages,

    // Metrics
    metrics,
    averageExecutionTime,
    successRate,

    // Token Management
    estimatedTokens,
    contextWindowUsage,
  };
}

export default usePrompt;
