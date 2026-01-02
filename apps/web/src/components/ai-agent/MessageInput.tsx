'use client';

import * as React from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MessageInputProps } from './types';

/**
 * Message Input Component
 *
 * Story 6-2: Chat Interface Foundation
 *
 * Input field for sending messages to the AI agent.
 * Supports keyboard shortcuts and auto-resize.
 */
export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: MessageInputProps) {
  const [message, setMessage] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = React.useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = message.trim();
      if (trimmed && !disabled) {
        onSend(trimmed);
        setMessage('');
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    },
    [message, disabled, onSend]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    },
    []
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-end gap-2 p-3 border-t bg-white', className)}
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          'flex-1 resize-none border border-slate-200 rounded-lg px-3 py-2',
          'text-sm placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'max-h-[150px] min-h-[40px]'
        )}
        aria-label="Message input"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !message.trim()}
        aria-label="Send message"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </form>
  );
}

export default MessageInput;
