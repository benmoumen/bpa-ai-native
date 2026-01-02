'use client';

import * as React from 'react';
import type { ChatMessage, ChatSession } from './types';

/**
 * Chat state hook
 *
 * Story 6-2: Chat Interface Foundation
 *
 * Custom hook for managing chat state and interactions.
 * Provides methods for sending messages, managing streaming,
 * and handling connection state.
 */

interface UseChatOptions {
  /** Service ID for the current service */
  serviceId: string;
  /** User ID */
  userId: string;
  /** Callback when a message is sent */
  onMessageSent?: (message: ChatMessage) => void;
  /** Callback when a response is received */
  onResponseReceived?: (message: ChatMessage) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

interface UseChatReturn {
  /** Current session state */
  session: ChatSession;
  /** Send a message */
  sendMessage: (content: string) => Promise<void>;
  /** Clear chat history */
  clearHistory: () => void;
  /** Retry the last failed message */
  retry: () => Promise<void>;
  /** Connect to the chat service */
  connect: () => void;
  /** Disconnect from the chat service */
  disconnect: () => void;
}

export function useChat({
  serviceId,
  userId,
  onMessageSent,
  onResponseReceived,
  onError,
}: UseChatOptions): UseChatReturn {
  const [session, setSession] = React.useState<ChatSession>(() => ({
    sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    serviceId,
    userId,
    messages: [],
    isStreaming: false,
    connectionState: 'disconnected',
  }));

  const lastUserMessageRef = React.useRef<string | null>(null);

  /**
   * Generate unique message ID
   */
  const generateMessageId = React.useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }, []);

  /**
   * Add a message to the session
   */
  const addMessage = React.useCallback((message: ChatMessage) => {
    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  /**
   * Update a message in the session
   */
  const updateMessage = React.useCallback(
    (messageId: string, updates: Partial<ChatMessage>) => {
      setSession((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      }));
    },
    []
  );

  /**
   * Connect to the chat service
   */
  const connect = React.useCallback(() => {
    setSession((prev) => ({ ...prev, connectionState: 'connecting' }));

    // Simulate connection - replace with actual WebSocket connection
    setTimeout(() => {
      setSession((prev) => ({ ...prev, connectionState: 'connected' }));
    }, 500);
  }, []);

  /**
   * Disconnect from the chat service
   */
  const disconnect = React.useCallback(() => {
    setSession((prev) => ({ ...prev, connectionState: 'disconnected' }));
  }, []);

  /**
   * Send a message
   */
  const sendMessage = React.useCallback(
    async (content: string) => {
      if (session.connectionState !== 'connected') {
        const error = new Error('Not connected to chat service');
        onError?.(error);
        return;
      }

      if (session.isStreaming) {
        return; // Ignore if already streaming
      }

      lastUserMessageRef.current = content;

      // Create user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'complete',
      };

      addMessage(userMessage);
      onMessageSent?.(userMessage);

      // Start streaming
      setSession((prev) => ({ ...prev, isStreaming: true }));

      // Create placeholder for AI response
      const aiMessageId = generateMessageId();
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'streaming',
      };

      addMessage(aiMessage);

      try {
        // Simulate AI response - replace with actual agent call
        const response = generateMockResponse(content, serviceId);

        // Simulate streaming
        for (let i = 0; i <= response.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 15));
          updateMessage(aiMessageId, { content: response.slice(0, i) });
        }

        // Complete message
        const completedMessage: ChatMessage = {
          ...aiMessage,
          content: response,
          status: 'complete',
        };
        updateMessage(aiMessageId, {
          content: response,
          status: 'complete',
        });
        onResponseReceived?.(completedMessage);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        updateMessage(aiMessageId, {
          status: 'error',
          error: err.message,
        });
        onError?.(err);
      } finally {
        setSession((prev) => ({ ...prev, isStreaming: false }));
      }
    },
    [
      session.connectionState,
      session.isStreaming,
      serviceId,
      generateMessageId,
      addMessage,
      updateMessage,
      onMessageSent,
      onResponseReceived,
      onError,
    ]
  );

  /**
   * Clear chat history
   */
  const clearHistory = React.useCallback(() => {
    setSession((prev) => ({
      ...prev,
      messages: [],
    }));
  }, []);

  /**
   * Retry the last failed message
   */
  const retry = React.useCallback(async () => {
    if (lastUserMessageRef.current) {
      // Remove the last failed message
      setSession((prev) => ({
        ...prev,
        messages: prev.messages.slice(0, -1),
      }));
      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  // Auto-connect on mount
  React.useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update session when serviceId changes
  React.useEffect(() => {
    setSession((prev) => ({
      ...prev,
      serviceId,
      messages: [], // Clear messages on service change
    }));
  }, [serviceId]);

  return {
    session,
    sendMessage,
    clearHistory,
    retry,
    connect,
    disconnect,
  };
}

/**
 * Generate a mock response for testing
 * Replace with actual agent integration
 */
function generateMockResponse(userMessage: string, serviceId: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('form')) {
    return `I can help you create a form for this service. For service ${serviceId}, I'll analyze the requirements and suggest appropriate form fields. Would you like me to:

1. Create a new applicant form
2. Add fields to an existing form
3. Configure field validations

Just let me know which option you'd prefer!`;
  }

  if (lowerMessage.includes('workflow')) {
    return `I'll help you configure the workflow for service ${serviceId}. Currently, I can:

- Define workflow steps
- Set up transitions between steps
- Configure role assignments
- Add approval chains

What aspect of the workflow would you like to work on?`;
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
    return `I'm your AI assistant for configuring BPA services. I can help you with:

**Forms**
- Create and configure forms
- Add and organize form fields
- Set up validation rules

**Workflow**
- Design approval workflows
- Configure step transitions
- Assign roles to steps

**Documents & Requirements**
- Define required documents
- Set up cost calculations
- Configure determinants

Just describe what you'd like to do and I'll guide you through it!`;
  }

  return `I understand you're asking about "${userMessage}". I'm analyzing the current configuration for service ${serviceId} to provide the best assistance.

Is there a specific aspect of the service configuration you'd like help with? I can assist with forms, workflows, registrations, and more.`;
}

export default useChat;
