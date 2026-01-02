'use client';

import * as React from 'react';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ChatMessage, MessageListProps } from './types';
import { StreamingMessage } from './StreamingMessage';

/**
 * Message List Component
 *
 * Story 6-2: Chat Interface Foundation
 *
 * Displays the list of messages in the chat.
 * Handles user/assistant distinction and auto-scrolls to new messages.
 */
export function MessageList({
  messages,
  isStreaming = false,
  className,
}: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className={cn('flex-1 flex items-center justify-center p-6', className)}>
        <div className="text-center text-slate-500">
          <Bot className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">Start a conversation</p>
          <p className="text-xs mt-1">Ask me to help configure your service</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('flex-1 px-4', className)} ref={scrollRef}>
      <div className="py-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

/**
 * Individual message bubble
 */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.status === 'error';
  const isStreamingMsg = message.status === 'streaming';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className={cn('h-8 w-8 shrink-0', isUser ? 'bg-black' : 'bg-slate-100')}>
        <AvatarFallback className={isUser ? 'bg-black text-white' : 'bg-slate-100 text-slate-600'}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2',
          isUser
            ? 'bg-black text-white'
            : 'bg-slate-100 text-slate-700',
          isError && 'bg-red-50 text-red-700 border border-red-200'
        )}
      >
        {isStreamingMsg ? (
          <StreamingMessage content={message.content} isStreaming />
        ) : (
          <div className="prose prose-sm max-w-none">
            {isError && message.error ? (
              <div>
                <p className="font-medium text-red-700">Error</p>
                <p className="text-sm">{message.error}</p>
              </div>
            ) : (
              <p className={cn('whitespace-pre-wrap', isUser && 'text-white')}>
                {message.content}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            'text-[10px] mt-1',
            isUser ? 'text-white/70' : 'text-slate-400'
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

/**
 * Format timestamp for display
 */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default MessageList;
