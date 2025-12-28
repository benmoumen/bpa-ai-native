'use client';

import { ReactNode, useCallback, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

interface SplitPanelProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  leftPanelHeader?: ReactNode;
  rightPanelHeader?: ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  className?: string;
}

/**
 * SplitPanel - Resizable split panel layout
 *
 * Features:
 * - Draggable divider for resizing
 * - Keyboard accessible resize (arrow keys)
 * - Persisted width via Zustand store
 * - Minimum/maximum width constraints (20-80%)
 * - Panel headers for context
 */
export function SplitPanel({
  leftPanel,
  rightPanel,
  leftPanelHeader,
  rightPanelHeader,
  defaultLeftWidth = 40,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  className,
}: SplitPanelProps) {
  const { leftPanelWidth, setLeftPanelWidth } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize with default if store has no value
  useEffect(() => {
    if (leftPanelWidth === 40 && defaultLeftWidth !== 40) {
      setLeftPanelWidth(defaultLeftWidth);
    }
  }, [defaultLeftWidth, leftPanelWidth, setLeftPanelWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedWidth = Math.min(Math.max(newWidth, minLeftWidth), maxLeftWidth);
      setLeftPanelWidth(clampedWidth);
    },
    [isDragging, minLeftWidth, maxLeftWidth, setLeftPanelWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 5 : 1;
      let newWidth = leftPanelWidth;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newWidth = Math.max(leftPanelWidth - step, minLeftWidth);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newWidth = Math.min(leftPanelWidth + step, maxLeftWidth);
          break;
        case 'Home':
          e.preventDefault();
          newWidth = minLeftWidth;
          break;
        case 'End':
          e.preventDefault();
          newWidth = maxLeftWidth;
          break;
        default:
          return;
      }

      setLeftPanelWidth(newWidth);
    },
    [leftPanelWidth, minLeftWidth, maxLeftWidth, setLeftPanelWidth]
  );

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full', className)}
    >
      {/* Left Panel */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ width: `${leftPanelWidth}%` }}
        role="region"
        aria-label="Left panel"
      >
        {leftPanelHeader && (
          <div className="shrink-0 border-b border-border bg-surface px-4 py-3">
            {leftPanelHeader}
          </div>
        )}
        <div className="flex-1 overflow-auto">{leftPanel}</div>
      </div>

      {/* Resize Handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(leftPanelWidth)}
        aria-valuemin={minLeftWidth}
        aria-valuemax={maxLeftWidth}
        aria-label="Resize panels"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        className={cn(
          'group relative flex w-1 shrink-0 cursor-col-resize items-center justify-center',
          'bg-border hover:bg-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'transition-colors duration-150',
          isDragging && 'bg-accent'
        )}
      >
        {/* Visual indicator */}
        <div
          className={cn(
            'absolute h-8 w-1 rounded-full bg-muted-foreground/30',
            'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
            'transition-opacity duration-150',
            isDragging && 'opacity-100'
          )}
        />
      </div>

      {/* Right Panel */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        role="region"
        aria-label="Right panel"
      >
        {rightPanelHeader && (
          <div className="shrink-0 border-b border-border bg-surface px-4 py-3">
            {rightPanelHeader}
          </div>
        )}
        <div className="flex-1 overflow-auto">{rightPanel}</div>
      </div>
    </div>
  );
}
