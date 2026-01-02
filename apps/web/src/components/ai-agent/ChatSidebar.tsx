'use client';

import * as React from 'react';
import { X, Bot, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatSidebarProps, ChatSession } from './types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

/**
 * Chat Sidebar Component
 *
 * Story 6-2: Chat Interface Foundation
 *
 * Main chat interface for interacting with the AI agent.
 * Displays as a sidebar panel in the service builder.
 */
export function ChatSidebar({
  serviceId,
  userId,
  isOpen,
  onClose,
  className,
}: ChatSidebarProps) {
  const [session, setSession] = React.useState<ChatSession>({
    sessionId: `session-${Date.now()}`,
    serviceId,
    userId,
    messages: [],
    isStreaming: false,
    connectionState: 'disconnected',
  });

  // Initialize connection on mount
  React.useEffect(() => {
    if (!isOpen) return;

    // Simulate connection (replace with actual WebSocket in production)
    setSession((prev) => ({ ...prev, connectionState: 'connecting' }));
    const timer = setTimeout(() => {
      setSession((prev) => ({ ...prev, connectionState: 'connected' }));
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, serviceId]);

  const handleSendMessage = React.useCallback(
    async (content: string) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'complete',
      };

      setSession((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isStreaming: true,
      }));

      // Simulate AI response (replace with actual agent call)
      try {
        // Add streaming message placeholder
        const aiMessageId = `msg-${Date.now() + 1}`;
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          status: 'streaming',
        };

        setSession((prev) => ({
          ...prev,
          messages: [...prev.messages, aiMessage],
        }));

        // Simulate streaming response
        const response = `I understand you want to ${content.toLowerCase()}. Let me help you with that. I'm analyzing the current service configuration for service ${serviceId}...`;

        // Stream characters
        for (let i = 0; i <= response.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 20));
          setSession((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: response.slice(0, i) }
                : msg
            ),
          }));
        }

        // Complete message
        setSession((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: response, status: 'complete' }
              : msg
          ),
          isStreaming: false,
        }));
      } catch (error) {
        setSession((prev) => ({
          ...prev,
          isStreaming: false,
          messages: [
            ...prev.messages,
            {
              id: `msg-${Date.now() + 2}`,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              status: 'error',
              error: error instanceof Error ? error.message : 'An error occurred',
            },
          ],
        }));
      }
    },
    [serviceId]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-lg border-l',
        'flex flex-col z-50',
        'transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
        className
      )}
      role="complementary"
      aria-label="AI Agent Chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-slate-600" />
          <span className="font-medium text-sm">AI Assistant</span>
          <ConnectionIndicator state={session.connectionState} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <MessageList
        messages={session.messages}
        isStreaming={session.isStreaming}
        className="flex-1"
      />

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={session.isStreaming || session.connectionState !== 'connected'}
        placeholder={
          session.connectionState !== 'connected'
            ? 'Connecting...'
            : 'Ask the AI to configure your service...'
        }
      />
    </div>
  );
}

/**
 * Connection status indicator
 */
function ConnectionIndicator({
  state,
}: {
  state: ChatSession['connectionState'];
}) {
  const config = {
    connecting: {
      icon: Wifi,
      color: 'text-yellow-500',
      label: 'Connecting',
    },
    connected: {
      icon: Wifi,
      color: 'text-green-500',
      label: 'Connected',
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-slate-400',
      label: 'Disconnected',
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-500',
      label: 'Error',
    },
  };

  const { icon: Icon, color, label } = config[state];

  return (
    <span className={cn('flex items-center gap-1', color)} title={label}>
      <Icon className="h-3 w-3" />
      {state === 'connecting' && (
        <span className="text-xs animate-pulse">...</span>
      )}
    </span>
  );
}

export default ChatSidebar;
