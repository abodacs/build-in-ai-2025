/**
 * PlaygroundTab Component
 * Main Prompt API playground interface
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Radio,
  ChevronDown,
  History,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePrompt } from '../../hooks/usePrompt';
import { usePromptAvailability } from '../../hooks/usePromptAvailability';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useConversationHistory } from '../../hooks/useConversationHistory';
import { PromptConfig } from '../PromptConfig';
import { PromptInput } from '../PromptInput';
import { FileUploadZone } from '../FileUploadZone';
import { ChatInterface } from '../ChatInterface';
import { ConversationHistory } from '../ConversationHistory';
import { ImagePreview } from '../ImagePreview';
import { StreamingIndicator } from '../StreamingIndicator';
import { ModelDownloadProgress } from '../ModelDownloadProgress';
import { ModelDownloadMonitor } from '../ModelDownloadMonitor';
import { CodeModal } from '../CodeModal';
import { DEFAULT_PROMPT_CONFIG } from '../../types';
import { estimateTokens } from '../../utils/tokenCounter';
import { validateTextInput } from '../../../shared/utils/validation';

export const PlaygroundTab: React.FC = () => {
  const [config, setConfig] = useState(DEFAULT_PROMPT_CONFIG);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [streamingMode, setStreamingMode] = useState(true);
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState(false);
  const [inputError, setInputError] = useState<{
    message: string;
    helpText?: string;
  } | null>(null);

  // Hooks
  const availability = usePromptAvailability();
  const fileUpload = useFileUpload({ maxFiles: 3 });
  const prompt = usePrompt({ config });
  const history = useConversationHistory({
    maxContextTokens: config.maxTokens,
  });

  // Track previous initialization state for auto-run after download
  const previousIsReady = useRef(prompt.isInitialized);

  /**
   * Validate input text
   */
  useEffect(() => {
    if (inputValue.length === 0) {
      setInputError(null); // No error for empty input
      return;
    }

    const validation = validateTextInput(inputValue, {
      minLength: 1,
      maxLength: 10000,
      required: false,
    });

    if (!validation.valid && validation.error) {
      setInputError({
        message: validation.error.message,
        helpText: validation.error.helpText,
      });
    } else {
      setInputError(null);
    }
  }, [inputValue]);

  // Keyboard shortcuts (Cmd/Ctrl+K for code modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K: Open code modal
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCodeModalOpen((prev) => !prev);
      }

      // Escape: Close code modal if open
      if (e.key === 'Escape' && isCodeModalOpen) {
        e.preventDefault();
        setIsCodeModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCodeModalOpen]);

  /**
   * Auto-run prompt after download completes
   */
  useEffect(() => {
    // Check if initialization just completed (was false, now true)
    if (
      !previousIsReady.current &&
      prompt.isInitialized &&
      pendingPrompt &&
      inputValue.trim()
    ) {
      console.log(
        '[PlaygroundTab] Download complete, auto-running pending prompt',
      );
      handleSubmit();
    }

    previousIsReady.current = prompt.isInitialized;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.isInitialized, pendingPrompt, inputValue]); // handleSubmit excluded - stable function with internal deps

  // Initialize on mount
  useEffect(() => {
    console.log('PlaygroundTab: Auto-init useEffect triggered');
    console.log('PlaygroundTab: availability.isReady =', availability.isReady);
    console.log('PlaygroundTab: prompt.isInitialized =', prompt.isInitialized);
    console.log(
      'PlaygroundTab: Should initialize?',
      availability.isReady && !prompt.isInitialized,
    );

    if (availability.isReady && !prompt.isInitialized) {
      console.log('PlaygroundTab: Calling prompt.initialize()...');
      prompt.initialize().catch((err) => {
        console.error('PlaygroundTab: Auto-init failed:', err);
      });
    } else {
      console.log('PlaygroundTab: Skipping initialization - condition not met');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability.isReady, prompt.isInitialized]);

  // Handle config change
  const handleConfigChange = (newConfig: Partial<typeof config>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    if (prompt.isInitialized) {
      prompt.updateConfig(updated).catch(console.error);
    }
  };

  // Handle submit with lazy download support
  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    try {
      // Check if model needs to be downloaded first
      if (availability.requiresDownload && !prompt.isLoading) {
        console.log(
          '[PlaygroundTab] Model download required, triggering download',
        );
        setPendingPrompt(true); // Mark that we want to prompt after download
        await prompt.initialize();
        return; // Exit - the useEffect will handle running prompt after download
      }

      // Ensure we have the model ready
      if (!prompt.isInitialized) {
        console.warn('[PlaygroundTab] Model not ready yet');
        return;
      }

      // Add user message to history
      const userMessage = history.addMessage(
        'user',
        inputValue,
        fileUpload.files.map((f) => ({
          id: f.id,
          type: 'image' as const,
          name: f.file.name,
          size: f.file.size,
          mimeType: f.file.type,
          url: f.dataUrl || '',
          previewUrl: f.dataUrl,
          dimensions: f.dimensions,
        })),
      );
      const userMessageId = userMessage.id;

      const currentInput = inputValue;
      setInputValue('');
      const currentFiles = fileUpload.files;
      fileUpload.clearFiles();

      try {
        let response = '';
        if (streamingMode) {
          response = await prompt.promptStreaming(currentInput, currentFiles);
        } else {
          response = await prompt.prompt(currentInput, currentFiles);
        }

        // Add assistant response to history
        if (response) {
          history.addMessage('assistant', response);
        }
      } catch (error) {
        console.error('Prompt failed:', error);
        // Remove user message if failed
        history.deleteMessage(userMessageId);
      }
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setPendingPrompt(false);
    }
  };

  // Render availability check
  if (!availability.isSupported) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Prompt API Not Available</AlertTitle>
          <AlertDescription>
            The Chrome AI Prompt API is not available in your browser.
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Quick Setup</AlertTitle>
          <AlertDescription className="space-y-3">
            <div className="space-y-2">
              <p className="font-medium text-sm">Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Chrome 138+ (Dev/Canary) or Edge Canary</li>
                <li>22+ GB free disk space</li>
                <li>4+ GB VRAM (for optimal performance)</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <p className="font-medium text-sm">Enable the API:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm">
                <li>
                  Open{' '}
                  <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                    chrome://flags
                  </code>
                </li>
                <li>
                  Search for{' '}
                  <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                    prompt-api-for-gemini-nano
                  </code>
                </li>
                <li>Enable the flag and restart Chrome</li>
                <li>Reload this page</li>
              </ol>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              💡 Tip: All processing happens locally on your device - no data is
              sent to servers.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  console.log('PlaygroundTab RENDER:');
  console.log('  - availability:', availability);
  console.log('  - prompt.isInitialized:', prompt.isInitialized);
  console.log('  - prompt.isLoading:', prompt.isLoading);

  return (
    <div className="playground-tab space-y-6">
      {/* Configuration */}
      <PromptConfig
        config={config}
        onChange={handleConfigChange}
        defaultCollapsed={true}
        onViewCode={() => setIsCodeModalOpen(true)}
        disabled={prompt.isLoading}
        onReset={() => {
          // Reset streaming mode to default when config is reset
          setStreamingMode(true);
        }}
      />

      {/* Advanced Options - Collapsible */}
      <Collapsible
        open={advancedOptionsOpen}
        onOpenChange={setAdvancedOptionsOpen}
        className="border border-slate-200 rounded-lg"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-slate-50">
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                advancedOptionsOpen && 'transform rotate-180',
              )}
            />
            <span className="font-medium">Advanced Options</span>
            <Badge variant="secondary" className="text-xs">
              2 features
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {advancedOptionsOpen ? 'Hide' : 'Show'}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent className="px-4 pb-4 space-y-4">
          {/* Multimodal Input */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Multimodal Input</h4>
            <p className="text-xs text-muted-foreground">
              Attach up to 3 images to your prompts for vision-enabled responses
            </p>
          </div>

          {/* Streaming Mode */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm font-medium">Streaming Mode</label>
            <div className="flex items-center gap-2">
              <Button
                variant={streamingMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStreamingMode(!streamingMode)}
                className="text-xs"
              >
                <Radio className="w-3 h-3 mr-1" />
                {streamingMode ? 'Streaming Enabled' : 'Standard Mode'}
              </Button>
              {streamingMode && (
                <span className="text-xs text-muted-foreground">
                  Real-time streaming enabled
                </span>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Model Download Progress (when downloading) */}
      {prompt.isLoading && prompt.downloadProgress && (
        <ModelDownloadProgress
          isDownloading={prompt.isLoading}
          progress={prompt.downloadProgress}
          error={prompt.error || undefined}
          onCancel={() => prompt.cancel()}
          onRetry={() => prompt.initialize()}
        />
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={history.messages}
            isStreaming={prompt.isStreaming}
            streamingContent={prompt.currentResponse}
            onCopyMessage={(content) => navigator.clipboard.writeText(content)}
            onStop={() => prompt.cancel()}
          />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 space-y-4">
          {/* File Upload */}
          {fileUpload.fileCount === 0 && (
            <details>
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Attach images (optional)
              </summary>
              <div className="mt-4">
                <FileUploadZone
                  files={fileUpload.files}
                  isDragOver={fileUpload.isDragOver}
                  onFilesAdded={(files) => fileUpload.addFiles(files)}
                  onFileRemoved={fileUpload.removeFile}
                  onDragEnter={fileUpload.handleDragEnter}
                  onDragOver={fileUpload.handleDragOver}
                  onDragLeave={fileUpload.handleDragLeave}
                  onDrop={fileUpload.handleDrop}
                  maxFiles={3}
                  disabled={prompt.isLoading}
                />
              </div>
            </details>
          )}

          {fileUpload.fileCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Attached Images ({fileUpload.fileCount})
                </span>
                <button
                  onClick={fileUpload.clearFiles}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove All
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {fileUpload.files.map((file) => (
                  <ImagePreview
                    key={file.id}
                    url={file.dataUrl || ''}
                    name={file.file.name}
                    size={file.file.size}
                    dimensions={file.dimensions}
                    onRemove={() => fileUpload.removeFile(file.id)}
                    showDetails
                    removable
                  />
                ))}
              </div>
              <FileUploadZone
                files={[]}
                isDragOver={fileUpload.isDragOver}
                onFilesAdded={(files) => fileUpload.addFiles(files)}
                onFileRemoved={fileUpload.removeFile}
                onDragEnter={fileUpload.handleDragEnter}
                onDragOver={fileUpload.handleDragOver}
                onDragLeave={fileUpload.handleDragLeave}
                onDrop={fileUpload.handleDrop}
                maxFiles={3}
                disabled={prompt.isLoading}
              />
            </div>
          )}

          {/* Prompt Input */}
          <PromptInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            disabled={prompt.isLoading || !prompt.isInitialized}
            estimatedTokens={estimateTokens(inputValue)}
            hasFiles={fileUpload.fileCount > 0}
            error={inputError?.message}
            errorHelpText={inputError?.helpText}
          />

          {/* Error Display */}
          {prompt.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {prompt.error}
            </div>
          )}
        </div>

        {/* Streaming Status Indicator */}
        {prompt.isStreaming && streamingMode && (
          <StreamingIndicator
            isStreaming={prompt.isStreaming}
            content={prompt.currentResponse}
            showContent={false}
            variant="card"
            label="Streaming Response"
            showElapsedTime
          />
        )}
      </div>

      {/* Floating History Button */}
      <button
        onClick={() => setIsHistoryOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40',
          'flex items-center gap-2 px-4 py-3',
          'bg-blue-600 text-white rounded-full shadow-lg',
          'hover:bg-blue-700 hover:shadow-xl',
          'transition-all duration-200 hover:scale-105',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        )}
        aria-label="Open conversation history"
      >
        <History className="w-5 h-5" />
        <span className="text-sm font-medium">
          History ({history.messages.length})
        </span>
        {history.contextWindow.tokensUsed > 0 && (
          <Badge
            variant="secondary"
            className="ml-1 bg-white/20 text-white border-0"
          >
            {Math.round(
              (history.contextWindow.tokensUsed /
                history.contextWindow.maxTokens) *
                100,
            )}
            %
          </Badge>
        )}
      </button>

      {/* Conversation History Drawer */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[480px] p-0 flex flex-col h-full"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <SheetTitle>Conversation History</SheetTitle>
            </div>
            <SheetDescription>
              View and manage your conversation history
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <ConversationHistory
              messages={history.messages}
              tokenCount={history.contextWindow.tokensUsed}
              maxTokens={history.contextWindow.maxTokens}
              onClear={() => history.clearMessages()}
              onExport={(format) => {
                const exported = history.exportConversation(format);
                const blob = new Blob([exported], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `conversation-${Date.now()}.${format}`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              onRemoveMessage={(id) => history.deleteMessage(id)}
              onMessageClick={(id) => {
                const message = history.messages.find((m) => m.id === id);
                if (message) {
                  console.log('Message clicked:', message);
                }
              }}
              isOpen={true}
              onToggle={() => setIsHistoryOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Model Management Section */}
      <div className="space-y-3 pt-6 border-t">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">
            Model Management
          </h3>
          <p className="text-sm text-slate-600">
            Monitor and manage AI model downloads and cache
          </p>
        </div>

        <ModelDownloadMonitor
          isDownloading={prompt.isLoading && !!prompt.downloadProgress}
          downloadProgress={prompt.downloadProgress}
          downloadError={prompt.error || undefined}
          availability={
            availability.isReady
              ? 'readily'
              : availability.requiresDownload
                ? 'after-download'
                : 'no'
          }
          isReady={prompt.isInitialized}
          onStartDownload={async () => {
            try {
              await prompt.initialize();
            } catch (error) {
              console.error('Manual download failed:', error);
            }
          }}
        />
      </div>

      {/* Code Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        config={config}
      />
    </div>
  );
};

export default PlaygroundTab;
