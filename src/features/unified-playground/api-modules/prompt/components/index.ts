/**
 * Prompt API Components Barrel Export
 */

export { PromptConfig } from './PromptConfig';
export { PromptInput } from './PromptInput';
export { FileUploadZone } from './FileUploadZone';
export { ChatInterface } from './ChatInterface';
export { MessageBubble } from './MessageBubble';
export { ConversationHistory } from './ConversationHistory';
export { ImagePreview } from './ImagePreview';
// Re-export shared StreamingIndicator for backwards compatibility
export { StreamingIndicator } from '../../shared/components/StreamingIndicator';
export { PlaygroundTab } from './tabs/PlaygroundTab';

export { default as PromptConfigDefault } from './PromptConfig';
export { default as PromptInputDefault } from './PromptInput';
export { default as FileUploadZoneDefault } from './FileUploadZone';
export { default as ChatInterfaceDefault } from './ChatInterface';
export { default as MessageBubbleDefault } from './MessageBubble';
export { default as ConversationHistoryDefault } from './ConversationHistory';
export { default as ImagePreviewDefault } from './ImagePreview';
export { default as StreamingIndicatorDefault } from '../../shared/components/StreamingIndicator';
export { default as PlaygroundTabDefault } from './tabs/PlaygroundTab';
