/**
 * usePrompt Hook - REFACTORED
 *
 * Main hook for executing prompts with the Chrome AI LanguageModel API.
 * Supports streaming, multimodal input, and conversation management.
 *
 * REFACTORED to follow React best practices:
 * - No automatic initialization in useEffect
 * - Initialization happens in event handlers (user actions)
 * - No chains of Effects
 * - Minimal use of refs (only for manager instances)
 * - Removed console.log statements (use React DevTools instead)
 *
 * @module prompt/hooks/usePrompt
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { PromptManager } from '../services/PromptManager';
import { SessionManager } from '../services/SessionManager';
import { MultimodalHandler } from '../services/MultimodalHandler';
import { ChromeAIPromptService } from '../services/ChromeAIPromptService';
import type {
  PromptConfig,
  Message,
  StreamingState,
  PromptMetrics,
  ImageData,
  DownloadProgress,
} from '../types';
import { DEFAULT_PROMPT_CONFIG } from '../types';

// ============================================================================
// Types
// ============================================================================

interface UsePromptOptions {
  /** Initial configuration */
  config?: PromptConfig;

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

  // User Activation
  userActivationRequired: boolean;
  userActivationMessage: string;
  checkUserActivation: () => void;

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
  contextWindowUsage: number;
  inputQuota: number;
  realTimeInputUsage: number | null;
  quotaExceeded: boolean;
  measureInputUsage: (input: string | Message[]) => Promise<number | null>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * usePrompt - Main hook for Chrome AI Prompt API
 *
 * REFACTORED: Initialization must be called explicitly by user action.
 * No automatic initialization on mount.
 */
export function usePrompt(options: UsePromptOptions = {}): UsePromptReturn {
  const {
    config = DEFAULT_PROMPT_CONFIG,
    autoSave = true,
    enableHistory = true,
  } = options;

  // Managers (stable refs - never recreated)
  const promptManagerRef = useRef<PromptManager | null>(null);
  const sessionManagerRef = useRef<SessionManager | null>(null);
  const multimodalHandlerRef = useRef<MultimodalHandler | null>(null);

  // Track quota overflow callback for cleanup
  const quotaCallbackRef = useRef<((event: Event) => void) | null>(null);

  // Guard against concurrent initialization
  const isInitializingRef = useRef(false);

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

  // Real-time token tracking
  const [realTimeInputUsage, setRealTimeInputUsage] = useState<number | null>(
    null,
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // User activation state
  const [userActivationRequired, setUserActivationRequired] = useState(false);
  const [userActivationMessage, setUserActivationMessage] = useState('');

  // ============================================================================
  // User Activation Check
  // ============================================================================

  /**
   * Check user activation status and update state
   * This should be called before attempting API operations
   */
  const checkUserActivation = useCallback(() => {
    const { active, message, actionRequired } =
      ChromeAIPromptService.checkUserActivation();
    setUserActivationRequired(actionRequired);
    setUserActivationMessage(message);
    return active;
  }, []);

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize the LanguageModel instance
   *
   * REFACTORED: This should be called from event handlers (button clicks),
   * not automatically in useEffect.
   */
  const initialize = useCallback(async () => {
    // Prevent concurrent initialization
    if (isInitializingRef.current) {
      console.warn('[usePrompt] Initialization already in progress, skipping');
      return;
    }

    // Check user activation before attempting initialization
    const isActivationActive = checkUserActivation();
    if (!isActivationActive) {
      setError(
        'User interaction required. Please click a button to activate the Prompt API.',
      );
      return;
    }

    try {
      isInitializingRef.current = true;
      setIsLoading(true);
      setError(null);
      setUserActivationRequired(false); // Clear activation warning

      // Create managers if they don't exist
      if (!promptManagerRef.current) {
        promptManagerRef.current = new PromptManager();
      }

      if (!sessionManagerRef.current && enableHistory) {
        sessionManagerRef.current = new SessionManager(autoSave);
      }

      // Ensure active conversation exists
      if (sessionManagerRef.current && enableHistory) {
        const existingConversation =
          sessionManagerRef.current.getActiveConversation();
        if (!existingConversation) {
          sessionManagerRef.current.createConversation(
            config,
            'New Conversation',
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
      await promptManagerRef.current.initialize(config, (progress) => {
        setDownloadProgress(progress);
      });

      // Register quota overflow listener (only once)
      if (!quotaCallbackRef.current) {
        const handleQuotaOverflow = () => {
          setQuotaExceeded(true);
          setError(
            'Context window quota exceeded. Please start a new conversation.',
          );
        };
        quotaCallbackRef.current = handleQuotaOverflow;
        promptManagerRef.current.onQuotaOverflow(handleQuotaOverflow);
      }

      // Get initial input usage if available
      const initialUsage = promptManagerRef.current.getInputUsage();
      if (initialUsage !== null) {
        setRealTimeInputUsage(initialUsage);
      }

      setDownloadProgress(null);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize';
      setError(errorMessage);
      setIsInitialized(false);
      throw err;
    } finally {
      isInitializingRef.current = false;
      setIsLoading(false);
    }
  }, [config, autoSave, enableHistory]);

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
          const activeConversation =
            sessionManagerRef.current.getActiveConversation();
          if (!activeConversation) {
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
          // Validate images before sending
          const invalidImages = images.filter(
            (img: any) => !img.file || !img.dataUrl || !img.mimeType,
          );
          if (invalidImages.length > 0) {
            throw new Error(
              `Invalid images detected: ${invalidImages.length} image(s) are missing required data`,
            );
          }

          response = await promptManagerRef.current.promptMultimodal(
            text,
            images as any,
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

        // Update real-time input usage after prompt execution
        if (promptManagerRef.current) {
          const updatedUsage = promptManagerRef.current.getInputUsage();
          if (updatedUsage !== null) {
            setRealTimeInputUsage(updatedUsage);
          }
        }

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
    [config, updateMetrics],
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
          const activeConversation =
            sessionManagerRef.current.getActiveConversation();
          if (!activeConversation) {
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

          // Update UI state - batch both updates together
          setCurrentResponse(accumulatedContent);
          setStreamingState({
            status: 'streaming',
            content: accumulatedContent,
            chunksReceived,
            startTime,
            endTime: null,
            timeToFirstChunk: firstChunkTime,
            error: null,
          });
        };

        if (images && images.length > 0) {
          // Validate images before streaming
          const invalidImages = images.filter(
            (img: any) => !img.file || !img.dataUrl || !img.mimeType,
          );
          if (invalidImages.length > 0) {
            throw new Error(
              `Invalid images detected: ${invalidImages.length} image(s) are missing required data`,
            );
          }

          response = await promptManagerRef.current.promptMultimodalStreaming(
            text,
            onChunk,
            images as any,
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

        // Update real-time input usage after streaming execution
        if (promptManagerRef.current) {
          const updatedUsage = promptManagerRef.current.getInputUsage();
          if (updatedUsage !== null) {
            setRealTimeInputUsage(updatedUsage);
          }
        }

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
    [config, updateMetrics],
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
  // Token Management
  // ============================================================================

  /**
   * Calculate estimated tokens based on message content
   * Uses real-time API measurement when available, falls back to estimation
   */
  const estimatedTokens = useMemo(() => {
    // Prefer real-time measurement from Chrome AI API
    if (realTimeInputUsage !== null) {
      return realTimeInputUsage;
    }

    // Fall back to estimation based on message length
    const totalChars = messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0,
    );
    return Math.ceil(totalChars / 4);
  }, [messages, realTimeInputUsage]);

  /**
   * Get input quota (context window) from PromptManager
   */
  const inputQuota = useMemo(() => {
    if (promptManagerRef.current) {
      return promptManagerRef.current.getInputQuota();
    }
    return 6144; // Default for Gemini Nano
  }, []);

  /**
   * Calculate context window usage percentage
   */
  const contextWindowUsage = useMemo(() => {
    const usage = (estimatedTokens / inputQuota) * 100;
    return Math.min(usage, 100);
  }, [estimatedTokens, inputQuota]);

  /**
   * Measure input usage using Chrome AI API
   */
  const measureInputUsage = useCallback(
    async (input: string | Message[]): Promise<number | null> => {
      if (!promptManagerRef.current) {
        return null;
      }

      try {
        const convertedInput =
          typeof input === 'string'
            ? input
            : input.map((msg) => ({
                role: msg.role,
                content: msg.content,
              }));

        const measured =
          await promptManagerRef.current.measureInputUsage(convertedInput);

        // Update real-time usage state
        if (measured !== null) {
          setRealTimeInputUsage(measured);
        }

        return measured;
      } catch {
        return null;
      }
    },
    [],
  );

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (promptManagerRef.current) {
        // Clean up quota overflow listener before destroying
        if (quotaCallbackRef.current) {
          promptManagerRef.current.offQuotaOverflow(quotaCallbackRef.current);
          quotaCallbackRef.current = null;
        }

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

    // User Activation
    userActivationRequired,
    userActivationMessage,
    checkUserActivation,

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
    inputQuota,
    realTimeInputUsage,
    quotaExceeded,
    measureInputUsage,
  };
}

export default usePrompt;
