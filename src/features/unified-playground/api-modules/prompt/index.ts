/**
 * Prompt API Module Barrel Export
 *
 * Central export point for the Prompt API module
 */

// Types (type-only exports to avoid conflicts)
export type * from './types';

// Services
export * from './services';

// Hooks
export * from './hooks';

// Components (renamed to avoid conflict with PromptConfig type)
export {
  PromptConfig as PromptConfigComponent,
  PromptInput,
  FileUploadZone,
  ChatInterface,
  MessageBubble,
  PlaygroundTab,
  PromptConfigDefault,
  PromptInputDefault,
  FileUploadZoneDefault,
  ChatInterfaceDefault,
  MessageBubbleDefault,
  PlaygroundTabDefault,
} from './components';

// Utils
export * from './utils';
