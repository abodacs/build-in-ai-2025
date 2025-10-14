/**
 * PlaygroundTab Component
 * Main Prompt API playground interface
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Download } from 'lucide-react';
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
import { CodeModal } from '../CodeModal';
import { DEFAULT_PROMPT_CONFIG } from '../../types';
import { estimateTokens } from '../../utils/tokenCounter';
import { validateTextInput } from '../../../shared/utils/validation';

export const PlaygroundTab: React.FC = () => {
  const [config, setConfig] = useState(DEFAULT_PROMPT_CONFIG);
  const [showHistory, setShowHistory] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
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

  // Initialize on mount
  useEffect(() => {
    if (availability.isReady && !prompt.isInitialized) {
      prompt.initialize().catch(console.error);
    }
  }, [availability.isReady, prompt.isInitialized]);

  // Handle config change
  const handleConfigChange = (newConfig: Partial<typeof config>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    if (prompt.isInitialized) {
      prompt.updateConfig(updated).catch(console.error);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!inputValue.trim() || !prompt.isInitialized) return;

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
      if (config.enableStreaming) {
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
  };

  // Render availability check
  if (!availability.isSupported) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 p-8 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-amber-500" />
          <h2 className="text-2xl font-bold">API Not Supported</h2>
          <p className="text-gray-600">
            The Chrome AI Prompt API is not supported in your browser.
          </p>
          <p className="text-sm text-gray-500">
            Requires Chrome 138+ (Dev/Canary) with the Prompt API flag enabled.
          </p>
        </div>
      </div>
    );
  }

  if (availability.requiresDownload) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 p-8 max-w-md">
          <Download className="w-16 h-16 mx-auto text-blue-500" />
          <h2 className="text-2xl font-bold">Model Download Required</h2>
          <p className="text-gray-600">
            The AI model needs to be downloaded before use (~22GB).
          </p>
          <button
            onClick={() => prompt.initialize()}
            disabled={prompt.isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {prompt.isLoading ? 'Downloading...' : 'Start Download'}
          </button>
          {prompt.downloadProgress && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${prompt.downloadProgress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {prompt.downloadProgress.percentage.toFixed(0)}% complete
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="playground-tab space-y-6">
      {/* Configuration */}
      <PromptConfig
        config={config}
        onChange={handleConfigChange}
        defaultCollapsed={true}
        onViewCode={() => setIsCodeModalOpen(true)}
        disabled={prompt.isLoading}
      />

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

          {/* Streaming Indicator */}
          {prompt.isStreaming && (
            <div className="absolute bottom-4 left-4 right-4">
              <StreamingIndicator
                isStreaming={prompt.isStreaming}
                content={prompt.currentResponse}
                showContent={false}
                variant="typing"
                showElapsedTime
              />
            </div>
          )}
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
      </div>

      {/* Conversation History Sidebar */}
      {showHistory && (
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
          isOpen={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
        />
      )}

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
