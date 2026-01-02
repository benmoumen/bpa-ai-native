'use client';

import { cn } from '@/lib/utils';
import type { StreamingMessageProps } from './types';

/**
 * Streaming Message Component
 *
 * Story 6-2: Chat Interface Foundation
 *
 * Displays a message that is being streamed from the AI agent.
 * Shows a typing indicator while streaming.
 */
export function StreamingMessage({
  content,
  isStreaming,
  className,
}: StreamingMessageProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="prose prose-sm max-w-none text-slate-700">
        {content}
        {isStreaming && <TypingIndicator />}
      </div>
    </div>
  );
}

/**
 * Typing indicator with animated dots
 */
function TypingIndicator() {
  return (
    <span className="inline-flex items-center ml-1" aria-label="AI is typing">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    </span>
  );
}

export default StreamingMessage;
