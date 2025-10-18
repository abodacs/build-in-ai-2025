/**
 * Shared Components - Export Module
 *
 * Central export point for all shared components
 *
 * @module shared/components
 */

// Existing exports
export { LoadingScreen, LoadingSpinner } from './LoadingScreen';
export { ErrorDisplay } from './ErrorDisplay';
export { ThemeToggle } from './ThemeToggle';
export { SecureInput } from './SecureInput';
export { AccessibleWrapper } from './AccessibleWrapper';

// Responsive components
export { ResponsiveContainer } from './ResponsiveContainer';
export type { ResponsiveContainerProps } from './ResponsiveContainer';

// Validation & Feedback components
export { ValidationMessage } from './ValidationMessage';
export type { ValidationMessageProps } from './ValidationMessage';
export { SuccessFeedback } from './SuccessFeedback';
export type { SuccessFeedbackProps } from './SuccessFeedback';

// Interactive components
export { CopyButton } from './CopyButton';
export type { CopyButtonProps } from './CopyButton';

// Progress components
export { ProgressWithStages } from './ProgressWithStages';
export type {
  ProgressWithStagesProps,
  ProgressStage,
} from './ProgressWithStages';
