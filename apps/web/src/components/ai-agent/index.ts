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

// Hooks
export { useChat } from './use-chat';

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
