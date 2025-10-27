/**
 * PlaygroundTab Component Tests
 * Main playground integration tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/tests/test-utils/TestProviders';
import { PlaygroundTab } from '../tabs/PlaygroundTab';

// Mock hooks
vi.mock('../../hooks/usePrompt', () => ({
  usePrompt: () => ({
    isInitialized: true,
    isLoading: false,
    isStreaming: false,
    messages: [],
    currentResponse: '',
    error: null,
    estimatedTokens: 0,
    contextWindowUsage: 0,
    initialize: vi.fn(),
    prompt: vi.fn(),
    promptStreaming: vi.fn(),
    clearMessages: vi.fn(),
    updateConfig: vi.fn(),
  }),
}));

vi.mock('../../hooks/usePromptAvailability', () => ({
  usePromptAvailability: () => ({
    isSupported: true,
    isReady: true,
    requiresDownload: false,
  }),
}));

vi.mock('../../hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    files: [],
    fileCount: 0,
    isDragOver: false,
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    clearFiles: vi.fn(),
    handleDragEnter: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
  }),
}));

// Create default mock return value that ensures all properties are immediately available
const defaultContextWindow = {
  maxTokens: 4096,
  tokensUsed: 0,
  tokensRemaining: 4096,
  percentageUsed: 0,
  nearLimit: false,
  warningMessage: null,
};

vi.mock('../../hooks/useConversationHistory', () => ({
  useConversationHistory: () => ({
    messages: [],
    messageCount: 0,
    contextWindow: defaultContextWindow,
    currentConversation: null,
    allConversations: [],
    isLoading: false,
    error: null,
    isNearContextLimit: false,
    createConversation: vi.fn(),
    addMessage: vi.fn(),
    deleteMessage: vi.fn(),
    clearMessages: vi.fn(),
    exportConversation: vi.fn(),
    switchConversation: vi.fn(),
    deleteConversation: vi.fn(),
    clearCurrentConversation: vi.fn(),
    updateConversationTitle: vi.fn(),
    updateMessage: vi.fn(),
    getLastMessages: vi.fn(() => []),
    getMessagesByRole: vi.fn(() => []),
    importConversation: vi.fn(),
  }),
}));

describe('PlaygroundTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render playground interface', () => {
    render(<PlaygroundTab />);
    // Check for main container
    expect(document.querySelector('.playground-tab')).toBeInTheDocument();
    // Check for configuration section
    expect(screen.getByText('Show Configuration')).toBeInTheDocument();
  });

  it('should render configuration toggle button', () => {
    render(<PlaygroundTab />);
    expect(
      screen.getByRole('button', { name: /show configuration/i }),
    ).toBeInTheDocument();
  });

  it('should render advanced options', () => {
    render(<PlaygroundTab />);
    expect(screen.getByText('Advanced Options')).toBeInTheDocument();
  });

  it('should render send message button', () => {
    render(<PlaygroundTab />);
    expect(
      screen.getByRole('button', { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it('should render prompt input', () => {
    render(<PlaygroundTab />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render chat interface', () => {
    render(<PlaygroundTab />);
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });
});
