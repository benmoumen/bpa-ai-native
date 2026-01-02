'use client';

import * as React from 'react';
import type { ChatMessage, ChatSession } from './types';

/**
 * Chat state hook
 *
 * Story 6-2: Chat Interface Foundation
 * Story 6-4: Service Generation Flow (Task 2 - Real Agent Integration)
 *
 * Custom hook for managing chat state and interactions.
 * Connects to the real BPAAgent via /api/agent/chat endpoint.
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
  /** Cancel current streaming request */
  cancel: () => void;
}

/** SSE response chunk from the agent */
interface AgentResponseChunk {
  text: string;
  isStreaming?: boolean;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
  toolCalls?: Array<{
    toolName: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
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
  const abortControllerRef = React.useRef<AbortController | null>(null);

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
   * Build message history for API request
   */
  const buildHistory = React.useCallback(() => {
    return session.messages
      .filter((msg) => msg.status === 'complete')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));
  }, [session.messages]);

  /**
   * Connect to the chat service
   */
  const connect = React.useCallback(() => {
    setSession((prev) => ({ ...prev, connectionState: 'connecting' }));
    // Connection is now immediate since we use HTTP streaming
    setSession((prev) => ({ ...prev, connectionState: 'connected' }));
  }, []);

  /**
   * Disconnect from the chat service
   */
  const disconnect = React.useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSession((prev) => ({ ...prev, connectionState: 'disconnected' }));
  }, []);

  /**
   * Cancel current streaming request
   */
  const cancel = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSession((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  /**
   * Parse SSE stream from the agent API
   */
  async function* parseSSEStream(
    stream: ReadableStream<Uint8Array>
  ): AsyncGenerator<AgentResponseChunk> {
    const decoder = new TextDecoder();
    const reader = stream.getReader();
    let buffer = '';

    try {
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          buffer += decoder.decode(result.value, { stream: true });
        }

        // Parse complete SSE messages
        const lines = buffer.split('\n\n');
        const remaining = lines.pop();
        buffer = remaining ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const json = line.slice(6);
            try {
              yield JSON.parse(json) as AgentResponseChunk;
            } catch {
              console.warn('[useChat] Failed to parse SSE chunk:', json);
            }
          }
        }
      }

      // Parse any remaining buffer
      if (buffer.length > 0 && buffer.startsWith('data: ')) {
        const json = buffer.slice(6);
        try {
          yield JSON.parse(json) as AgentResponseChunk;
        } catch {
          // Ignore incomplete final chunk
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Send a message to the agent
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

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        // Build request body
        const history = buildHistory();
        const requestBody = {
          message: content,
          serviceId,
          sessionId: session.sessionId,
          history,
        };

        // Call the agent API
        const response = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error?.message || `Request failed with status ${response.status}`;
          throw new Error(errorMessage);
        }

        // Check if we have a stream
        if (!response.body) {
          throw new Error('Response has no body');
        }

        // Parse the SSE stream
        let lastText = '';
        for await (const chunk of parseSSEStream(response.body)) {
          // Handle errors in stream
          if (chunk.error) {
            throw new Error(chunk.error.message);
          }

          // Update message with streamed text
          if (chunk.text) {
            lastText = chunk.text;
            updateMessage(aiMessageId, { content: chunk.text });
          }

          // Handle tool calls (for future use)
          if (chunk.toolCalls && chunk.toolCalls.length > 0) {
            updateMessage(aiMessageId, {
              metadata: { toolCalls: chunk.toolCalls },
            });
          }
        }

        // Complete message
        const completedMessage: ChatMessage = {
          ...aiMessage,
          content: lastText,
          status: 'complete',
        };
        updateMessage(aiMessageId, {
          content: lastText,
          status: 'complete',
        });
        onResponseReceived?.(completedMessage);
      } catch (error) {
        // Handle abort
        if (error instanceof Error && error.name === 'AbortError') {
          updateMessage(aiMessageId, {
            status: 'complete',
            content: aiMessage.content || '(Cancelled)',
          });
          return;
        }

        const err = error instanceof Error ? error : new Error('Unknown error');
        updateMessage(aiMessageId, {
          status: 'error',
          error: err.message,
        });
        onError?.(err);
      } finally {
        abortControllerRef.current = null;
        setSession((prev) => ({ ...prev, isStreaming: false }));
      }
    },
    [
      session.connectionState,
      session.isStreaming,
      session.sessionId,
      serviceId,
      generateMessageId,
      addMessage,
      updateMessage,
      buildHistory,
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
      // Remove both the failed assistant message and the user message that triggered it
      setSession((prev) => ({
        ...prev,
        messages: prev.messages.slice(0, -2),
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
    cancel,
  };
}

export default useChat;
