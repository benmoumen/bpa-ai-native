/**
 * AI Agent Chat Types
 *
 * Story 6-2: Chat Interface Foundation
 */

/**
 * Message role in the conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message status for streaming
 */
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

/**
 * Chat message structure
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Message role */
  role: MessageRole;
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: Date;
  /** Message status */
  status: MessageStatus;
  /** Error message if status is error */
  error?: string;
  /** Optional metadata (e.g., tool calls, generation progress) */
  metadata?: Record<string, unknown>;
}

/**
 * Chat session state
 */
export interface ChatSession {
  /** Session ID */
  sessionId: string;
  /** Service ID being configured */
  serviceId: string;
  /** User ID */
  userId: string;
  /** Messages in the session */
  messages: ChatMessage[];
  /** Whether the agent is currently responding */
  isStreaming: boolean;
  /** Connection status */
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
}

/**
 * Action requiring confirmation
 */
export interface PendingAction {
  /** Action ID */
  id: string;
  /** Tool name */
  toolName: string;
  /** Action description */
  description: string;
  /** Parameters */
  params: Record<string, unknown>;
  /** Constraint that triggered confirmation */
  constraintId?: string;
  /** Risk level */
  riskLevel: 'info' | 'warning' | 'danger';
}

/**
 * Chat sidebar props
 */
export interface ChatSidebarProps {
  /** Service ID for the current service being configured */
  serviceId: string;
  /** User ID */
  userId: string;
  /** Whether the sidebar is open */
  isOpen: boolean;
  /** Callback when sidebar is closed */
  onClose?: () => void;
  /** CSS class name */
  className?: string;
}

/**
 * Message list props
 */
export interface MessageListProps {
  /** Messages to display */
  messages: ChatMessage[];
  /** Whether the agent is streaming */
  isStreaming?: boolean;
  /** CSS class name */
  className?: string;
}

/**
 * Message input props
 */
export interface MessageInputProps {
  /** Callback when message is sent */
  onSend: (message: string) => void;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** CSS class name */
  className?: string;
}

/**
 * Streaming message props
 */
export interface StreamingMessageProps {
  /** Current content being streamed */
  content: string;
  /** Whether still streaming */
  isStreaming: boolean;
  /** CSS class name */
  className?: string;
}
