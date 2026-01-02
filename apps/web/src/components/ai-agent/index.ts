/**
 * AI Agent Components
 *
 * Story 6-2: Chat Interface Foundation
 * Story 6-3: Confirmation Flow UI
 * Story 6-4: Service Generation Flow
 */

// Main components
export { ChatSidebar } from './ChatSidebar';
export { MessageList } from './MessageList';
export { MessageInput } from './MessageInput';
export { StreamingMessage } from './StreamingMessage';
export { ConfirmationDialog } from './ConfirmationDialog';

// Generation flow components
export { GenerationProgress } from './GenerationProgress';
export { GenerationPreview } from './GenerationPreview';
export { GenerationSummary } from './GenerationSummary';

// Hooks
export { useChat } from './use-chat';
export { useConfirmation, createPendingAction } from './use-confirmation';
export type { ConfirmationResult } from './use-confirmation';
export {
  useGenerationFlow,
  GenerationStep,
  STEP_CONFIG,
  ORDERED_STEPS,
} from './use-generation-flow';
export type {
  GenerationResults,
  GenerationFlowState,
  UseGenerationFlowOptions,
  UseGenerationFlowReturn,
} from './use-generation-flow';

// Types
export type {
  MessageRole,
  MessageStatus,
  ChatMessage,
  ChatSession,
  PendingAction,
  ChatSidebarProps,
  MessageListProps,
  MessageInputProps,
  StreamingMessageProps,
} from './types';
