'use client';

import * as React from 'react';
import { AlertTriangle, Check, X, Clock, Info, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PendingAction } from './types';

/**
 * Confirmation timeout in milliseconds (60 seconds)
 */
const CONFIRMATION_TIMEOUT_MS = 60_000;

/**
 * Risk level configuration
 */
const RISK_CONFIG = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Action Confirmation',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Please Confirm',
  },
  danger: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Caution Required',
  },
};

interface ConfirmationDialogProps {
  /** The pending action requiring confirmation */
  action: PendingAction | null;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when action is confirmed */
  onConfirm: (actionId: string) => void;
  /** Callback when action is rejected */
  onReject: (actionId: string) => void;
  /** Callback when confirmation times out */
  onTimeout?: (actionId: string) => void;
  /** CSS class name */
  className?: string;
}

/**
 * Confirmation Dialog Component
 *
 * Story 6-3: Confirmation Flow UI
 *
 * Modal dialog for confirming AI agent actions.
 * Shows action preview and supports keyboard shortcuts.
 */
export function ConfirmationDialog({
  action,
  isOpen,
  onConfirm,
  onReject,
  onTimeout,
  className,
}: ConfirmationDialogProps) {
  const [timeRemaining, setTimeRemaining] = React.useState(CONFIRMATION_TIMEOUT_MS);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (!isOpen || !action) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onConfirm(action.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onReject(action.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, action, onConfirm, onReject]);

  // Handle timeout
  React.useEffect(() => {
    if (!isOpen || !action) {
      // Clear timers when closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Reset time remaining
    setTimeRemaining(CONFIRMATION_TIMEOUT_MS);

    // Set up countdown interval
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout?.(action.id);
    }, CONFIRMATION_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, action, onTimeout]);

  if (!action) {
    return null;
  }

  const config = RISK_CONFIG[action.riskLevel];
  const Icon = config.icon;
  const secondsRemaining = Math.ceil(timeRemaining / 1000);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onReject(action.id)}>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                config.bgColor
              )}
            >
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription className="mt-1">
                The AI agent wants to perform an action
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Action description */}
          <div
            className={cn(
              'rounded-lg border p-4',
              config.bgColor,
              config.borderColor
            )}
          >
            <h4 className="font-medium text-sm text-slate-900">
              {action.toolName}
            </h4>
            <p className="mt-1 text-sm text-slate-600">{action.description}</p>

            {/* Parameters preview */}
            {Object.keys(action.params).length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">
                  Parameters
                </p>
                <div className="rounded bg-white/50 p-2 font-mono text-xs text-slate-700 overflow-x-auto">
                  {Object.entries(action.params).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-slate-500">{key}:</span>
                      <span className="text-slate-900">
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constraint info */}
            {action.constraintId && (
              <p className="mt-2 text-xs text-slate-500">
                Triggered by constraint: {action.constraintId}
              </p>
            )}
          </div>

          {/* Timeout indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>
              Auto-reject in{' '}
              <span className={cn(secondsRemaining <= 10 && 'text-red-500 font-medium')}>
                {secondsRemaining}s
              </span>
            </span>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onReject(action.id)}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Reject
            <span className="ml-2 text-xs text-slate-400">(Esc)</span>
          </Button>
          <Button
            onClick={() => onConfirm(action.id)}
            className="flex-1"
          >
            <Check className="mr-2 h-4 w-4" />
            Confirm
            <span className="ml-2 text-xs text-slate-300">(Enter)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmationDialog;
