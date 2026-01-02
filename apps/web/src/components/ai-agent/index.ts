/**
 * AI Agent Components
 *
 * Story 6-2: Chat Interface Foundation
 * Story 6-3: Confirmation Flow UI
 */

// Main components
export { ChatSidebar } from './ChatSidebar';
export { MessageList } from './MessageList';
export { MessageInput } from './MessageInput';
export { StreamingMessage } from './StreamingMessage';
export { ConfirmationDialog } from './ConfirmationDialog';

// Hooks
export { useChat } from './use-chat';
export { useConfirmation, createPendingAction } from './use-confirmation';
export type { ConfirmationResult } from './use-confirmation';

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
