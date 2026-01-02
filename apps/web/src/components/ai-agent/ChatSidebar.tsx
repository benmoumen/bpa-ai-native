'use client';

import * as React from 'react';
import { X, Bot, Wifi, WifiOff, AlertCircle, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatSidebarProps, ChatSession } from './types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from './use-chat';
import { useGenerationFlow, GenerationStep } from './use-generation-flow';
import { GenerationProgress } from './GenerationProgress';
import { GenerationPreview } from './GenerationPreview';
import { GenerationSummary } from './GenerationSummary';

/**
 * Chat Sidebar Component
 *
 * Story 6-2: Chat Interface Foundation
 * Story 6-4: Service Generation Flow (Task 6 - Cancellation)
 *
 * Main chat interface for interacting with the AI agent.
 * Displays as a sidebar panel in the service builder.
 * Integrates generation progress tracking and cancellation.
 */
export function ChatSidebar({
  serviceId,
  userId,
  isOpen,
  onClose,
  className,
}: ChatSidebarProps) {
  // Use the real chat hook
  const {
    session,
    sendMessage,
    clearHistory,
    cancel: cancelChat,
    connect,
    disconnect,
  } = useChat({
    serviceId,
    userId,
    onError: (error) => {
      console.error('[ChatSidebar] Chat error:', error);
      generationFlow.setError(error.message);
    },
  });

  // Generation flow state machine
  const generationFlow = useGenerationFlow({
    serviceId,
    onStepChange: (step, prevStep) => {
      console.log('[ChatSidebar] Generation step:', prevStep, '->', step);
    },
    onComplete: (results) => {
      console.log('[ChatSidebar] Generation complete:', results);
    },
    onError: (error) => {
      console.error('[ChatSidebar] Generation error:', error);
    },
  });

  // Track if we're in generation mode
  const isGenerating = generationFlow.isGenerating;
  const isReviewStep = generationFlow.state.currentStep === GenerationStep.REVIEW;
  const [isSaving, setIsSaving] = React.useState(false);

  // Handle cancel with Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (session.isStreaming || isGenerating)) {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, session.isStreaming, isGenerating]);

  // Connect/disconnect based on sidebar open state
  React.useEffect(() => {
    if (isOpen) {
      connect();
    } else {
      disconnect();
    }
  }, [isOpen, connect, disconnect]);

  /**
   * Handle sending a message
   * Detects generation intent and starts flow if needed
   */
  const handleSendMessage = React.useCallback(
    async (content: string) => {
      // Check if this is a generation request
      const isGenerationRequest =
        content.toLowerCase().includes('create') ||
        content.toLowerCase().includes('generate') ||
        content.toLowerCase().includes('build a service');

      // Start generation flow if detected
      if (isGenerationRequest && !isGenerating) {
        generationFlow.start(session.sessionId, serviceId);
      }

      await sendMessage(content);
    },
    [sendMessage, session.sessionId, serviceId, isGenerating, generationFlow]
  );

  /**
   * Handle cancellation
   */
  const handleCancel = React.useCallback(() => {
    // Cancel the streaming request
    cancelChat();

    // Cancel the generation flow
    if (isGenerating) {
      generationFlow.cancel();
    }
  }, [cancelChat, isGenerating, generationFlow]);

  /**
   * Handle generation approval
   */
  const handleApprove = React.useCallback(async () => {
    setIsSaving(true);
    try {
      // TODO: Call API to save the generated configuration
      console.log('[ChatSidebar] Saving configuration:', generationFlow.state.results);

      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Complete the generation
      generationFlow.goToStep(GenerationStep.COMPLETED);
    } catch (error) {
      console.error('[ChatSidebar] Save error:', error);
      generationFlow.setError(
        error instanceof Error ? error.message : 'Failed to save configuration'
      );
    } finally {
      setIsSaving(false);
    }
  }, [generationFlow]);

  /**
   * Handle start over
   */
  const handleStartOver = React.useCallback(() => {
    generationFlow.clearStorage();
    clearHistory();
  }, [generationFlow, clearHistory]);

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
        <div className="flex items-center gap-1">
          {/* Cancel button during streaming/generation */}
          {(session.isStreaming || isGenerating) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              aria-label="Cancel"
              title="Cancel (Escape)"
              className="text-destructive hover:text-destructive"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Generation Progress (when generating) */}
      {isGenerating && !isReviewStep && (
        <div className="border-b p-3">
          <GenerationProgress
            currentStep={generationFlow.state.currentStep}
            completedSteps={generationFlow.state.completedSteps}
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Show review summary when complete */}
        {isReviewStep ? (
          <div className="flex-1 overflow-y-auto p-4">
            <GenerationSummary
              results={generationFlow.state.results}
              isSaving={isSaving}
              onApprove={handleApprove}
              onStartOver={handleStartOver}
            />
          </div>
        ) : (
          <>
            {/* Messages */}
            <MessageList
              messages={session.messages}
              isStreaming={session.isStreaming}
              className="flex-1"
            />

            {/* Generation Preview (partial results) */}
            {isGenerating && (
              <div className="border-t p-3 max-h-64 overflow-y-auto">
                <GenerationPreview
                  currentStep={generationFlow.state.currentStep}
                  completedSteps={generationFlow.state.completedSteps}
                  results={generationFlow.state.results}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Input (hidden during review) */}
      {!isReviewStep && (
        <MessageInput
          onSend={handleSendMessage}
          disabled={session.isStreaming || session.connectionState !== 'connected'}
          placeholder={
            session.connectionState !== 'connected'
              ? 'Connecting...'
              : session.isStreaming
                ? 'AI is responding...'
                : 'Ask the AI to configure your service...'
          }
        />
      )}

      {/* Resume prompt (if can resume) */}
      {generationFlow.canResume &&
        !isGenerating &&
        generationFlow.state.currentStep !== GenerationStep.COMPLETED && (
          <div className="border-t p-3 bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Previous generation in progress
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartOver}
                >
                  Discard
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => generationFlow.resume()}
                >
                  Resume
                </Button>
              </div>
            </div>
          </div>
        )}
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
