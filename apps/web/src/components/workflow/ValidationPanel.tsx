'use client';

/**
 * ValidationPanel - Workflow validation UI component
 * Story 4-8: Workflow Validation
 */

import { useState } from 'react';
import { useWorkflowValidation } from '@/hooks/use-roles';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { ValidationResult, ValidationIssue } from '@/lib/api/roles';

interface ValidationPanelProps {
  serviceId: string;
  className?: string;
}

function ValidationIssueItem({ issue }: { issue: ValidationIssue }) {
  const isError = issue.severity === 'ERROR';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border p-3',
        isError
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
          : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30'
      )}
    >
      {isError ? (
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      ) : (
        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            isError
              ? 'text-red-800 dark:text-red-200'
              : 'text-yellow-800 dark:text-yellow-200'
          )}
        >
          {issue.message}
        </p>
        {issue.roleName && (
          <p className="mt-1 text-xs text-muted-foreground">
            Affected role: {issue.roleName}
          </p>
        )}
      </div>
    </div>
  );
}

function ValidationSuccess() {
  return (
    <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-800 dark:text-green-200">
        Workflow Valid
      </AlertTitle>
      <AlertDescription className="text-green-700 dark:text-green-300">
        All validation checks passed. The workflow is ready for publishing.
      </AlertDescription>
    </Alert>
  );
}

function ValidationIssues({ result }: { result: ValidationResult }) {
  const errors = result.issues.filter((i) => i.severity === 'ERROR');
  const warnings = result.issues.filter((i) => i.severity === 'WARNING');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        {result.errorCount > 0 && (
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {result.errorCount} error{result.errorCount !== 1 ? 's' : ''}
          </span>
        )}
        {result.warningCount > 0 && (
          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            {result.warningCount} warning{result.warningCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
            Errors (must fix before publishing)
          </h4>
          {errors.map((issue, index) => (
            <ValidationIssueItem key={`error-${index}`} issue={issue} />
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Warnings (review recommended)
          </h4>
          {warnings.map((issue, index) => (
            <ValidationIssueItem key={`warning-${index}`} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ValidationPanel({ serviceId, className }: ValidationPanelProps) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const { mutate: validate, isPending } = useWorkflowValidation(serviceId);

  const handleValidate = () => {
    validate(undefined, {
      onSuccess: (data) => {
        setResult(data);
      },
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-black dark:text-white">
            Workflow Validation
          </h3>
          <p className="text-sm text-muted-foreground">
            Check workflow for completeness and errors
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleValidate}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Validate
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="rounded-lg border bg-background p-4">
          {result.isValid ? (
            <ValidationSuccess />
          ) : (
            <ValidationIssues result={result} />
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Last validated: {new Date(result.validatedAt).toLocaleString()}
          </p>
        </div>
      )}

      {!result && !isPending && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Click &quot;Validate&quot; to check the workflow configuration
          </p>
        </div>
      )}
    </div>
  );
}

export default ValidationPanel;
